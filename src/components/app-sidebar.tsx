"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { LayoutDashboard, Users, UserCog, FileCheck, FileSpreadsheet, LogOut, Menu, X, ScanQrCode } from "lucide-react";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/siswa", label: "Siswa", icon: Users },
  { href: "/pendamping", label: "Pendamping Kelas", icon: UserCog },
  { href: "/izin", label: "Izin", icon: FileCheck },
  { href: "/rekap", label: "Rekap", icon: FileSpreadsheet },
  { href: "/scan", label: "Scan QR", icon: ScanQrCode },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const navContent = (
    <>
      <div className="mb-8 flex items-center gap-3 px-1">
        <Image src="/assets/logo-diporani.png" alt="Logo Diporani" width={36} height={36} className="rounded-md" />
        <div>
          <p className="text-base font-bold leading-tight">DIPORANI</p>
          <p className="text-xs text-muted-foreground">Manajemen Izin</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={async () => {
          await fetch("/api/logout", { method: "POST" });
          window.location.href = "/login";
        }}
        className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        Keluar
      </button>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b bg-card px-4 py-3 md:hidden">
        <button onClick={() => setOpen(true)} aria-label="Buka menu">
          <Menu className="h-5 w-5" />
        </button>
        <Image src="/assets/logo-diporani.png" alt="Logo Diporani" width={28} height={28} className="rounded-md" />
        <p className="font-bold">DIPORANI</p>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r bg-card p-4">
            <button className="absolute right-3 top-3" onClick={() => setOpen(false)} aria-label="Tutup menu">
              <X className="h-5 w-5" />
            </button>
            {navContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r bg-card p-4 md:flex">{navContent}</aside>
    </>
  );
}
