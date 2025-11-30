'use client';

import { useCallback, useEffect, useMemo, useState, type SVGProps } from 'react';
import Link from 'next/link';
import type { ArchivedIzin } from '@/lib/supabase';
import { ArchiveTimeline } from '@/components/ArchiveTimeline';
import { formatArchiveCompactLabel } from '@/lib/archive-utils';

const headingFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

type ArchiveBatch = {
  label?: string;
  archiveDate: string;
  total: number;
  approved: number;
  pending: number;
  items: ArchivedIzin[];
};

type StatusFilter = 'all' | 'approved' | 'pending';
const statusOptions: Array<{ key: StatusFilter; label: string }> = [
  { key: 'all', label: 'Semua' },
  { key: 'approved', label: 'Disetujui' },
  { key: 'pending', label: 'Pending' },
];

const RefreshIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 4v5h5M20 20v-5h-5M5 9a7 7 0 0 1 11-5.45M19 15a7 7 0 0 1-11 5.45"
    />
  </svg>
);

export default function ArchivePage() {
  const [batches, setBatches] = useState<ArchiveBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [downloadingBatch, setDownloadingBatch] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const pageTitle = useMemo(() => headingFormatter.format(new Date()), []);

  const runArchiveSweep = useCallback(async () => {
    try {
      await fetch('/api/archive', { method: 'POST' });
    } catch (error) {
      console.error('Archive sweep failed:', error);
    }
  }, []);

  const fetchArchives = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/arsip');
      if (!response.ok) {
        throw new Error('Gagal memuat arsip');
      }
      const payload = (await response.json()) as Array<{
        archiveDate: string;
        total: number;
        approved: number;
        pending: number;
        items: ArchivedIzin[];
      }>;
      const mapped: ArchiveBatch[] = payload.map((batch) => ({
        label: `Arsip ${formatArchiveCompactLabel(batch.archiveDate)}`,
        archiveDate: batch.archiveDate,
        total: batch.total,
        approved: batch.approved,
        pending: batch.pending,
        items: batch.items,
      }));
      setBatches(mapped);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await runArchiveSweep();
      await fetchArchives();
    } catch (error) {
      console.error(error);
      alert('Gagal memuat arsip.');
    } finally {
      setRefreshing(false);
    }
  }, [fetchArchives, runArchiveSweep]);

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }, []);

  const buildTimestamp = useCallback(() => {
    return new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
  }, []);

  const handleDownloadAll = useCallback(async () => {
    try {
      setExporting(true);
      const response = await fetch('/api/arsip/export?status=approved');
      if (response.status === 404) {
        alert('Belum ada data arsip untuk diunduh.');
        return;
      }
      if (!response.ok) {
        throw new Error('Gagal mengunduh arsip');
      }
      const blob = await response.blob();
      downloadBlob(blob, `arsip-izin-semua-${buildTimestamp()}.xlsx`);
    } catch (error) {
      console.error(error);
      alert('Gagal mengunduh arsip.');
    } finally {
      setExporting(false);
    }
  }, [buildTimestamp, downloadBlob]);

  const handleDownloadBatch = useCallback(
    async (batch: ArchiveBatch) => {
      try {
        setDownloadingBatch(batch.archiveDate);
        const response = await fetch(`/api/arsip/export?archiveDate=${batch.archiveDate}&status=approved`);
        if (response.status === 404) {
          alert('Arsip tidak ditemukan untuk tanggal tersebut.');
          return;
        }
        if (!response.ok) {
          throw new Error('Gagal mengunduh arsip mingguan');
        }
        const blob = await response.blob();
        downloadBlob(blob, `arsip-izin-${batch.archiveDate}-${buildTimestamp()}.xlsx`);
      } catch (error) {
        console.error(error);
        alert('Gagal mengunduh arsip mingguan.');
      } finally {
        setDownloadingBatch(null);
      }
    },
    [buildTimestamp, downloadBlob]
  );

  useEffect(() => {
    handleRefresh().catch((error) => console.error(error));
  }, [handleRefresh]);

  return (
    <div className="min-h-screen bg-slate-950 pb-16">
      <div className="px-4 pt-10 lg:px-6">
        {/* Header Section */}
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">
              Arsip Jumat
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-50 sm:text-3xl">
              Rekap Izin Sejak Awal Kegiatan
            </h1>
            <p className="text-xs text-slate-400 sm:text-sm">
              Terakhir diperbarui {pageTitle}. Arsip dipindahkan otomatis setiap Jumat pukul 15.00 WIB.
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-slate-600 hover:text-slate-100 sm:px-4 sm:py-2 sm:text-sm"
            >
              Kembali
            </Link>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="Segarkan"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-900 shadow transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-400 sm:h-10 sm:w-10"
            >
              {refreshing ? (
                <RefreshIcon className="h-4 w-4 animate-[spin_0.8s_linear_infinite_reverse] sm:h-5 sm:w-5" />
              ) : (
                <RefreshIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>
            <button
              onClick={handleDownloadAll}
              disabled={exporting}
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-950 shadow transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-700 sm:px-4 sm:py-2 sm:text-sm"
            >
              {exporting ? 'Menyiapkan...' : 'Unduh XLSX'}
            </button>
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center gap-2 overflow-x-auto rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300">
            <span className="flex-shrink-0">Status:</span>
            <div className="flex gap-1">
              {statusOptions.map((option) => {
                const active = statusFilter === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setStatusFilter(option.key)}
                    className={`flex-shrink-0 rounded-full px-2.5 py-1 transition sm:px-3 ${
                      active
                        ? 'bg-slate-50 text-slate-900'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <ArchiveTimeline
            batches={batches}
            loading={loading}
            onDownloadBatch={handleDownloadBatch}
            downloadingBatch={downloadingBatch}
            statusFilter={statusFilter}
          />
        </div>
      </div>
    </div>
  );
}
