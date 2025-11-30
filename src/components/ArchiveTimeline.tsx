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
      <div className="rounded-3xl border border-slate-700 bg-slate-900/60 p-6">
        <div className="space-y-4">
          <div className="h-4 w-1/4 rounded-full bg-slate-700" />
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-16 rounded-2xl bg-slate-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!batches.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/60 p-6 text-center text-sm font-medium text-slate-400">
        Arsip mingguan belum tersedia.
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
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
          <details key={batch.archiveDate} className="group rounded-2xl border border-slate-700 bg-slate-900/60 p-3 transition hover:border-sky-500/50 sm:rounded-3xl sm:p-5">
            <summary className="flex cursor-pointer list-none flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-400 sm:text-xs sm:tracking-[0.2em]">{badgeLabel}</p>
                <h4 className="mt-0.5 truncate text-base font-semibold text-slate-100 sm:mt-1 sm:text-lg">{displayDate}</h4>
                <p className="mt-0.5 text-[10px] text-slate-400 sm:mt-1 sm:text-xs">
                  {batch.total} izin · {batch.approved} disetujui · {batch.pending} pending
                </p>
                {statusFilter !== 'all' && (
                  <p className="mt-0.5 text-[10px] font-medium text-emerald-400 sm:mt-1 sm:text-xs">
                    {visibleItems.length} izin {statusFilter === 'approved' ? 'disetujui' : 'pending'}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {onDownloadBatch && (
                  <button
                    type="button"
                    onClick={handleDownloadClick}
                    disabled={isDownloading}
                    className="inline-flex items-center justify-center rounded-full border border-emerald-500/50 px-2.5 py-1 text-[10px] font-semibold text-emerald-400 transition hover:border-emerald-400 hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:border-emerald-700 disabled:text-emerald-700 sm:px-3 sm:text-xs"
                  >
                    {isDownloading ? '...' : 'Unduh'}
                  </button>
                )}
                <span className="rounded-full border border-slate-600 px-2.5 py-1 text-[10px] font-semibold text-slate-400 transition group-open:border-sky-500/50 group-open:bg-sky-500/20 group-open:text-sky-300 sm:px-3 sm:text-xs">
                  Detail
                </span>
              </div>
            </summary>
            <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
              {!hasVisible && (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-800/50 p-3 text-center text-[10px] font-medium text-slate-500 sm:rounded-2xl sm:p-4 sm:text-xs">
                  Tidak ada izin dengan status ini.
                </div>
              )}
              {visibleItems.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 sm:rounded-2xl sm:p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-100">{item.nama}</p>
                      <p className="text-[10px] text-slate-400 sm:text-xs">
                        {item.kelas} · Absen {item.absen}
                      </p>
                    </div>
                    <span
                      className={`flex-shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold sm:px-3 sm:py-1 sm:text-xs ${
                        item.status === 'approved'
                          ? 'bg-emerald-900/50 text-emerald-400'
                          : 'bg-amber-900/50 text-amber-400'
                      }`}
                    >
                      {item.status === 'approved' ? 'Diizinkan' : 'Pending'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-300 sm:mt-3 sm:text-sm">{item.alasan}</p>
                  <p className="mt-1.5 text-[10px] text-slate-500 sm:mt-2 sm:text-xs">
                    {new Intl.DateTimeFormat('id-ID', {
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
