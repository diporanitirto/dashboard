"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  UserCog,
  FileCheck,
  FileSpreadsheet,
  LogOut,
  Menu,
  X,
  ScanQrCode,
  ShieldCheck,
  TriangleAlert,
  ChevronDown,
} from "lucide-react";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/siswa", label: "Siswa", icon: Users },
  { href: "/pendamping", label: "Pendamping Kelas", icon: UserCog },
  { href: "/izin", label: "Izin", icon: FileCheck },
  { href: "/pelanggaran", label: "Pelanggaran", icon: TriangleAlert },
  { href: "/rekap", label: "Rekap", icon: FileSpreadsheet },
  { href: "/scan", label: "Scan QR", icon: ScanQrCode },
  { href: "/admin", label: "Akun Admin", icon: ShieldCheck },
];

const pelanggaranSub = [
  { href: "/pelanggaran/catat", label: "Catat" },
  { href: "/pelanggaran/daftar", label: "Daftar & Verifikasi" },
  { href: "/pelanggaran/rekap", label: "Rekap" },
  { href: "/pelanggaran/pengaturan", label: "Pengaturan" },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [menunggu, setMenunggu] = useState(0);
  const pathname = usePathname();

  const inPelanggaran = pathname === "/pelanggaran" || pathname.startsWith("/pelanggaran/");
  const [pelanggaranOpen, setPelanggaranOpen] = useState(true);

  useEffect(() => {
    if (inPelanggaran) setPelanggaranOpen(true);
  }, [inPelanggaran]);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => setCurrentUser(d.username ?? null))
      .catch(() => {});
    fetch("/api/pelanggaran/menunggu")
      .then((r) => r.json())
      .then((d) => setMenunggu(typeof d.count === "number" ? d.count : 0))
      .catch(() => {});
  }, [pathname]);

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
          if (href === "/pelanggaran") {
            return (
              <div key={href}>
                <button
                  type="button"
                  onClick={() => setPelanggaranOpen((v) => !v)}
                  aria-expanded={pelanggaranOpen}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    inPelanggaran
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {menunggu > 0 && (
                    <span className="ml-auto inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-100 px-1 text-[0.6rem] font-bold text-amber-800">
                      {menunggu}
                    </span>
                  )}
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform ${pelanggaranOpen ? "rotate-180" : ""} ${
                      menunggu > 0 ? "ml-1" : "ml-auto"
                    }`}
                  />
                </button>
                {pelanggaranOpen && (
                  <div className="mt-1 space-y-0.5 pl-3">
                    {pelanggaranSub.map((s) => (
                      <Link
                        key={s.href}
                        href={s.href}
                        onClick={() => setOpen(false)}
                        className={`block rounded-lg px-3 py-1.5 text-sm transition-colors ${
                          pathname === s.href
                            ? "bg-primary/10 font-semibold text-primary"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                      >
                        {s.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

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
      {currentUser && (
        <p className="mt-4 px-1 text-xs text-muted-foreground">
          Masuk sebagai <span className="font-semibold text-foreground">{currentUser}</span>
        </p>
      )}
      <button
        type="button"
        onClick={async () => {
          await fetch("/api/logout", { method: "POST" });
          window.location.href = "/login";
        }}
        className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
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
        <p className="font-bold flex-1">DIPORANI</p>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col overflow-y-auto border-r bg-card p-4">
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
