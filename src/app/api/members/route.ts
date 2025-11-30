import { NextRequest, NextResponse } from 'next/server';
import { resolveAuthContext } from '@/lib/server-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const VALID_ROLES = ['anggota', 'materi', 'media', 'bph', 'admin'] as const;
const VALID_TINGKATAN = ['bantara', 'laksana'] as const;
const VALID_JABATAN = ['anggota', 'pradana', 'kerani', 'judat', 'hartoko'] as const;

export const GET = async (request: NextRequest) => {
	const auth = await resolveAuthContext(request);
	if ('response' in auth) {
		return auth.response;
	}

	// Hanya admin dan BPH yang bisa lihat daftar anggota
	if (auth.profile?.role !== 'admin' && auth.profile?.role !== 'bph') {
		return NextResponse.json(
			{ error: 'Akses ditolak. Hanya admin atau BPH yang bisa melihat daftar anggota.' },
			{ status: 403 }
		);
	}

	const { data, error } = await supabaseAdmin
		.from('profiles')
		.select('id, full_name, role, tingkatan, jabatan, bio, avatar_url, created_at, updated_at')
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Fetch members error:', error);
		return NextResponse.json({ error: 'Gagal memuat daftar anggota.' }, { status: 500 });
	}

	// Get emails from auth.users
	const { data: users } = await supabaseAdmin.auth.admin.listUsers();

	const membersWithEmail = data.map((profile) => {
		const user = users?.users.find((u) => u.id === profile.id);
		return {
			...profile,
			email: user?.email || 'unknown@unknown',
		};
	});

	return NextResponse.json({ members: membersWithEmail }, { status: 200 });
};

export const PATCH = async (request: NextRequest) => {
	const auth = await resolveAuthContext(request);
	if ('response' in auth) {
		return auth.response;
	}

	// Hanya admin yang bisa edit anggota
	if (auth.profile?.role !== 'admin') {
		return NextResponse.json(
			{ error: 'Akses ditolak. Hanya admin yang bisa mengedit anggota.' },
			{ status: 403 }
		);
	}

	const payload = (await request.json().catch(() => null)) as {
		id?: string;
		role?: string;
		tingkatan?: string;
		jabatan?: string;
	} | null;

	if (!payload || !payload.id) {
		return NextResponse.json({ error: 'ID anggota wajib diberikan.' }, { status: 400 });
	}

	const updates: { role?: string; tingkatan?: string; jabatan?: string } = {};

	if (payload.role) {
		if (!VALID_ROLES.includes(payload.role as typeof VALID_ROLES[number])) {
			return NextResponse.json({ error: 'Role tidak valid.' }, { status: 400 });
		}
		updates.role = payload.role;
	}

	if (payload.tingkatan) {
		if (!VALID_TINGKATAN.includes(payload.tingkatan as typeof VALID_TINGKATAN[number])) {
			return NextResponse.json({ error: 'Tingkatan tidak valid.' }, { status: 400 });
		}
		updates.tingkatan = payload.tingkatan;
	}

	if (payload.jabatan) {
		if (!VALID_JABATAN.includes(payload.jabatan as typeof VALID_JABATAN[number])) {
			return NextResponse.json({ error: 'Jabatan tidak valid.' }, { status: 400 });
		}
		updates.jabatan = payload.jabatan;
	}

	if (Object.keys(updates).length === 0) {
		return NextResponse.json({ error: 'Tidak ada data yang diperbarui.' }, { status: 400 });
	}

	const { data, error } = await supabaseAdmin
		.from('profiles')
		.update(updates)
		.eq('id', payload.id)
		.select('id, full_name, role, tingkatan, jabatan')
		.single();

	if (error || !data) {
		console.error('Update member error:', error);
		return NextResponse.json({ error: 'Gagal memperbarui anggota.' }, { status: 500 });
	}

	return NextResponse.json({ member: data }, { status: 200 });
};
