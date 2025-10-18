import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getFridayArchiveWindow } from '@/lib/archive-utils';

export async function POST() {
  try {
    const window = getFridayArchiveWindow();

    if (!window.eligible) {
      return NextResponse.json({ archived: 0, skipped: true });
    }

    const { data: candidates, error: selectError } = await supabaseAdmin
      .from('izin')
      .select('*')
      .gte('created_at', window.rangeStartUtc)
      .lte('created_at', window.rangeEndUtc);

    if (selectError) throw selectError;
    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ archived: 0 });
    }

    const archiveRows = candidates.map((item) => ({
      id: item.id,
      nama: item.nama,
      absen: item.absen,
      kelas: item.kelas,
      alasan: item.alasan,
      status: item.status,
      created_at: item.created_at,
      archive_date: window.isoDate,
      archived_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabaseAdmin.from('izin_archive').upsert(archiveRows);
    if (insertError) throw insertError;

    const ids = candidates.map((item) => item.id);
    const { error: deleteError } = await supabaseAdmin.from('izin').delete().in('id', ids);
    if (deleteError) throw deleteError;

    return NextResponse.json({ archived: archiveRows.length, archiveDate: window.isoDate });
  } catch (error) {
    console.error('POST /api/archive error:', error);
    return NextResponse.json({ error: 'Gagal memindahkan izin ke arsip' }, { status: 500 });
  }
}
