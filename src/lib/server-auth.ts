import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseAdmin } from './supabase-admin';
import type { DashboardProfile, Pangkat, DashboardRole } from './auth';

type AuthSuccess = {
	userId: string;
	email: string;
	profile: DashboardProfile | null;
};

type AuthFailure = {
	response: NextResponse;
};

export type AuthContextResult = AuthSuccess | AuthFailure;

const buildUnauthorized = (message: string): AuthFailure => ({
	response: NextResponse.json({ error: message }, { status: 401 }),
});

const buildForbidden = (message: string): AuthFailure => ({
	response: NextResponse.json({ error: message }, { status: 403 }),
});

const mapProfile = (row: Record<string, unknown>, email: string): DashboardProfile | null => {
	if (!row) return null;
	const id = typeof row.id === 'string' ? row.id : null;
	if (!id) return null;
	const role = row.role as DashboardRole | undefined;
	const pangkat = row.pangkat as Pangkat | undefined;
	if (!role || !pangkat) return null;
	return {
		id,
		email,
		full_name: (row.full_name as string) ?? null,
		role,
		pangkat,
		bio: (row.bio as string) ?? null,
		avatar_url: (row.avatar_url as string) ?? null,
		created_at: (row.created_at as string) ?? new Date().toISOString(),
		updated_at: (row.updated_at as string) ?? new Date().toISOString(),
	};
};

export const resolveAuthContext = async (request: NextRequest): Promise<AuthContextResult> => {
	const header = request.headers.get('authorization');
	if (!header || !header.startsWith('Bearer ')) {
		return buildUnauthorized('Authorization token dibutuhkan.');
	}
	const token = header.slice('Bearer '.length).trim();
	if (!token) {
		return buildUnauthorized('Token tidak valid.');
	}

	const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
	if (userError || !userData?.user) {
		return buildUnauthorized('Sesi sudah tidak berlaku.');
	}

	const userId = userData.user.id;
	const email = userData.user.email ?? 'unknown@unknown';

	const { data: profileRow, error: profileError } = await supabaseAdmin
		.from('profiles')
		.select('id, full_name, role, pangkat, bio, avatar_url, created_at, updated_at')
		.eq('id', userId)
		.maybeSingle();

	if (profileError && profileError.code !== 'PGRST116') {
		return buildForbidden('Profil tidak dapat dimuat.');
	}

	const profile = profileRow ? mapProfile(profileRow, email) : null;

	return {
		userId,
		email,
		profile,
	};
};
