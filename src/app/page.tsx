'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { AuthPanel } from '@/components/AuthPanel';
import { useProfile } from '@/components/ProfileProvider';
import { PANGKAT_LABELS, ROLE_LABELS, type DashboardRole, type DashboardProfile } from '@/lib/auth';

type Feature = {
  key: 'agenda' | 'materi' | 'dokumentasi' | 'profil' | 'izin' | 'arsip' | 'anggota';
  title: string;
  description: string;
  href: string;
  requiredRoles?: DashboardRole[];
  public?: boolean;
};

const FEATURES: Feature[] = [
  {
    key: 'agenda',
    title: 'Agenda Kegiatan',
    description: 'Susun rapat, latihan, dan agenda besar BPH secara terkoordinasi.',
    href: '/agenda',
    requiredRoles: ['bph'],
  },
  {
    key: 'materi',
    title: 'Upload Materi',
    description: 'Bagikan modul latihan, bahan badge, dan referensi pembinaan.',
    href: '/materi',
    requiredRoles: ['materi'],
  },
  {
    key: 'dokumentasi',
    title: 'Dokumentasi Kegiatan',
    description: 'Unggah foto dan video kegiatan untuk arsip dan publikasi.',
    href: '/dokumentasi',
    requiredRoles: ['media'],
  },
  {
    key: 'anggota',
    title: 'Daftar Anggota',
    description: 'Kelola dan pantau semua anggota yang terdaftar dengan filter & sorting.',
    href: '/anggota',
    requiredRoles: ['admin', 'bph'],
  },
  {
    key: 'profil',
    title: 'Profil Anggota',
    description: 'Perbarui data diri, pangkat, dan kontak darurat setiap anggota.',
    href: '/profil',
    requiredRoles: ['bph', 'materi', 'media', 'anggota'],
  },
  {
    key: 'izin',
    title: 'Monitoring Izin',
    description: 'Pantau dan kelola permohonan izin kehadiran anggota secara real-time.',
    href: '/izin',
    public: true,
  },
  {
    key: 'arsip',
    title: 'Arsip Izin',
    description: 'Telusuri rekap mingguan izin yang tersimpan rapi di arsip digital.',
    href: '/arsip',
    public: true,
  },
];

const formatRoles = (roles: DashboardRole[]) => roles.map((role) => ROLE_LABELS[role]).join(', ');

const getRequirementLabel = (feature: Feature) => {
  if (feature.public) return 'Terbuka untuk semua pengurus';
  if (feature.key === 'profil') return 'Untuk seluruh anggota yang masuk';
  if (feature.requiredRoles && feature.requiredRoles.length > 0) {
    return `Peran: ${formatRoles(feature.requiredRoles)}`;
  }
  return 'Butuh akun Diporani';
};

const evaluateAccess = (
  feature: Feature,
  hasSession: boolean,
  profile: DashboardProfile | null,
) => {
  if (feature.public) {
    return { allowed: true, reason: null as string | null };
  }

  if (!hasSession) {
    return { allowed: false, reason: 'Masuk terlebih dahulu untuk membuka fitur ini.' };
  }

  if (feature.key === 'profil') {
    return { allowed: true, reason: null };
  }

  if (!feature.requiredRoles || feature.requiredRoles.length === 0) {
    if (!profile) {
      return { allowed: false, reason: 'Lengkapi data di halaman Profil untuk melanjutkan.' };
    }
    return { allowed: true, reason: null };
  }

  if (!profile) {
    return { allowed: false, reason: 'Lengkapi data di halaman Profil untuk melanjutkan.' };
  }

  // Admin bisa akses semua fitur
  if (profile.role === 'admin') {
    return { allowed: true, reason: null };
  }

  if (feature.requiredRoles.includes(profile.role)) {
    return { allowed: true, reason: null };
  }

  return {
    allowed: false,
    reason: `Hanya untuk ${formatRoles(feature.requiredRoles)}.`,
  };
};

