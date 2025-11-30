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
      'id, title, description, content, file_url, file_name, file_type, file_size, file_path, created_at, profiles(full_name, role)'
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
      content: item.content,
      file_url: item.file_url,
      file_name: item.file_name,
      file_type: item.file_type,
      file_size: item.file_size,
      file_path: item.file_path,
      created_at: item.created_at,
      uploaded_by: profile?.full_name ?? 'Unknown',
    };
  });

  return NextResponse.json({ data: mapped }, { status: 200 });
};

export const POST = async (request: NextRequest) => {
  const auth = await resolveAuthContext(request);
  if ('response' in auth) {
    return auth.response;
  }

  if (auth.profile?.role !== 'materi' && auth.profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya tim materi atau admin yang dapat mengunggah.' }, { status: 403 });
  }

  const formData = await request.formData();
  const title = (formData.get('title') as string | null)?.trim();
  const description = (formData.get('description') as string | null)?.trim() ?? null;
  const content = (formData.get('content') as string | null)?.trim() ?? null;
  const file = formData.get('file');
  const method = formData.get('_method') as string | null;
  const editId = formData.get('id') as string | null;

  if (!title) {
    return NextResponse.json({ error: 'Judul wajib diisi.' }, { status: 400 });
  }

  if (!content) {
    return NextResponse.json({ error: 'Konten materi wajib diisi.' }, { status: 400 });
  }

  // Handle UPDATE
  if (method === 'PUT' && editId) {
    // Get existing material for potential file cleanup
    const { data: existing } = await supabaseAdmin
      .from('materials')
      .select('file_path')
      .eq('id', editId)
      .single();

    let fileUrl = null;
    let fileName = null;
    let fileType = null;
    let fileSize = null;
    let filePath = null;

    // Handle new file upload
    if (file instanceof File && file.size > 0) {
      // Delete old file if exists
      if (existing?.file_path) {
        await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([existing.file_path]);
      }

      const rawName = file.name || 'materi';
      const safeName = sanitizeFileName(rawName) || 'materi';
      filePath = buildFilePath(auth.userId, safeName);

      const { error: uploadError } = await supabaseAdmin.storage.from(STORAGE_BUCKET).upload(filePath, file, {
        upsert: false,
        contentType: file.type || undefined,
      });

      if (uploadError) {
        console.error('Upload materi error:', uploadError);
        return NextResponse.json({ error: 'Gagal mengunggah berkas ke storage.' }, { status: 500 });
      }

      const publicData = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
      fileUrl = publicData.data?.publicUrl ?? null;
      fileName = file.name;
      fileType = file.type;
      fileSize = file.size;
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      title,
      description,
      content,
    };

    // Only update file fields if new file was uploaded
    if (fileUrl) {
      updateData.file_url = fileUrl;
      updateData.file_name = fileName;
      updateData.file_type = fileType;
      updateData.file_size = fileSize;
      updateData.file_path = filePath;
    }

    const { data, error } = await supabaseAdmin
      .from('materials')
      .update(updateData)
      .eq('id', editId)
      .select('id, title, description, content, file_url, file_name, file_type, file_size, file_path, created_at')
      .single();

    if (error || !data) {
      console.error('Update materi error:', error);
      // Cleanup uploaded file if database update failed
      if (filePath) {
        await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([filePath]);
      }
      return NextResponse.json({ error: 'Gagal menyimpan data materi.' }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  }

  // Handle CREATE
  let fileUrl = null;
  let fileName = null;
  let fileType = null;
  let fileSize = null;
  let filePath = null;

  // Handle optional file upload
  if (file instanceof File && file.size > 0) {
    const rawName = file.name || 'materi';
    const safeName = sanitizeFileName(rawName) || 'materi';
    filePath = buildFilePath(auth.userId, safeName);

    const { error: uploadError } = await supabaseAdmin.storage.from(STORAGE_BUCKET).upload(filePath, file, {
      upsert: false,
      contentType: file.type || undefined,
    });

    if (uploadError) {
      console.error('Upload materi error:', uploadError);
      return NextResponse.json({ error: 'Gagal mengunggah berkas ke storage.' }, { status: 500 });
    }

    const publicData = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
    fileUrl = publicData.data?.publicUrl ?? null;
    fileName = file.name;
    fileType = file.type;
    fileSize = file.size;
  }

  const { data, error } = await supabaseAdmin
    .from('materials')
    .insert({
      title,
      description,
      content,
      file_url: fileUrl,
      file_name: fileName,
      file_path: filePath,
      file_type: fileType,
      file_size: fileSize,
      uploaded_by: auth.userId,
    })
    .select('id, title, description, content, file_url, file_name, file_type, file_size, file_path, created_at')
    .single();

  if (error || !data) {
    console.error('Insert materi error:', error);
    if (filePath) {
      await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([filePath]);
    }
    return NextResponse.json({ error: 'Gagal menyimpan data materi.' }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
};

export const DELETE = async (request: NextRequest) => {
  const auth = await resolveAuthContext(request);
  if ('response' in auth) {
    return auth.response;
  }

  // Only materi team or bph can delete
  if (!['materi', 'bph', 'admin'].includes(auth.profile?.role ?? '')) {
    return NextResponse.json({ error: 'Tidak memiliki akses untuk menghapus.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID materi diperlukan.' }, { status: 400 });
  }

  // Get file path first
  const { data: material, error: fetchError } = await supabaseAdmin
    .from('materials')
    .select('file_path')
    .eq('id', id)
    .single();

  if (fetchError || !material) {
    return NextResponse.json({ error: 'Materi tidak ditemukan.' }, { status: 404 });
  }

  // Delete from storage if file exists
  if (material.file_path) {
    await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([material.file_path]);
  }

  // Delete from database
  const { error: deleteError } = await supabaseAdmin
    .from('materials')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('Delete materi error:', deleteError);
    return NextResponse.json({ error: 'Gagal menghapus materi.' }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
};
