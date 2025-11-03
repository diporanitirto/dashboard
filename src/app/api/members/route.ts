import { NextRequest, NextResponse } from 'next/server';
import { resolveAuthContext } from '@/lib/server-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

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
		.select('id, full_name, role, pangkat, bio, avatar_url, created_at, updated_at')
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
