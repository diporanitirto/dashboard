import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { ArchivedIzin } from '@/lib/supabase';
import { formatArchiveCompactLabel } from '@/lib/archive-utils';

export type ArchiveBatchResponse = Array<{
  label?: string;
  archiveDate: string;
  total: number;
  approved: number;
  pending: number;
  items: ArchivedIzin[];
}>;

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('izin')
      .select('*')
      .eq('is_archived', true)
      .order('archive_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    const grouped = new Map<string, ArchivedIzin[]>();
    (data ?? []).forEach((item) => {
      if (!item.archive_date) return;
      const list = grouped.get(item.archive_date) ?? [];
      list.push(item as ArchivedIzin);
      grouped.set(item.archive_date, list);
    });

    const response: ArchiveBatchResponse = Array.from(grouped.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([archiveDate, items]) => {
        const approved = items.filter((item) => item.status === 'approved').length;
        const pending = items.filter((item) => item.status === 'pending').length;
        return {
          label: `Arsip ${formatArchiveCompactLabel(archiveDate)}`,
          archiveDate,
          total: items.length,
          approved,
          pending,
          items,
        };
      });

    return NextResponse.json(response);
  } catch (error) {
    console.error('GET /api/arsip error:', error);
    return NextResponse.json({ error: 'Gagal memuat arsip Jumat' }, { status: 500 });
  }
}
