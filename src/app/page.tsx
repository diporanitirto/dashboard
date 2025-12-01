'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AuthPanel } from '@/components/AuthPanel';
import { useProfile } from '@/components/ProfileProvider';
import { TINGKATAN_LABELS, JABATAN_LABELS, ROLE_LABELS, type DashboardRole, type DashboardProfile } from '@/lib/auth';

// ============== ICONS ==============
const UsersIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const ClipboardIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
  </svg>
);

const CameraIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
  </svg>
);

const ArchiveIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
  </svg>
);

const UserIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

// ============== TYPES ==============
type Feature = {
  key: 'agenda' | 'materi' | 'dokumentasi' | 'profil' | 'izin' | 'arsip' | 'anggota';
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  requiredRoles?: DashboardRole[];
  public?: boolean;
};

type StatCard = {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
};

// ============== DATA ==============
const FEATURES: Feature[] = [
  {
    key: 'agenda',
    title: 'Agenda',
    description: 'Kelola rapat & kegiatan',
    href: '/agenda',
    icon: <CalendarIcon />,
    color: 'from-blue-500 to-blue-600',
    requiredRoles: ['bph'],
  },
  {
    key: 'materi',
    title: 'Materi',
    description: 'Upload modul latihan',
    href: '/materi',
    icon: <DocumentIcon />,
    color: 'from-purple-500 to-purple-600',
    requiredRoles: ['materi'],
  },
  {
    key: 'dokumentasi',
    title: 'Dokumentasi',
    description: 'Unggah foto & video',
    href: '/dokumentasi',
    icon: <CameraIcon />,
    color: 'from-pink-500 to-pink-600',
    requiredRoles: ['media'],
  },
  {
    key: 'anggota',
    title: 'Anggota',
    description: 'Kelola data anggota',
    href: '/anggota',
    icon: <UsersIcon />,
    color: 'from-emerald-500 to-emerald-600',
    requiredRoles: ['admin', 'bph'],
  },
  {
    key: 'izin',
    title: 'Monitoring Izin',
    description: 'Pantau izin kehadiran',
    href: '/izin',
    icon: <ClipboardIcon />,
    color: 'from-amber-500 to-amber-600',
    public: true,
  },
  {
    key: 'arsip',
    title: 'Arsip Izin',
    description: 'Rekap mingguan izin',
    href: '/arsip',
    icon: <ArchiveIcon />,
    color: 'from-cyan-500 to-cyan-600',
    public: true,
  },
  {
    key: 'profil',
    title: 'Profil',
    description: 'Perbarui data diri',
    href: '/profil',
    icon: <UserIcon />,
    color: 'from-slate-500 to-slate-600',
    requiredRoles: ['bph', 'materi', 'media', 'anggota'],
  },
];

// ============== HELPERS ==============
const formatRoles = (roles: DashboardRole[]) => roles.map((role) => ROLE_LABELS[role]).join(', ');

const evaluateAccess = (
  feature: Feature,
  hasSession: boolean,
  profile: DashboardProfile | null,
) => {
  if (feature.public) return { allowed: true, reason: null as string | null };
  if (!hasSession) return { allowed: false, reason: 'Login diperlukan' };
  if (feature.key === 'profil') return { allowed: true, reason: null };
  if (!profile) return { allowed: false, reason: 'Lengkapi profil' };
  if (profile.role === 'admin') return { allowed: true, reason: null };
  if (feature.requiredRoles?.includes(profile.role)) return { allowed: true, reason: null };
  return { allowed: false, reason: `Hanya ${formatRoles(feature.requiredRoles || [])}` };
};

// ============== COMPONENTS ==============
const StatCardComponent = ({ card }: { card: StatCard }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 transition hover:border-slate-700">
    <div className="flex items-center justify-between">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} text-white shadow-lg`}>
        {card.icon}
      </div>
    </div>
    <div className="mt-4">
      <p className="text-sm text-slate-400">{card.title}</p>
      <h3 className="mt-1 text-2xl font-bold text-slate-100">{card.value}</h3>
    </div>
  </div>
);

const QuickActionCard = ({ 
  feature, 
  allowed 
}: { 
  feature: Feature; 
  allowed: boolean;
}) => {
  const content = (
    <div className={`group flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition ${
      allowed ? 'hover:border-slate-700 hover:bg-slate-800/60' : 'opacity-50'
    }`}>
      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${feature.color} text-white shadow-md`}>
        {feature.icon}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-semibold text-slate-100">{feature.title}</h4>
        <p className="truncate text-xs text-slate-400">{feature.description}</p>
      </div>
      {allowed && (
        <div className="text-slate-500 transition group-hover:text-emerald-400">
          <ArrowRightIcon />
        </div>
      )}
    </div>
  );

  if (allowed) {
    return <Link href={feature.href}>{content}</Link>;
  }
  return content;
};

