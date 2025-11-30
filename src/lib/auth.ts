export const DASHBOARD_ROLES = ['admin', 'bph', 'materi', 'media', 'anggota'] as const;

export type DashboardRole = (typeof DASHBOARD_ROLES)[number];

// =====================
// SISTEM TINGKATAN & JABATAN BARU
// =====================

export const TINGKATAN_OPTIONS = ['bantara', 'laksana'] as const;
export type Tingkatan = (typeof TINGKATAN_OPTIONS)[number];

export const JABATAN_OPTIONS = ['anggota', 'pradana', 'kerani', 'hartoko', 'judat'] as const;
export type Jabatan = (typeof JABATAN_OPTIONS)[number];

export const TINGKATAN_LABELS: Record<Tingkatan, string> = {
	bantara: 'Penegak Bantara',
	laksana: 'Penegak Laksana',
};

export const JABATAN_LABELS: Record<Jabatan, string> = {
	anggota: 'Anggota',
	pradana: 'Pradana (Ketua)',
	kerani: 'Kerani (Sekretaris)',
	hartoko: 'Hartoko (Bendahara)',
	judat: 'Judat (Pemangku Adat)',
};

// =====================
// ROLE LABELS
// =====================

export const ROLE_LABELS: Record<DashboardRole, string> = {
	admin: 'Admin',
	bph: 'BPH',
	materi: 'Tim Materi',
	media: 'Tim Media',
	anggota: 'Anggota',
};

// =====================
// LEGACY - untuk kompatibilitas (akan dihapus nanti)
// =====================

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
	tingkatan: Tingkatan | null;
	jabatan: Jabatan | null;
	bio: string | null;
	instagram: string | null;
	motto: string | null;
	avatar_url: string | null;
	created_at: string;
	updated_at: string;
	// Legacy field - untuk kompatibilitas
	pangkat?: Pangkat;
};
