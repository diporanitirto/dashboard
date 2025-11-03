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
};

export function IzinTable({ data, onApproveClick, onDeleteClick, canManage, busyId }: IzinTableProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="space-y-4 p-4 sm:hidden">
        {data.map((item) => (
          <div key={item.id} className="rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {item.kelas} · {item.absen}
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-800">{item.nama}</p>
              </div>
              <StatusBadge label={item.status} />
            </div>
            <p className="mt-3 text-sm text-slate-500">
              {item.alasan}
            </p>
            {item.verified_by && (
              <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Diverifikasi oleh: <strong>{item.verified_by}</strong></span>
              </div>
            )}
            <p className="mt-3 text-xs text-slate-400">
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
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-emerald-200"
                  >
                    {busyId === item.id ? 'Memproses...' : 'Approve'}
                  </button>
                )}
                <button
                  onClick={() => onDeleteClick(item)}
                  disabled={busyId === item.id}
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border border-rose-300 bg-white text-rose-500 shadow-sm transition hover:border-rose-400 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:cursor-not-allowed disabled:border-rose-200 disabled:text-rose-300 ${item.status === 'pending' ? '' : 'ml-auto'}`}
                  aria-label="Hapus izin"
                >
                  <TrashIcon className={busyId === item.id ? 'h-4 w-4 animate-pulse' : 'h-4 w-4'} />
                </button>
              </div>
            )}
          </div>
        ))}
        {data.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm font-medium text-slate-500">
            Tidak ada data izin untuk ditampilkan.
          </div>
        )}
      </div>

      <div className="hidden sm:block">
        <div className="w-full overflow-x-auto">
          <table className="min-w-[720px] divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Nama
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Absen
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Kelas
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Alasan
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Waktu
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Verifikasi
            </th>
            {canManage && (
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">
                Aksi
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white text-sm">
          {data.map((item) => (
            <tr key={item.id} className="transition hover:bg-sky-50/80">
              <td className="px-4 py-4 font-semibold text-slate-800">
                {item.nama}
              </td>
              <td className="px-4 py-4 text-slate-600">{item.absen}</td>
              <td className="px-4 py-4 text-slate-600">{item.kelas}</td>
              <td className="px-4 py-4">
                <StatusBadge label={item.status} />
              </td>
              <td className="px-4 py-4 text-slate-600">
                <div className="line-clamp-2 max-w-xs">{item.alasan}</div>
              </td>
              <td className="px-4 py-4 text-slate-500">
                {new Intl.DateTimeFormat('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(item.created_at))}
              </td>
              <td className="px-4 py-4 text-slate-600">
                {item.verified_by ? (
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{item.verified_by}</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">-</span>
                )}
              </td>
              {canManage && (
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {item.status === 'pending' && (
                      <button
                        onClick={() => onApproveClick(item)}
                        disabled={busyId === item.id}
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-emerald-200"
                      >
                        {busyId === item.id ? 'Memproses...' : 'Approve'}
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteClick(item)}
                      disabled={busyId === item.id}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-300 bg-white text-rose-500 shadow-sm transition hover:border-rose-400 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:cursor-not-allowed disabled:border-rose-200 disabled:text-rose-300"
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
                colSpan={canManage ? 8 : 7}
                className="px-4 py-12 text-center text-sm font-medium text-slate-500"
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
