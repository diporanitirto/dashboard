import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getFridayArchiveWindow } from '@/lib/archive-utils';

export async function POST() {
  try {
    const window = getFridayArchiveWindow();

    if (!window.eligible) {
      return NextResponse.json({ archived: 0, skipped: true });
    }

    // Update izin dengan is_archived = true untuk data dalam range
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('izin')
      .update({
        is_archived: true,
        archive_date: window.isoDate,
        archived_at: new Date().toISOString(),
      })
      .gte('created_at', window.rangeStartUtc)
      .lte('created_at', window.rangeEndUtc)
      .eq('is_archived', false)
      .select();

    if (updateError) throw updateError;

    return NextResponse.json({ 
      archived: updated?.length ?? 0, 
      archiveDate: window.isoDate 
    });
  } catch (error) {
    console.error('POST /api/archive error:', error);
    return NextResponse.json({ error: 'Gagal memindahkan izin ke arsip' }, { status: 500 });
  }
}
