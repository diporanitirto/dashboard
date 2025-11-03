export const DASHBOARD_ROLES = ['admin', 'bph', 'materi', 'media', 'anggota'] as const;

export type DashboardRole = (typeof DASHBOARD_ROLES)[number];

export const BPH_POSITIONS = [
	'pradana',
	'pradana_putri',
	'judat',
	'judat_putri',
	'kerani',
	'kerani_putri',
	'hartaka',
	'hartaka_putri',
] as const;

export type Bphpangkat = (typeof BPH_POSITIONS)[number];

export type Pangkat = Bphpangkat | 'anggota';

export const ROLE_LABELS: Record<DashboardRole, string> = {
	admin: 'Admin',
	bph: 'BPH',
	materi: 'Tim Materi',
	media: 'Tim Media',
	anggota: 'Anggota',
};

export const PANGKAT_LABELS: Record<Pangkat, string> = {
	anggota: 'Anggota',
	pradana: 'Pradana',
	pradana_putri: 'Pradana Putri',
	judat: 'Juru Adat',
	judat_putri: 'Juru Adat Putri',
	kerani: 'Kerani',
	kerani_putri: 'Kerani Putri',
	hartaka: 'Hartaka',
	hartaka_putri: 'Hartaka Putri',
};

export type ProtectedSection = 'agenda' | 'materi' | 'dokumentasi' | 'profil';

const SECTION_ACCESS: Record<ProtectedSection, DashboardRole[]> = {
	agenda: ['admin', 'bph'],
	materi: ['admin', 'materi'],
	dokumentasi: ['admin', 'media'],
	profil: ['admin', 'bph', 'materi', 'media', 'anggota'],
};

export const canAccessSection = (role: DashboardRole | null, section: ProtectedSection) => {
	const allowed = SECTION_ACCESS[section];
	if (!role) return false;
	return allowed.includes(role);
};

export type DashboardProfile = {
	id: string;
	email: string;
	full_name: string | null;
	role: DashboardRole;
	pangkat: Pangkat;
	bio: string | null;
	avatar_url: string | null;
	created_at: string;
	updated_at: string;
};

export const allPangkatOptions: Pangkat[] = ['anggota', ...BPH_POSITIONS];
