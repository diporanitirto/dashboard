import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('izin')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('GET /api/izin error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data izin' }, { status: 500 });
  }
}