const ProfileCard = ({ 
  profile, 
  session 
}: { 
  profile: DashboardProfile | null; 
  session: { user: { email?: string } } | null;
}) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
    <div className="flex items-center gap-4">
      {profile?.avatar_url ? (
        <div className="relative h-14 w-14 flex-shrink-0">
          <Image
            src={profile.avatar_url}
            alt={profile.full_name || 'Avatar'}
            fill
            className="rounded-full object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-xl font-bold text-white shadow-lg">
          {profile?.full_name?.[0]?.toUpperCase() || session?.user.email?.[0]?.toUpperCase() || '?'}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-lg font-semibold text-slate-100">
          {profile?.full_name || 'Pengguna Baru'}
        </h3>
        <p className="truncate text-sm text-slate-400">
          {session?.user.email}
        </p>
      </div>
    </div>

    <div className="mt-5 space-y-3">
      <div className="flex items-center justify-between rounded-lg bg-slate-800/50 px-4 py-2.5">
        <span className="text-sm text-slate-400">Peran</span>
        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
          {profile ? ROLE_LABELS[profile.role] : 'Belum ditetapkan'}
        </span>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-slate-800/50 px-4 py-2.5">
        <span className="text-sm text-slate-400">Tingkatan</span>
        <span className="text-sm font-medium text-slate-200">
          {profile?.tingkatan ? TINGKATAN_LABELS[profile.tingkatan] : '-'}
        </span>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-slate-800/50 px-4 py-2.5">
        <span className="text-sm text-slate-400">Jabatan</span>
        <span className="text-sm font-medium text-slate-200">
          {profile?.jabatan ? JABATAN_LABELS[profile.jabatan] : '-'}
        </span>
      </div>
    </div>

    <Link
      href="/profil"
      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
    >
      Kelola Profil
      <ArrowRightIcon />
    </Link>
  </div>
);

// ============== MAIN PAGE ==============
export default function DashboardPage() {
  const { profile, session, loading } = useProfile();
  const hasSession = Boolean(session);
  
  // Stats
  const [stats, setStats] = useState<StatCard[]>([
    { title: 'Total Anggota', value: '-', icon: <UsersIcon />, color: 'from-blue-500 to-blue-600' },
    { title: 'Izin Minggu Ini', value: '-', icon: <ClipboardIcon />, color: 'from-amber-500 to-amber-600' },
    { title: 'Materi Tersedia', value: '-', icon: <DocumentIcon />, color: 'from-purple-500 to-purple-600' },
    { title: 'Agenda Mendatang', value: '-', icon: <CalendarIcon />, color: 'from-emerald-500 to-emerald-600' },
  ]);

  // Members grouped by role
  const [members, setMembers] = useState<DashboardProfile[]>([]);
  
  // Fetch stats from APIs
  useEffect(() => {
    if (!session) return;
    
    const fetchStats = async () => {
      try {
        // Fetch members count
        const membersRes = await fetch('/api/members', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const membersData = membersRes.ok ? await membersRes.json() : null;
        const membersList = membersData?.members ?? [];
        const totalMembers = membersList.length;
        
        // Store members for display
        setMembers(membersList);
        
        // Fetch materi count
        const materiRes = await fetch('/api/materi', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const materiData = materiRes.ok ? await materiRes.json() : { data: [] };
        const totalMateri = materiData?.data?.length ?? 0;
        
        // Fetch agenda count (upcoming only)
        const agendaRes = await fetch('/api/agenda', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const agendaData = agendaRes.ok ? await agendaRes.json() : [];
        const now = new Date();
        const upcomingAgenda = Array.isArray(agendaData) 
          ? agendaData.filter((a: { startAt?: string }) => a.startAt && new Date(a.startAt) > now).length 
          : 0;
        
        // Fetch izin count this week
        const izinRes = await fetch('/api/izin');
        const izinData = izinRes.ok ? await izinRes.json() : [];
        // Filter izin this week
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const izinThisWeek = Array.isArray(izinData) 
          ? izinData.filter((i: { created_at?: string }) => i.created_at && new Date(i.created_at) >= weekStart).length
          : 0;
        
        setStats([
          { title: 'Total Anggota', value: totalMembers, icon: <UsersIcon />, color: 'from-blue-500 to-blue-600' },
          { title: 'Izin Minggu Ini', value: izinThisWeek, icon: <ClipboardIcon />, color: 'from-amber-500 to-amber-600' },
          { title: 'Materi Tersedia', value: totalMateri, icon: <DocumentIcon />, color: 'from-purple-500 to-purple-600' },
          { title: 'Agenda Mendatang', value: upcomingAgenda, icon: <CalendarIcon />, color: 'from-emerald-500 to-emerald-600' },
        ]);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };
    
    fetchStats();
  }, [session]);

  const quickActions = useMemo(
    () =>
      FEATURES.map((feature) => ({
        feature,
        ...evaluateAccess(feature, hasSession, profile),
      })),
    [hasSession, profile],
  );

  // Group members by role with priority order: admin -> bph -> others
  const groupedMembers = useMemo(() => {
    const roleOrder: DashboardRole[] = ['admin', 'bph', 'materi', 'media', 'anggota'];
    const groups: { role: DashboardRole; label: string; members: DashboardProfile[]; color: string }[] = [];
    
    const roleColors: Record<DashboardRole, string> = {
      admin: 'from-red-500 to-red-600',
      bph: 'from-amber-500 to-amber-600',
      materi: 'from-purple-500 to-purple-600',
      media: 'from-pink-500 to-pink-600',
      anggota: 'from-slate-500 to-slate-600',
    };

    roleOrder.forEach((role) => {
      const roleMembers = members.filter((m) => m.role === role);
      if (roleMembers.length > 0) {
        groups.push({
          role,
          label: ROLE_LABELS[role],
          members: roleMembers,
          color: roleColors[role],
        });
      }
    });

    return groups;
  }, [members]);

  // Get initials from name
  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />
          <p className="text-sm text-slate-400">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 lg:px-6">
      <div>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Dashboard Diporani Tirto
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-slate-100 sm:text-3xl">
            {hasSession 
              ? `Selamat datang, ${profile?.full_name?.split(' ')[0] || 'Pengguna'}!` 
              : 'Selamat Datang di Dashboard'}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {hasSession 
              ? 'Kelola kegiatan, materi, dan data anggota Pramuka Diporani dari satu tempat.'
              : 'Silakan login untuk mengakses fitur dashboard.'}
          </p>
        </div>

        {!hasSession ? (
          /* Login Panel */
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="flex flex-col justify-center">
              <h2 className="text-xl font-semibold text-slate-100">Portal Anggota</h2>
              <p className="mt-2 text-sm text-slate-400">
                Login dengan akun Google yang terdaftar untuk mengakses fitur sesuai peran kamu.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Role-based access
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Supabase Auth
                </span>
              </div>
            </div>
            <div className="flex items-center justify-center lg:justify-end">
              <AuthPanel />
            </div>
          </div>
        ) : (
          <>
            {/* Alert jika profil belum lengkap */}
            {!profile && (
              <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-200">Lengkapi Profil</h3>
                    <p className="mt-1 text-sm text-amber-200/80">
                      Data profil belum lengkap. Silakan buka{' '}
                      <Link href="/profil" className="font-semibold underline hover:text-amber-100">
                        halaman profil
                      </Link>{' '}
                      untuk mengisi tingkatan, jabatan, dan informasi lainnya.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((card, i) => (
                <StatCardComponent key={i} card={card} />
              ))}
            </div>

            {/* Anggota Diporani Section - Collapsed */}
            {groupedMembers.length > 0 && (
              <details className="mb-8 group">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition-all hover:border-slate-700">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
                      <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-slate-100">Anggota Diporani</h2>
                      <p className="text-sm text-slate-400">Total {members.length} anggota terdaftar</p>
                    </div>
                    <svg className="h-5 w-5 text-slate-500 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </summary>
                <div className="mt-4 space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                  {groupedMembers.map((group) => (
                    <div key={group.role}>
                      <div className="mb-3 flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${group.color} px-3 py-1 text-xs font-semibold text-white shadow-sm`}>
                          {group.label}
                        </span>
                        <span className="text-xs text-slate-500">({group.members.length})</span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {group.members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition-all hover:border-slate-700 hover:bg-slate-900/80"
                          >
                            {member.avatar_url ? (
                              <div className="relative h-10 w-10 flex-shrink-0">
                                <Image
                                  src={member.avatar_url}
                                  alt={member.full_name || 'Avatar'}
                                  fill
                                  className="rounded-full object-cover"
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${group.color} text-sm font-bold text-white shadow-md`}>
                                {getInitials(member.full_name)}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-100">
                                {member.full_name || 'Tanpa Nama'}
                              </p>
                              <p className="truncate text-xs text-slate-400">
                                {member.jabatan || member.tingkatan || 'Belum diatur'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Quick Actions */}
              <div className="lg:col-span-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-100">Menu Cepat</h2>
                      <p className="text-sm text-slate-400">Akses fitur sesuai peranmu</p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {quickActions.map(({ feature, allowed }) => (
                      <QuickActionCard
                        key={feature.key}
                        feature={feature}
                        allowed={allowed}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Profile Sidebar */}
              <div className="space-y-6">
                <ProfileCard profile={profile} session={session} />

                {/* Quick Info */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                  <h3 className="text-sm font-semibold text-slate-100">Informasi</h3>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-slate-400">
                        Akses fitur menyesuaikan peran
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <span className="text-slate-400">
                        Data terenkripsi aman
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
