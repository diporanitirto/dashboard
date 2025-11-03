import { NextRequest, NextResponse } from 'next/server';
import { resolveAuthContext } from '@/lib/server-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const STORAGE_BUCKET = 'materi';

const sanitizeFileName = (name: string) =>
  name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9.-]/g, '');

const buildFilePath = (userId: string, fileName: string) => `${userId}/${Date.now()}-${fileName}`;

export const GET = async (request: NextRequest) => {
  const auth = await resolveAuthContext(request);
  if ('response' in auth) {
    return auth.response;
  }

  const { data, error } = await supabaseAdmin
    .from('materials')
    .select(
      'id, title, description, file_url, file_type, file_size, file_path, created_at, profiles(full_name, role)'
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Fetch materials error:', error);
    return NextResponse.json({ error: 'Gagal memuat data materi.' }, { status: 500 });
  }

  const mapped = (data ?? []).map((item) => {
    const profileCandidate = item.profiles ?? null;
    const profile = Array.isArray(profileCandidate)
      ? profileCandidate[0] ?? null
      : profileCandidate;

    return {
      id: item.id,
      title: item.title,
      description: item.description,
      fileUrl: item.file_url,
      fileType: item.file_type,
      fileSize: item.file_size,
      filePath: item.file_path,
      createdAt: item.created_at,
      uploader: profile
        ? {
            name: profile.full_name ?? null,
            role: profile.role ?? null,
          }
        : null,
    };
  });

  return NextResponse.json(mapped, { status: 200 });
};

export const POST = async (request: NextRequest) => {
  const auth = await resolveAuthContext(request);
  if ('response' in auth) {
    return auth.response;
  }

  if (auth.profile?.role !== 'materi') {
    return NextResponse.json({ error: 'Hanya tim materi yang dapat mengunggah.' }, { status: 403 });
  }

  const formData = await request.formData();
  const title = (formData.get('title') as string | null)?.trim();
  const description = (formData.get('description') as string | null)?.trim() ?? null;
  const file = formData.get('file');

  if (!title) {
    return NextResponse.json({ error: 'Judul wajib diisi.' }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Berkas wajib diunggah.' }, { status: 400 });
  }

  const rawName = file.name || 'materi';
  const safeName = sanitizeFileName(rawName) || 'materi';
  const filePath = buildFilePath(auth.userId, safeName);

  const { error: uploadError } = await supabaseAdmin.storage.from(STORAGE_BUCKET).upload(filePath, file, {
    upsert: false,
    contentType: file.type || undefined,
  });

  if (uploadError) {
    console.error('Upload materi error:', uploadError);
    return NextResponse.json({ error: 'Gagal mengunggah berkas ke storage.' }, { status: 500 });
  }

  const publicData = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
  const fileUrl = publicData.data?.publicUrl ?? null;

  const { data, error } = await supabaseAdmin
    .from('materials')
    .insert({
      title,
      description,
      file_url: fileUrl,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
      uploaded_by: auth.userId,
    })
    .select('id, title, description, file_url, file_type, file_size, file_path, created_at')
    .single();

  if (error || !data) {
    console.error('Insert materi error:', error);
    await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([filePath]);
    return NextResponse.json({ error: 'Gagal menyimpan data materi.' }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
};
