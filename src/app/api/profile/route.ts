import { NextRequest, NextResponse } from 'next/server';
import { 
  TINGKATAN_OPTIONS, 
  JABATAN_OPTIONS, 
  type Tingkatan, 
  type Jabatan 
} from '@/lib/auth';
import { resolveAuthContext } from '@/lib/server-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const isValidTingkatan = (value: unknown): value is Tingkatan =>
	TINGKATAN_OPTIONS.includes(value as Tingkatan);

const isValidJabatan = (value: unknown): value is Jabatan =>
	JABATAN_OPTIONS.includes(value as Jabatan);

export const GET = async (request: NextRequest) => {
	const auth = await resolveAuthContext(request);
	if ('response' in auth) {
		return auth.response;
	}

	return NextResponse.json(auth.profile, { status: 200 });
};

export const PUT = async (request: NextRequest) => {
	const auth = await resolveAuthContext(request);
	if ('response' in auth) {
		return auth.response;
	}

	const payload = (await request.json().catch(() => null)) as
		| {
			fullName?: unknown;
			tingkatan?: unknown;
			jabatan?: unknown;
			bio?: unknown;
			instagram?: unknown;
			motto?: unknown;
		}
		| null;

	if (!payload) {
		return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
	}

	const fullName = typeof payload.fullName === 'string' ? payload.fullName.trim() : '';
	const tingkatan = payload.tingkatan;
	const jabatan = payload.jabatan;
	const bio =
		typeof payload.bio === 'string'
			? payload.bio.trim().slice(0, 1000)
			: payload.bio === null || payload.bio === undefined
				? null
				: undefined;
	const instagram =
		typeof payload.instagram === 'string'
			? payload.instagram.trim().slice(0, 100)
			: payload.instagram === null || payload.instagram === undefined
				? null
				: undefined;
	const motto =
		typeof payload.motto === 'string'
			? payload.motto.trim().slice(0, 200)
			: payload.motto === null || payload.motto === undefined
				? null
				: undefined;

	if (!fullName) {
		return NextResponse.json({ error: 'Nama lengkap wajib diisi.' }, { status: 400 });
	}

	if (!isValidTingkatan(tingkatan)) {
		return NextResponse.json({ error: 'Tingkatan tidak valid. Pilih Bantara atau Laksana.' }, { status: 400 });
	}

	if (!isValidJabatan(jabatan)) {
		return NextResponse.json({ error: 'Jabatan tidak valid.' }, { status: 400 });
	}

	const updatePayload: Record<string, unknown> = {
		id: auth.userId,
		full_name: fullName,
		tingkatan,
		jabatan,
		updated_at: new Date().toISOString(),
	};

	if (bio !== undefined) {
		updatePayload.bio = bio;
	}

	if (instagram !== undefined) {
		updatePayload.instagram = instagram;
	}

	if (motto !== undefined) {
		updatePayload.motto = motto;
	}

	const { data, error } = await supabaseAdmin
		.from('profiles')
		.upsert(updatePayload, { onConflict: 'id' })
		.select('id, full_name, role, tingkatan, jabatan, bio, instagram, motto, avatar_url, created_at, updated_at')
		.single();

	if (error || !data) {
		console.error('Profile update error:', error);
		return NextResponse.json({ error: 'Gagal memperbarui profil.' }, { status: 500 });
	}

	return NextResponse.json(data, { status: 200 });
};
