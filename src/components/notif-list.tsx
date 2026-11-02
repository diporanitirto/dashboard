"use client";

import { useCallback, useEffect, useState } from "react";

interface Notif {
  id: number;
  title: string;
  body: string | null;
  url: string | null;
  read: boolean;
  created_at: string;
}

export default function NotifList() {
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/push/log", { credentials: "include" });
      const data = await res.json();
      if (data?.success) {
        setItems(data.data ?? []);
        setUnread((data.data ?? []).filter((n: Notif) => !n.read).length);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markAllRead = async () => {
    await fetch("/api/push/log", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  };

  const markRead = async (id: number) => {
    await fetch("/api/push/log", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        {unread > 0 && (
          <span className="text-xs font-medium text-destructive">{unread} belum dibaca</span>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded-md border px-2 py-1 text-xs hover:bg-accent disabled:opacity-60"
          >
            {loading ? "Memuat..." : "Refresh"}
          </button>
          {unread > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
            >
              Tandai semua dibaca
            </button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Belum ada notifikasi.</p>
      ) : (
        <ul className="max-h-64 space-y-1 overflow-y-auto">
          {items.map((n) => (
            <li
              key={n.id}
              className={`rounded-md border px-3 py-2 text-xs ${n.read ? "bg-background" : "bg-amber-50 border-amber-200"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-scoutBrown-900">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-muted-foreground">{n.body}</p>}
                  <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
                    {new Date(n.created_at).toLocaleString("id-ID")}
                  </p>
                </div>
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => markRead(n.id)}
                    className="shrink-0 text-[0.65rem] text-primary hover:underline"
                  >
                    Tandai dibaca
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}