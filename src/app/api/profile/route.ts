import { NextRequest, NextResponse } from 'next/server';
import { BPH_POSITIONS, PANGKAT_LABELS, type Pangkat } from '@/lib/auth';
import { resolveAuthContext } from '@/lib/server-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const isValidPangkat = (value: unknown): value is Pangkat =>
	value === 'anggota' || BPH_POSITIONS.includes(value as (typeof BPH_POSITIONS)[number]);

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
			pangkat?: unknown;
			bio?: unknown;
		}
		| null;

	if (!payload) {
		return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
	}

	const fullName = typeof payload.fullName === 'string' ? payload.fullName.trim() : '';
	const pangkat = payload.pangkat;
	const bio =
		typeof payload.bio === 'string'
			? payload.bio.trim().slice(0, 1000)
			: payload.bio === null || payload.bio === undefined
				? null
				: undefined;

	if (!fullName) {
		return NextResponse.json({ error: 'Nama lengkap wajib diisi.' }, { status: 400 });
	}

	if (!isValidPangkat(pangkat)) {
		return NextResponse.json({ error: 'Pangkat tidak dikenal.' }, { status: 400 });
	}

	// Admin tidak dibatasi pangkat, non-admin BPH harus pakai pangkat BPH
	if (
		auth.profile?.role === 'bph' &&
		!BPH_POSITIONS.includes(pangkat as (typeof BPH_POSITIONS)[number])
	) {
		return NextResponse.json(
			{
				error: 'Pangkat untuk peran BPH harus salah satu dari: ' +
					BPH_POSITIONS.map((item) => PANGKAT_LABELS[item]).join(', '),
			},
			{ status: 400 }
		);
	}

	// Admin bebas memilih pangkat apa saja
	if (auth.profile?.role !== 'admin') {
		// Validasi untuk non-admin selesai di atas
	}

	const updatePayload: Record<string, unknown> = {
		id: auth.userId,
		full_name: fullName,
		pangkat,
		updated_at: new Date().toISOString(),
	};

	if (bio !== undefined) {
		updatePayload.bio = bio;
	}

	const { data, error } = await supabaseAdmin
		.from('profiles')
		.upsert(updatePayload, { onConflict: 'id' })
		.select('id, full_name, role, pangkat, bio, avatar_url, created_at, updated_at')
		.single();

	if (error || !data) {
		console.error('Profile update error:', error);
		return NextResponse.json({ error: 'Gagal memperbarui profil.' }, { status: 500 });
	}

	return NextResponse.json(data, { status: 200 });
};
