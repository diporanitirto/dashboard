import { NextRequest, NextResponse } from 'next/server';
import { resolveAuthContext } from '@/lib/server-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const STORAGE_BUCKET = 'dokumentasi';
const ALLOWED_CATEGORIES = ['foto', 'video', 'lainnya'] as const;

type Category = (typeof ALLOWED_CATEGORIES)[number];

const sanitizeFileName = (name: string) =>
  name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9.-]/g, '');

const buildFilePath = (userId: string, fileName: string) => `${userId}/${Date.now()}-${fileName}`;

const parseCategory = (value: FormDataEntryValue | null): Category => {
  if (typeof value !== 'string') return 'foto';
  const normalized = value.toLowerCase();
  return (ALLOWED_CATEGORIES.find((item) => item === normalized) ?? 'foto') as Category;
};

export const DELETE = async (request: NextRequest) => {
  const auth = await resolveAuthContext(request);
  if ('response' in auth) {
    return auth.response;
  }

  // Only media, bph, or admin can delete
  if (auth.profile?.role !== 'media' && auth.profile?.role !== 'bph' && auth.profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya tim media, BPH, atau admin yang dapat menghapus.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID dokumentasi wajib diberikan.' }, { status: 400 });
  }

  // Get file_path first
  const { data: doc, error: fetchError } = await supabaseAdmin
    .from('documentation_assets')
    .select('file_path')
    .eq('id', id)
    .single();

  if (fetchError || !doc) {
    return NextResponse.json({ error: 'Dokumentasi tidak ditemukan.' }, { status: 404 });
  }

  // Delete from storage
  if (doc.file_path) {
    const { error: storageError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .remove([doc.file_path]);

    if (storageError) {
      console.error('Delete storage error:', storageError);
    }
  }

  // Delete from database
  const { error: deleteError } = await supabaseAdmin
    .from('documentation_assets')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('Delete dokumentasi error:', deleteError);
    return NextResponse.json({ error: 'Gagal menghapus dokumentasi.' }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
};

export const GET = async (request: NextRequest) => {
  const auth = await resolveAuthContext(request);
  if ('response' in auth) {
    return auth.response;
  }

  const { data, error } = await supabaseAdmin
    .from('documentation_assets')
    .select(
      'id, title, description, category, file_url, file_type, file_size, file_path, created_at, profiles(full_name, role)'
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Fetch documentation error:', error);
    return NextResponse.json({ error: 'Gagal memuat dokumentasi.' }, { status: 500 });
  }

  type DocWithProfile = {
    id: string;
    title: string;
    description: string | null;
    category: Category | null;
    file_url: string;
    file_type: string | null;
    file_size: number | null;
    file_path: string;
    created_at: string;
    profiles: { full_name: string | null; role: string | null } | null;
  };

  const mapped = (data as unknown as DocWithProfile[]).map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    category: item.category,
    fileUrl: item.file_url,
    fileType: item.file_type,
    fileSize: item.file_size,
    filePath: item.file_path,
    createdAt: item.created_at,
    uploader: item.profiles
      ? {
          name: item.profiles.full_name,
          role: item.profiles.role,
        }
      : null,
  }));

  return NextResponse.json(mapped, { status: 200 });
};

export const POST = async (request: NextRequest) => {
  const auth = await resolveAuthContext(request);
  if ('response' in auth) {
    return auth.response;
  }

  if (auth.profile?.role !== 'media' && auth.profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya tim media atau admin yang dapat mengunggah.' }, { status: 403 });
  }

  const formData = await request.formData();
  const title = (formData.get('title') as string | null)?.trim();
  const description = (formData.get('description') as string | null)?.trim() ?? null;
  const category = parseCategory(formData.get('category'));
  const file = formData.get('file');

  if (!title) {
    return NextResponse.json({ error: 'Judul wajib diisi.' }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Berkas dokumentasi wajib diunggah.' }, { status: 400 });
  }

  const rawName = file.name || 'dokumentasi';
  const safeName = sanitizeFileName(rawName) || 'dokumentasi';
  const filePath = buildFilePath(auth.userId, safeName);

  const { error: uploadError } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) {
    console.error('Upload documentation error:', uploadError);
    return NextResponse.json({ error: 'Gagal mengunggah berkas ke storage.' }, { status: 500 });
  }

  const publicData = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
  const fileUrl = publicData.data?.publicUrl ?? null;

  const { data, error } = await supabaseAdmin
    .from('documentation_assets')
    .insert({
      title,
      description,
      category,
      file_url: fileUrl,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
      uploaded_by: auth.userId,
    })
    .select('id, title, description, category, file_url, file_type, file_size, file_path, created_at')
    .single();

  if (error || !data) {
    console.error('Insert documentation error:', error);
    await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([filePath]);
    return NextResponse.json({ error: 'Gagal menyimpan dokumentasi.' }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
};
