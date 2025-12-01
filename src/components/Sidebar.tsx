'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState, useEffect, createContext, useContext } from 'react';
import { useProfile } from './ProfileProvider';
import { ROLE_LABELS, type DashboardRole } from '@/lib/auth';

type NavLink = {
	label: string;
	href: string;
	icon: React.ReactNode;
	requiredRoles?: DashboardRole[];
	public?: boolean;
};

// Sidebar Context for sharing collapsed state
const SidebarContext = createContext<{ isCollapsed: boolean; setIsCollapsed: (v: boolean) => void }>({
	isCollapsed: false,
	setIsCollapsed: () => {},
});

export const useSidebarCollapsed = () => useContext(SidebarContext);

// Icons
const HomeIcon = () => (
	<svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
		<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
	</svg>
);

const CalendarIcon = () => (
	<svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
		<path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
	</svg>
);

const BookIcon = () => (
	<svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
		<path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
	</svg>
);

const CameraIcon = () => (
	<svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
		<path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
		<path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
	</svg>
);

const UserIcon = () => (
	<svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
		<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
	</svg>
);

const ClipboardIcon = () => (
	<svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
		<path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
	</svg>
);

const ArchiveIcon = () => (
	<svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
		<path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
	</svg>
);

const PostsIcon = () => (
	<svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
		<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
	</svg>
);

const UsersIcon = () => (
	<svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
		<path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
	</svg>
);

const MenuIcon = () => (
	<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
		<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
	</svg>
);

const CloseIcon = () => (
	<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
		<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
	</svg>
);

const LogoutIcon = () => (
	<svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
		<path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
	</svg>
);

const CollapseIcon = () => (
	<svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
		<path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
	</svg>
);

const NAV_LINKS: NavLink[] = [
	{ label: 'Beranda', href: '/', icon: <HomeIcon />, public: true },
	{ label: 'Postingan', href: '/posts', icon: <PostsIcon />, public: true },
	{ label: 'Agenda', href: '/agenda', icon: <CalendarIcon />, requiredRoles: ['bph'] },
	{ label: 'Materi', href: '/materi', icon: <BookIcon />, requiredRoles: ['materi'] },
	{ label: 'Dokumentasi', href: '/dokumentasi', icon: <CameraIcon />, requiredRoles: ['media'] },
	{ label: 'Anggota', href: '/anggota', icon: <UsersIcon />, requiredRoles: ['bph'] },
	{ label: 'Izin', href: '/izin', icon: <ClipboardIcon />, public: true },
	{ label: 'Arsip', href: '/arsip', icon: <ArchiveIcon />, public: true },
	{ label: 'Profil', href: '/profil', icon: <UserIcon />, requiredRoles: ['bph', 'materi', 'media', 'anggota'] },
];

const AvatarCircle = ({ name, avatarUrl, size = 'md' }: { name: string; avatarUrl?: string | null; size?: 'sm' | 'md' }) => {
	const initial = name.trim().charAt(0).toUpperCase() || 'A';
	const sizeClasses = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';
	
	if (avatarUrl) {
		return (
			<div className={`relative flex-shrink-0 ${sizeClasses}`}>
				<Image
					src={avatarUrl}
					alt={name}
					fill
					className="rounded-full object-cover"
					unoptimized
				/>
			</div>
		);
	}
	
	return (
		<div className={`flex items-center justify-center rounded-full bg-emerald-500 font-semibold text-emerald-950 flex-shrink-0 ${sizeClasses}`}>
			{initial}
		</div>
	);
};

