"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/components/notifier";

export default function AdminPage() {
  const [users, setUsers] = useState<{ username: string; password?: string; created_at: string }[]>([]);
  const [canViewPassword, setCanViewPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const load = () =>
    fetch("/api/admin-users")
      .then((r) => r.json())
      .then((d) => {
        setUsers(d.data ?? []);
        setCanViewPassword(!!d.canViewPassword);
      });

  useEffect(() => {
    load();
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setUsername("");
      setPassword("");
      notify("Akun ditambahkan.");
      load();
    } else {
      notify(d.error ?? "Gagal.");
    }
  };

  const remove = async (u: string) => {
    if (!confirm(`Hapus akun ${u}?`)) return;
    await fetch("/api/admin-users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u }),
    });
    notify(`Akun ${u} dihapus.`);
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Akun Admin</h1>
      <Card>
        <CardHeader>
          <CardTitle>Tambah Akun</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={add} className="flex flex-col gap-3 sm:flex-row">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Tambah
            </button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Daftar Akun</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada akun.</p>
          ) : (
            <ul className="divide-y">
              {users.map((u) => (
                <li key={u.username} className="flex items-center justify-between py-2 text-sm">
                  <span>{u.username}{canViewPassword && u.password ? ` — ${u.password}` : ""}</span>
                  <div className="flex items-center gap-3">
                    {canViewPassword && u.password && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`username: ${u.username}\npassword: ${u.password}`);
                          notify(`Disalin: ${u.username}`);
                        }}
                        className="text-xs text-primary"
                      >
                        Copy
                      </button>
                    )}
                    <button onClick={() => remove(u.username)} className="text-destructive text-xs">
                      Hapus
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
