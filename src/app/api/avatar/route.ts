import { NextRequest, NextResponse } from 'next/server';
import { resolveAuthContext } from '@/lib/server-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const POST = async (request: NextRequest) => {
	const auth = await resolveAuthContext(request);
	if ('response' in auth) {
		return auth.response;
	}

	try {
		const formData = await request.formData();
		const file = formData.get('avatar') as File | null;

		if (!file) {
			return NextResponse.json({ error: 'File tidak ditemukan.' }, { status: 400 });
		}

		// Validate file type
		if (!ALLOWED_TYPES.includes(file.type)) {
			return NextResponse.json(
				{ error: 'Format file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.' },
				{ status: 400 }
			);
		}

		// Validate file size
		if (file.size > MAX_FILE_SIZE) {
			return NextResponse.json(
				{ error: 'Ukuran file terlalu besar. Maksimal 2MB.' },
				{ status: 400 }
			);
		}

		// Generate unique filename
		const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
		const fileName = `${auth.userId}.${fileExt}`;
		const filePath = `avatars/${fileName}`;

		// Convert file to buffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Delete old avatar if exists (any extension)
		const { data: existingFiles } = await supabaseAdmin.storage
			.from('avatars')
			.list('avatars', {
				search: auth.userId,
			});

		if (existingFiles && existingFiles.length > 0) {
			const filesToDelete = existingFiles
				.filter(f => f.name.startsWith(auth.userId))
				.map(f => `avatars/${f.name}`);
			
			if (filesToDelete.length > 0) {
				await supabaseAdmin.storage.from('avatars').remove(filesToDelete);
			}
		}

		// Upload new avatar
		const { error: uploadError } = await supabaseAdmin.storage
			.from('avatars')
			.upload(filePath, buffer, {
				contentType: file.type,
				upsert: true,
			});

		if (uploadError) {
			console.error('Upload error:', uploadError);
			return NextResponse.json(
				{ error: 'Gagal mengupload foto. Silakan coba lagi.' },
				{ status: 500 }
			);
		}

		// Get public URL
		const { data: urlData } = supabaseAdmin.storage
			.from('avatars')
			.getPublicUrl(filePath);

		const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

		// Update profile with new avatar URL
		const { error: updateError } = await supabaseAdmin
			.from('profiles')
			.update({
				avatar_url: avatarUrl,
				updated_at: new Date().toISOString(),
			})
			.eq('id', auth.userId);

		if (updateError) {
			console.error('Profile update error:', updateError);
			return NextResponse.json(
				{ error: 'Gagal memperbarui profil.' },
				{ status: 500 }
			);
		}

		return NextResponse.json({ 
			success: true, 
			avatar_url: avatarUrl 
		});

	} catch (error) {
		console.error('Avatar upload error:', error);
		return NextResponse.json(
			{ error: 'Terjadi kesalahan saat mengupload foto.' },
			{ status: 500 }
		);
	}
};

export const DELETE = async (request: NextRequest) => {
	const auth = await resolveAuthContext(request);
	if ('response' in auth) {
		return auth.response;
	}

	try {
		// Find and delete avatar files
		const { data: existingFiles } = await supabaseAdmin.storage
			.from('avatars')
			.list('avatars', {
				search: auth.userId,
			});

		if (existingFiles && existingFiles.length > 0) {
			const filesToDelete = existingFiles
				.filter(f => f.name.startsWith(auth.userId))
				.map(f => `avatars/${f.name}`);
			
			if (filesToDelete.length > 0) {
				await supabaseAdmin.storage.from('avatars').remove(filesToDelete);
			}
		}

		// Update profile to remove avatar URL
		const { error: updateError } = await supabaseAdmin
			.from('profiles')
			.update({
				avatar_url: null,
				updated_at: new Date().toISOString(),
			})
			.eq('id', auth.userId);

		if (updateError) {
			console.error('Profile update error:', updateError);
			return NextResponse.json(
				{ error: 'Gagal memperbarui profil.' },
				{ status: 500 }
			);
		}

		return NextResponse.json({ success: true });

	} catch (error) {
		console.error('Avatar delete error:', error);
		return NextResponse.json(
			{ error: 'Terjadi kesalahan saat menghapus foto.' },
			{ status: 500 }
		);
	}
};
