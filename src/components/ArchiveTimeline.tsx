import type { MouseEvent } from 'react';
import type { ArchivedIzin } from '@/lib/supabase';
import { formatArchiveCompactLabel, formatArchiveFullLabel } from '@/lib/archive-utils';

type ArchiveBatch = {
  label?: string;
  archiveDate: string;
  total: number;
  approved: number;
  pending: number;
  items: ArchivedIzin[];
};

type ArchiveTimelineProps = {
  batches: ArchiveBatch[];
  loading?: boolean;
  onDownloadBatch?: (batch: ArchiveBatch) => void;
  downloadingBatch?: string | null;
  statusFilter?: 'all' | 'approved' | 'pending';
};

export function ArchiveTimeline({ batches, loading, onDownloadBatch, downloadingBatch, statusFilter = 'all' }: ArchiveTimelineProps) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div className="h-4 w-1/4 rounded-full bg-slate-200" />
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-16 rounded-2xl bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!batches.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm font-medium text-slate-500">
        Arsip mingguan belum tersedia.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {batches.map((batch) => {
        const displayDate = formatArchiveFullLabel(batch.archiveDate);
        const badgeLabel = batch.label ?? `Arsip ${formatArchiveCompactLabel(batch.archiveDate)}`;
        const isDownloading = downloadingBatch === batch.archiveDate;
        const visibleItems = (() => {
          if (statusFilter === 'all') {
            return [...batch.items].sort((a, b) => {
              if (a.status === b.status) {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
              }
              return a.status === 'approved' ? -1 : 1;
            });
          }
          return batch.items
            .filter((item) => item.status === statusFilter)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        })();
        const hasVisible = visibleItems.length > 0;
        const handleDownloadClick = (event: MouseEvent<HTMLButtonElement>) => {
          event.preventDefault();
          event.stopPropagation();
          onDownloadBatch?.(batch);
        };

        return (
          <details key={batch.archiveDate} className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-200">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{badgeLabel}</p>
                <h4 className="mt-1 text-lg font-semibold text-slate-800">{displayDate}</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Total {batch.total} izin · {batch.approved} disetujui · {batch.pending} pending
                </p>
                {statusFilter !== 'all' && (
                  <p className="mt-1 text-xs font-medium text-emerald-600">
                    Menampilkan {visibleItems.length} izin {statusFilter === 'approved' ? 'disetujui' : 'pending'}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                {onDownloadBatch && (
                  <button
                    type="button"
                    onClick={handleDownloadClick}
                    disabled={isDownloading}
                    className="inline-flex items-center justify-center rounded-full border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-600 transition hover:border-emerald-400 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:border-emerald-200 disabled:text-emerald-300"
                  >
                    {isDownloading ? 'Menyiapkan...' : 'Unduh XLSX (Approved)'}
                  </button>
                )}
                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition group-open:bg-sky-100 group-open:text-slate-800">
                  Lihat detail
                </span>
              </div>
            </summary>
            <div className="mt-4 space-y-3">
              {!hasVisible && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs font-medium text-slate-500">
                  Tidak ada izin dengan status ini.
                </div>
              )}
              {visibleItems.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.nama}</p>
                      <p className="text-xs text-slate-500">
                        Kelas {item.kelas} · Absen {item.absen}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        item.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {item.status === 'approved' ? 'Diizinkan' : 'Pending'}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{item.alasan}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    Dibuat {new Intl.DateTimeFormat('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(item.created_at))}
                  </p>
                </div>
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );
}
