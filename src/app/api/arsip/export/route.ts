import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { formatArchiveFullLabel } from '@/lib/archive-utils';
import type { ArchivedIzin } from '@/lib/supabase';

const timestampFormatter = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const archiveDate = searchParams.get('archiveDate');
    const statusFilter = (searchParams.get('status') ?? 'approved').toLowerCase();

    if (!['approved', 'pending', 'all'].includes(statusFilter)) {
      return NextResponse.json({ error: 'Parameter status tidak valid.' }, { status: 400 });
    }

    if (archiveDate && !/^\d{4}-\d{2}-\d{2}$/.test(archiveDate)) {
      return NextResponse.json({ error: 'Parameter tanggal tidak valid.' }, { status: 400 });
    }

    let query = supabaseAdmin
      .from('izin_archive')
      .select('*')
      .order('archive_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (archiveDate) {
      query = query.eq('archive_date', archiveDate);
    }

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    } else {
      query = query.order('status', { ascending: true });
    }

    const { data, error } = await query;

    if (error) throw error;

    const archiveItems = (data ?? []) as ArchivedIzin[];

    if (archiveDate && archiveItems.length === 0) {
      return NextResponse.json({ error: 'Arsip untuk tanggal tersebut tidak ditemukan.' }, { status: 404 });
    }

    if (!archiveDate && archiveItems.length === 0) {
      return NextResponse.json({ error: 'Belum ada data arsip untuk diunduh.' }, { status: 404 });
    }

    const rows = archiveItems.map((item, index) => ({
      No: index + 1,
      'Tanggal Arsip': formatArchiveFullLabel(item.archive_date),
      Nama: item.nama,
      Absen: item.absen,
      Kelas: item.kelas,
      Status: item.status === 'approved' ? 'Diizinkan' : 'Pending',
      Alasan: item.alasan,
      'Dibuat Pada': timestampFormatter.format(new Date(item.created_at)),
      'Diarsipkan Pada': timestampFormatter.format(new Date(item.archived_at)),
    }));

    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: [
        'No',
        'Tanggal Arsip',
        'Nama',
        'Absen',
        'Kelas',
        'Status',
        'Alasan',
        'Dibuat Pada',
        'Diarsipkan Pada',
      ],
      skipHeader: false,
    });

    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 28 },
      { wch: 24 },
      { wch: 8 },
      { wch: 8 },
      { wch: 18 },
      { wch: 45 },
      { wch: 26 },
      { wch: 26 },
    ];

    const sheetBaseName = archiveDate ? formatArchiveFullLabel(archiveDate) : 'Arsip';
    const sheetName = sheetBaseName.slice(0, 31) || 'Arsip';

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const buffer: Buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
      compression: true,
    });

    const statusSuffix = statusFilter === 'all' ? 'semua-status' : statusFilter;

    const filename = archiveDate
      ? `arsip-izin-${archiveDate}-${statusSuffix}.xlsx`
      : `arsip-izin-${statusSuffix}-${new Date().toISOString().slice(0, 10)}.xlsx`;

    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer;

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('GET /api/arsip/export error:', error);
    return NextResponse.json({ error: 'Gagal menghasilkan arsip XLSX.' }, { status: 500 });
  }
}
