import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const showArchived = searchParams.get('archived') === 'true';

    const { data, error } = await supabaseAdmin
      .from('izin')
      .select('*')
      .eq('is_archived', showArchived)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('GET /api/izin error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data izin' }, { status: 500 });
  }
}