const FeatureCard = ({
  feature,
  allowed,
  requirement,
  reason,
}: {
  feature: Feature;
  allowed: boolean;
  requirement: string;
  reason: string | null;
}) => {
  const baseClass =
    'flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition';
  const content = (
    <>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">Fitur</p>
        <h3 className="mt-2 text-lg font-semibold text-slate-900">{feature.title}</h3>
        <p className="mt-3 text-sm text-slate-600">{feature.description}</p>
      </div>
      <div className="mt-6 flex items-center justify-between text-sm">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
          {requirement}
        </span>
        {allowed ? (
          <span className="text-emerald-600">Buka →</span>
        ) : (
          <span className="text-slate-400">{reason ?? 'Akses terbatas'}</span>
        )}
      </div>
    </>
  );

  if (allowed) {
    return (
      <Link href={feature.href} className={`${baseClass} hover:-translate-y-1 hover:shadow-lg`}>
        {content}
      </Link>
    );
  }

  return (
    <div className={`${baseClass} opacity-60`} aria-disabled>
      {content}
    </div>
  );
};

export default function LandingPage() {
  const { profile, session, loading } = useProfile();
  const hasSession = Boolean(session);

  const cards = useMemo(
    () =>
      FEATURES.map((feature) => {
        const { allowed, reason } = evaluateAccess(feature, hasSession, profile);
        return {
          feature,
          allowed,
          reason,
          requirement: getRequirementLabel(feature),
        };
      }),
    [hasSession, profile],
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <section className="grid gap-8 rounded-3xl bg-gradient-to-br from-sky-200 via-blue-200 to-indigo-200 px-8 py-12 shadow-2xl md:grid-cols-[1.15fr_0.85fr]">
        <div className="flex flex-col justify-center">
          <span className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-600">
            Diporani Tirto
          </span>
          <h1 className="mt-4 text-4xl font-bold text-slate-900 sm:text-5xl">
            Satu portal untuk izin, agenda, materi, dan dokumentasi Pramuka.
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-700 sm:text-lg">
            Dashboard ini memusatkan kebutuhan administrasi, koordinasi kegiatan, dan arsip dokumentasi
            Diporani Tirto. Kelola izin, unggah materi latihan, susun agenda BPH, dan pastikan semua anggota
            memiliki profil yang rapi.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-700">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Sistem role-based access
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-semibold shadow-sm">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              Terhubung dengan Supabase
            </span>
          </div>
        </div>
        <div className="flex items-center justify-end">
          {hasSession ? (
            <div className="w-full max-w-sm rounded-3xl border border-white/50 bg-white/80 p-6 backdrop-blur">
              <p className="text-sm font-medium text-slate-700">
                Selamat datang, {profile?.full_name ?? session?.user.email ?? 'Pengguna'}!
              </p>
              <dl className="mt-4 space-y-2 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <dt>Peran</dt>
                  <dd className="font-semibold text-slate-900">
                    {profile ? ROLE_LABELS[profile.role] : 'Belum ditetapkan'}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Pangkat</dt>
                  <dd className="font-semibold text-slate-900">
                    {profile ? PANGKAT_LABELS[profile.pangkat] : 'Lengkapi profil'}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Email</dt>
                  <dd className="font-mono text-xs text-slate-500">{session?.user.email ?? '-'}</dd>
                </div>
              </dl>
              <Link
                href="/profil"
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
              >
                Kelola Profil
              </Link>
            </div>
          ) : (
            <AuthPanel />
          )}
        </div>
      </section>
      {loading ? (
        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Memuat profil pengguna...
        </div>
      ) : hasSession && !profile ? (
        <div className="mt-10 rounded-3xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-800">
          <p className="font-semibold">Lengkapi Profil</p>
          <p className="mt-1">
            Kamu sudah masuk, namun data profil belum lengkap. Silakan buka halaman{' '}
            <Link href="/profil" className="font-semibold text-amber-900 underline">
              profil anggota
            </Link>{' '}
            untuk mengisi pangkat dan informasi lainnya.
          </p>
        </div>
      ) : null}
      <section className="mt-12">
  <h2 className="text-2xl font-semibold text-slate-900">Navigasi Fitur</h2>
  <p className="mt-2 text-sm text-slate-600">
          Pilih laman sesuai kebutuhan peranmu. Akses akan otomatis menyesuaikan dengan role yang tercatat di profil.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cards.map(({ feature, allowed, reason, requirement }) => (
            <FeatureCard
              key={feature.key}
              feature={feature}
              allowed={allowed}
              reason={reason}
              requirement={requirement}
            />
          ))}
        </div>
      </section>
      </div>
    </div>
  );
}
