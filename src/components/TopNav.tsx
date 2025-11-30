'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useProfile } from './ProfileProvider';
import { ROLE_LABELS, type DashboardRole } from '@/lib/auth';

type NavLink = {
	label: string;
	href: string;
	requiredRoles?: DashboardRole[];
	public?: boolean;
};

const NAV_LINKS: NavLink[] = [
	{ label: 'Beranda', href: '/', public: true },
	{ label: 'Agenda', href: '/agenda', requiredRoles: ['bph'] },
	{ label: 'Materi', href: '/materi', requiredRoles: ['materi'] },
	{ label: 'Dokumentasi', href: '/dokumentasi', requiredRoles: ['media'] },
	{ label: 'Profil', href: '/profil', requiredRoles: ['bph', 'materi', 'media', 'anggota'] },
	{ label: 'Izin', href: '/izin', public: true },
	{ label: 'Arsip', href: '/arsip', public: true },
];

const AvatarCircle = ({ name }: { name: string }) => {
	const initial = name.trim().charAt(0).toUpperCase() || 'A';
	return (
		<div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-sm font-semibold text-emerald-950">
			{initial}
		</div>
	);
};

export const TopNav = () => {
	const pathname = usePathname();
	const { profile, session, loading, signOut } = useProfile();
	const [showMenu, setShowMenu] = useState(false);

	const filteredLinks = useMemo(() => {
		return NAV_LINKS.filter((link) => {
			if (link.public) return true;
			if (!profile) return false;
			if (!link.requiredRoles) return Boolean(session);
			return link.requiredRoles.includes(profile.role);
		});
	}, [profile, session]);

	const toggleMenu = () => setShowMenu((prev) => !prev);

	return (
		<header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur">
			<div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
				<div className="flex items-center gap-6">
					<Link href="/" className="text-lg font-semibold text-slate-50">
						Dashboard Diporani
					</Link>
					<nav className="hidden items-center gap-1 md:flex">
						{filteredLinks.map((link) => {
							const active = pathname === link.href;
							return (
								<Link
									key={link.href}
									href={link.href}
									className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
										active ? 'bg-slate-50 text-slate-900' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
									}`}
								>
									{link.label}
								</Link>
							);
						})}
					</nav>
				</div>
				<div className="flex items-center gap-3">
					{session && profile ? (
						<div className="flex items-center gap-3">
							<AvatarCircle name={profile.full_name ?? profile.email} />
							<div className="hidden text-sm sm:flex sm:flex-col">
								<span className="font-medium text-slate-100">{profile.full_name ?? profile.email}</span>
								<span className="text-xs text-slate-400">{ROLE_LABELS[profile.role]}</span>
							</div>
							<button
								onClick={() => {
									signOut().catch((error) => console.error('Sign out failed:', error));
								}}
								className="rounded-full border border-slate-700 px-3 py-1 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-slate-100"
							>
								Keluar
							</button>
						</div>
					) : loading ? (
						<span className="text-sm text-slate-400">Memuat...</span>
					) : (
						<Link
							href="#autentikasi"
							className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
						>
							Masuk
						</Link>
					)}
					<button
						onClick={toggleMenu}
						className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100 md:hidden"
						aria-label="Toggle navigation"
					>
						<span className="sr-only">Toggle</span>
						<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
							<path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
						</svg>
					</button>
				</div>
			</div>
			{showMenu && (
				<nav className="border-t border-slate-800 bg-slate-900 px-4 py-4 md:hidden">
					<ul className="flex flex-col gap-2">
						{filteredLinks.map((link) => {
							const active = pathname === link.href;
							return (
								<li key={link.href}>
									<Link
										href={link.href}
										className={`block rounded-full px-4 py-2 text-sm font-medium transition ${
											active ? 'bg-slate-50 text-slate-900' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
										}`}
									>
										{link.label}
									</Link>
								</li>
							);
						})}
					</ul>
				</nav>
			)}
		</header>
	);
};
