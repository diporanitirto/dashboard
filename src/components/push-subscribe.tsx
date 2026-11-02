"use client";

import { useEffect, useState } from "react";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export default function PushSubscribe() {
  const [status, setStatus] = useState<string>("memuat...");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("Browser tidak mendukung notifikasi push.");
      return;
    }
    navigator.serviceWorker.register("/sw-v2.js").then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub ? "Notifikasi aktif." : "Notifikasi belum aktif.");
    }).catch(() => setStatus("Gagal memuat service worker."));
  }, []);

  const aktifkan = async () => {
    if (!PUBLIC_KEY) { setStatus("VAPID public key belum diset."); return; }
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error("Gagal menyimpan subscription.");
      setStatus("Notifikasi aktif.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Gagal mengaktifkan.");
    } finally {
      setBusy(false);
    }
  };

  const nonaktifkan = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("Notifikasi nonaktif.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Gagal.");
    } finally {
      setBusy(false);
    }
  };

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return <p className="text-xs text-muted-foreground">Browser tidak mendukung push notification.</p>;
  }

  const aktif = status === "Notifikasi aktif.";
  return (
    <div className="flex flex-wrap items-center gap-2">
      {!aktif && <span className="text-xs text-muted-foreground">{status}</span>}
      {aktif ? (
        <button
          type="button"
          disabled={busy}
          onClick={nonaktifkan}
          className="rounded-md border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent disabled:opacity-60"
        >
          {busy ? "Memproses..." : "Nonaktifkan"}
        </button>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={aktifkan}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-60"
        >
          {busy ? "Memproses..." : "Aktifkan notifikasi"}
        </button>
      )}
    </div>
  );
}