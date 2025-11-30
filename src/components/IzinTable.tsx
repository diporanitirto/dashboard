'use client';

import type { SVGProps } from 'react';
import { Izin } from '@/lib/supabase';
import { StatusBadge } from './StatusBadge';

const TrashIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 4h5M4 7h16M18 7l-.7 11.2a2 2 0 0 1-2 1.8H8.7a2 2 0 0 1-2-1.8L6 7m4 4.5v5m4-5v5" />
  </svg>
);

type IzinTableProps = {
  data: Izin[];
  onApproveClick: (izin: Izin) => void;
  onDeleteClick: (izin: Izin) => void;
  canManage: boolean;
  busyId?: string | null;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
};

export function IzinTable({ data, onApproveClick, onDeleteClick, canManage, busyId, selectedIds = new Set(), onSelectionChange }: IzinTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange(new Set(data.map(item => item.id)));
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (!onSelectionChange) return;
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    onSelectionChange(newSet);
  };

  const allSelected = data.length > 0 && data.every(item => selectedIds.has(item.id));
  const someSelected = data.some(item => selectedIds.has(item.id)) && !allSelected;

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/50 shadow-lg">
      <div className="space-y-4 p-4 sm:hidden">
        {data.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {item.kelas} · {item.absen}
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-100">{item.nama}</p>
                {item.sangga && (
                  <p className="mt-1 text-xs text-slate-400">
                    <span className="inline-flex items-center rounded-full bg-purple-900/50 px-2 py-0.5 font-medium text-purple-300">
                      <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {item.sangga}
                    </span>
                  </p>
                )}
              </div>
              <StatusBadge label={item.status} />
            </div>
            <p className="mt-3 text-sm text-slate-300">
              {item.alasan}
            </p>
            {item.verified_by && (
              <div className="mt-2 flex items-center gap-2 text-xs text-sky-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Diverifikasi oleh: <strong>{item.verified_by}</strong></span>
              </div>
            )}
            <p className="mt-3 text-xs text-slate-500">
              {new Intl.DateTimeFormat('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(item.created_at))}
            </p>
            {canManage && (
              <div className={`mt-4 flex items-center gap-2 ${item.status !== 'pending' ? 'justify-end' : ''}`}>
                {item.status === 'pending' && (
                  <button
                    onClick={() => onApproveClick(item)}
                    disabled={busyId === item.id}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 shadow-sm transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-800"
                  >
                    {busyId === item.id ? 'Memproses...' : 'Approve'}
                  </button>
                )}
                <button
                  onClick={() => onDeleteClick(item)}
                  disabled={busyId === item.id}
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border border-rose-500/50 bg-slate-800 text-rose-400 shadow-sm transition hover:border-rose-400 hover:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:cursor-not-allowed disabled:border-rose-800 disabled:text-rose-700 ${item.status === 'pending' ? '' : 'ml-auto'}`}
                  aria-label="Hapus izin"
                >
                  <TrashIcon className={busyId === item.id ? 'h-4 w-4 animate-pulse' : 'h-4 w-4'} />
                </button>
              </div>
            )}
          </div>
        ))}
        {data.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm font-medium text-slate-500">
            Tidak ada data izin untuk ditampilkan.
          </div>
        )}
      </div>

      <div className="hidden sm:block">
        <div className="w-full overflow-x-auto">
          <table className="min-w-[720px] divide-y divide-slate-700">
        <thead className="bg-slate-800/80">
          <tr>
            {canManage && onSelectionChange && (
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = someSelected;
                    }
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-sky-500 focus:ring-sky-500"
                  aria-label="Pilih semua"
                />
              </th>
            )}
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              Nama
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              Absen
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              Kelas
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              Sangga
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              Alasan
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              Waktu
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              Verifikasi
            </th>
            {canManage && (
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 text-right">
                Aksi
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700 bg-slate-900/30 text-sm">
          {data.map((item) => (
            <tr key={item.id} className="transition hover:bg-slate-800/60">
              {canManage && onSelectionChange && (
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-sky-500 focus:ring-sky-500"
                    aria-label={`Pilih ${item.nama}`}
                  />
                </td>
              )}
              <td className="px-4 py-4 font-semibold text-slate-100">
                {item.nama}
              </td>
              <td className="px-4 py-4 text-slate-300">{item.absen}</td>
              <td className="px-4 py-4 text-slate-300">{item.kelas}</td>
              <td className="px-4 py-4">
                {item.sangga ? (
                  <span className="inline-flex items-center rounded-full bg-purple-900/50 px-2.5 py-1 text-xs font-medium text-purple-300">
                    <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {item.sangga}
                  </span>
                ) : (
                  <span className="text-xs text-slate-600">-</span>
                )}
              </td>
              <td className="px-4 py-4">
                <StatusBadge label={item.status} />
              </td>
              <td className="px-4 py-4 text-slate-300">
                <div className="line-clamp-2 max-w-xs">{item.alasan}</div>
              </td>
              <td className="px-4 py-4 text-slate-400">
                {new Intl.DateTimeFormat('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(item.created_at))}
              </td>
              <td className="px-4 py-4 text-slate-300">
                {item.verified_by ? (
                  <div className="flex items-center gap-1 text-xs text-sky-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{item.verified_by}</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-600">-</span>
                )}
              </td>
              {canManage && (
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {item.status === 'pending' && (
                      <button
                        onClick={() => onApproveClick(item)}
                        disabled={busyId === item.id}
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-emerald-950 shadow-sm transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-800"
                      >
                        {busyId === item.id ? 'Memproses...' : 'Approve'}
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteClick(item)}
                      disabled={busyId === item.id}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-500/50 bg-slate-800 text-rose-400 shadow-sm transition hover:border-rose-400 hover:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:cursor-not-allowed disabled:border-rose-800 disabled:text-rose-700"
                      aria-label="Hapus izin"
                    >
                      <TrashIcon className={busyId === item.id ? 'h-4 w-4 animate-pulse' : 'h-4 w-4'} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td
                colSpan={canManage ? 9 : 8}
                className="px-4 py-12 text-center text-sm font-medium text-slate-400"
              >
                Tidak ada data izin untuk ditampilkan.
              </td>
            </tr>
          )}
        </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