export const Sidebar = () => {
	const pathname = usePathname();
	const { profile, session, loading, signOut } = useProfile();
	const [isOpen, setIsOpen] = useState(false);
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const [mounted, setMounted] = useState(false);

	// Load collapsed state from localStorage on mount
	useEffect(() => {
		setMounted(true);
		const saved = localStorage.getItem('sidebar-collapsed');
		if (saved !== null) {
			setIsCollapsed(JSON.parse(saved));
		}
	}, []);

	// Toggle collapse and save to localStorage
	const toggleCollapse = () => {
		const newState = !isCollapsed;
		setIsCollapsed(newState);
		localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
	};

	const filteredLinks = useMemo(() => {
		return NAV_LINKS.filter((link) => {
			if (link.public) return true;
			if (!profile) return false;
			// Admin can access everything
			if (profile.role === 'admin') return true;
			if (!link.requiredRoles) return Boolean(session);
			return link.requiredRoles.includes(profile.role);
		});
	}, [profile, session]);

	const closeSidebar = () => setIsOpen(false);

	// Effective expanded state: expanded if not collapsed OR if hovered while collapsed
	const isExpanded = !isCollapsed || isHovered;

	// Sidebar width based on effective state
	const sidebarWidthClass = isExpanded ? 'lg:w-64' : 'lg:w-[72px]';
	const cssWidth = mounted ? (isCollapsed && !isHovered ? '72px' : '256px') : '256px';

	return (
		<SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
			{/* Mobile Header */}
			<header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-slate-800 bg-slate-900/95 px-4 py-3 backdrop-blur lg:hidden">
				<Link href="/" className="flex items-center gap-2">
					<div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg">
						<Image
							src="/logo-diporani.png"
							alt="Diporani Logo"
							fill
							className="object-contain"
							priority
						/>
					</div>
					<span className="text-base font-semibold text-slate-50">Dashboard</span>
				</Link>
				<button
					onClick={() => setIsOpen(true)}
					className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100"
					aria-label="Open menu"
				>
					<MenuIcon />
				</button>
			</header>

			{/* Mobile Overlay */}
			{isOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
					onClick={closeSidebar}
				/>
			)}

			{/* Sidebar */}
			<aside
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				className={`fixed top-0 left-0 z-50 flex h-full w-64 flex-col border-r border-slate-800 bg-slate-900 transition-all duration-300 ease-in-out lg:translate-x-0 ${
					isOpen ? 'translate-x-0' : '-translate-x-full'
				} ${mounted ? sidebarWidthClass : 'lg:w-64'}`}
			>
				{/* Logo Header */}
				<div className={`flex h-16 items-center border-b border-slate-800 transition-all duration-300 ${isExpanded ? 'justify-between px-4' : 'lg:justify-center lg:px-2 px-4 justify-between'}`}>
					{/* Logo - always centered when collapsed */}
					<Link 
						href="/" 
						className={`flex items-center gap-3 ${isExpanded ? 'flex-1 min-w-0' : ''}`}
						onClick={closeSidebar}
					>
						<div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg bg-slate-800">
							<Image
								src="/logo-diporani.png"
								alt="Diporani Logo"
								fill
								className="object-contain p-0.5"
								priority
							/>
						</div>
						<div className={`flex flex-col overflow-hidden transition-all duration-300 ${isExpanded ? 'w-auto opacity-100' : 'lg:w-0 lg:opacity-0'}`}>
							<span className="text-sm font-bold text-slate-50 whitespace-nowrap">DIPORANI</span>
							<span className="text-[10px] font-medium text-slate-500 whitespace-nowrap">Dashboard Portal</span>
						</div>
					</Link>
					
					{/* Collapse Toggle Button - Shows collapse icon when expanded */}
					<button
						onClick={toggleCollapse}
						className={`hidden lg:flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-all duration-300 hover:bg-slate-800 hover:text-slate-200 ${
							isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'
						} ${!isCollapsed ? 'border border-slate-700 bg-slate-800' : ''}`}
						title={isCollapsed ? "Perluas sidebar" : "Ciutkan sidebar"}
					>
						<CollapseIcon />
					</button>
					
					{/* Mobile Close Button */}
					<button
						onClick={closeSidebar}
						className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-slate-100 lg:hidden"
						aria-label="Close menu"
					>
						<CloseIcon />
					</button>
				</div>

				{/* Navigation */}
				<nav className={`flex-1 overflow-y-auto py-4 transition-all duration-300 ${isExpanded ? 'px-3' : 'lg:px-2'}`}>
					<ul className="space-y-1">
						{filteredLinks.map((link) => {
							const active = pathname === link.href;
							return (
								<li key={link.href}>
									<Link
										href={link.href}
										onClick={closeSidebar}
										className={`group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 ${
											active
												? 'bg-emerald-500/10 text-emerald-400'
												: 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
										} ${!isExpanded ? 'lg:justify-center lg:py-2.5 lg:px-0 px-3 py-2.5' : 'px-3 py-2.5'}`}
									>
										<span className={`transition-colors ${active ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
											{link.icon}
										</span>
										<span className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${isExpanded ? 'w-auto opacity-100' : 'lg:w-0 lg:opacity-0'}`}>
											{link.label}
										</span>
										{active && isExpanded && (
											<span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 hidden lg:block" />
										)}
									</Link>
								</li>
							);
						})}
					</ul>
				</nav>

				{/* User Section */}
				<div className={`border-t border-slate-800 transition-all duration-300 ${isExpanded ? 'p-4' : 'lg:p-2'}`}>
					{session && profile ? (
						<div className={`space-y-3 ${!isExpanded ? 'lg:space-y-2' : ''}`}>
							<div className={`flex items-center gap-3 rounded-xl bg-slate-800/50 p-3 transition-all duration-300 ${!isExpanded ? 'lg:justify-center lg:p-2' : ''}`}>
								<AvatarCircle name={profile.full_name ?? profile.email} avatarUrl={profile.avatar_url} size="sm" />
								<div className={`flex-1 min-w-0 overflow-hidden transition-all duration-300 ${isExpanded ? 'w-auto opacity-100' : 'lg:w-0 lg:opacity-0 lg:hidden'}`}>
									<p className="truncate text-sm font-medium text-slate-100">
										{profile.full_name ?? profile.email}
									</p>
									<p className="text-xs text-slate-500">{ROLE_LABELS[profile.role]}</p>
								</div>
							</div>
							<button
								onClick={() => {
									signOut().catch((error) => console.error('Sign out failed:', error));
									closeSidebar();
								}}
								className={`flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm font-medium text-slate-400 transition-all duration-200 hover:bg-slate-800 hover:text-slate-100 ${
									!isExpanded ? 'lg:px-2' : ''
								}`}
							>
								<LogoutIcon />
								<span className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${isExpanded ? 'w-auto opacity-100' : 'lg:w-0 lg:opacity-0'}`}>
									Keluar
								</span>
							</button>
						</div>
					) : loading ? (
						<div className={`flex items-center justify-center py-4 ${!isExpanded ? 'lg:py-2' : ''}`}>
							{!isExpanded ? (
								<div className="hidden lg:block h-8 w-8 rounded-full bg-slate-800 animate-pulse" />
							) : (
								<span className="text-sm text-slate-500">Memuat...</span>
							)}
						</div>
					) : (
						<Link
							href="#autentikasi"
							onClick={closeSidebar}
							className={`flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 transition-all duration-200 hover:bg-emerald-400 ${
								!isExpanded ? 'lg:px-2' : ''
							}`}
						>
							<UserIcon />
							<span className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${isExpanded ? 'w-auto opacity-100' : 'lg:w-0 lg:opacity-0'}`}>
								Masuk
							</span>
						</Link>
					)}
				</div>
			</aside>

			{/* CSS variable for main content offset */}
			<style jsx global>{`
				:root {
					--sidebar-width: ${cssWidth};
				}
			`}</style>
		</SidebarContext.Provider>
	);
};

// Hook to get sidebar collapsed state
export const useSidebarState = () => {
	const [isCollapsed, setIsCollapsed] = useState(false);
	
	useEffect(() => {
		const saved = localStorage.getItem('sidebar-collapsed');
		if (saved !== null) {
			setIsCollapsed(JSON.parse(saved));
		}
		
		// Listen for storage changes from other tabs
		const handleStorage = (e: StorageEvent) => {
			if (e.key === 'sidebar-collapsed' && e.newValue !== null) {
				setIsCollapsed(JSON.parse(e.newValue));
			}
		};
		
		window.addEventListener('storage', handleStorage);
		
		// Poll for changes (for same-tab updates)
		const interval = setInterval(() => {
			const saved = localStorage.getItem('sidebar-collapsed');
			if (saved !== null) {
				setIsCollapsed(JSON.parse(saved));
			}
		}, 100);
		
		return () => {
			window.removeEventListener('storage', handleStorage);
			clearInterval(interval);
		};
	}, []);
	
	return isCollapsed;
};
