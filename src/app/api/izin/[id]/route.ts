import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const ensureAdminAuthorized = (request: Request) => {
  const configuredToken = process.env.ADMIN_ACTION_TOKEN;

  if (!configuredToken) {
    console.error('ADMIN_ACTION_TOKEN belum dikonfigurasi.');
    return {
      success: false,
      status: 500,
      message: 'Konfigurasi server belum lengkap. Hubungi administrator.',
    } as const;
  }

  const providedToken = request.headers.get('x-action-token');
  if (!providedToken || providedToken !== configuredToken) {
    return {
      success: false,
      status: 401,
      message: 'Token tidak valid.',
    } as const;
  }

  return { success: true } as const;
};

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = ensureAdminAuthorized(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const { id } = params;

    const { data, error } = await supabaseAdmin
      .from('izin')
      .update({ status: 'approved' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('PATCH /api/izin/[id] error:', error);
    return NextResponse.json({ error: 'Gagal mengubah status izin' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = ensureAdminAuthorized(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const { id } = params;
    const { error } = await supabaseAdmin.from('izin').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/izin/[id] error:', error);
    return NextResponse.json({ error: 'Gagal menghapus izin' }, { status: 500 });
  }
}
