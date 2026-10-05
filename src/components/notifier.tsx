"use client";

import { useEffect, useRef, useState } from "react";

export function notify(msg: string) {
  window.dispatchEvent(new CustomEvent("app-notify", { detail: msg }));
}

export default function Notifier() {
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const seenIds = useRef<Set<string> | null>(null);
  const nextId = useRef(1);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    const addToast = (msg: string) => {
      const id = nextId.current++;
      setToasts((t) => [...t, { id, msg }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
    };

    const onNotify = (e: Event) => addToast((e as CustomEvent<string>).detail);
    window.addEventListener("app-notify", onNotify);

    const poll = async () => {
      try {
        const res = await fetch("/api/izin/terbaru");
        const d = await res.json();
        const rows: { id: string; nama: string; kelas: string }[] = d.data ?? [];
        if (seenIds.current === null) {
          seenIds.current = new Set(rows.map((r) => r.id));
          return;
        }
        for (const r of rows) {
          if (!seenIds.current.has(r.id)) {
            seenIds.current.add(r.id);
            addToast(`Izin baru: ${r.nama} (${r.kelas})`);
          }
        }
      } catch {}
    };
    poll();
    timer = setInterval(poll, 15000);

    return () => {
      window.removeEventListener("app-notify", onNotify);
      clearInterval(timer);
    };
  }, []);

  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="rounded-lg border bg-card px-4 py-3 text-sm shadow-lg">
          {t.msg}
        </div>
      ))}
    </div>
  );
}
