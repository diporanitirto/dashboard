'use client';

import { useState, type SVGProps } from 'react';
import { Izin } from '@/lib/supabase';

const TrashIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 4h5M4 7h16M18 7l-.7 11.2a2 2 0 0 1-2 1.8H8.7a2 2 0 0 1-2-1.8L6 7m4 4.5v5m4-5v5" />
  </svg>
);

const ChevronIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const allSelected = data.length > 0 && data.every(item => selectedIds.has(item.id));
  const someSelected = data.some(item => selectedIds.has(item.id)) && !allSelected;

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800">
          <span className="text-3xl">📭</span>
        </div>
        <p className="text-sm font-medium text-slate-400">Tidak ada data izin untuk ditampilkan.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/50 shadow-lg overflow-hidden">
      {/* Header with select all */}
      {canManage && onSelectionChange && (
        <div className="flex items-center gap-3 border-b border-slate-700 bg-slate-800/50 px-4 py-3">
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
          <span className="text-xs text-slate-400">
            {selectedIds.size > 0 ? `${selectedIds.size} dipilih` : 'Pilih semua'}
          </span>
        </div>
      )}

      {/* List */}
      <div className="divide-y divide-slate-700/50">
        {data.map((item) => {
          const isExpanded = expandedId === item.id;
          
          return (
            <div key={item.id} className="bg-slate-900/30">
              {/* Row - Always Visible */}
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/40 transition-colors">
                {/* Checkbox */}
                {canManage && onSelectionChange && (
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSelectOne(item.id, e.target.checked);
                    }}
                    className="h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-700 text-sky-500 focus:ring-sky-500"
                    aria-label={`Pilih ${item.nama}`}
                  />
                )}

                {/* Main Content - Clickable */}
                <div 
                  className="flex flex-1 items-center gap-3 cursor-pointer min-w-0"
                  onClick={() => toggleExpand(item.id)}
                >
                  {/* Kelas Badge */}
                  <div className="shrink-0">
                    <span className="inline-flex items-center rounded-lg bg-sky-500/20 px-2.5 py-1 text-xs font-bold text-sky-300">
                      {item.kelas}
                    </span>
                  </div>

                  {/* Name & Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-100 truncate">{item.nama}</p>
                    <p className="text-xs text-slate-400">
                      Absen {item.absen}
                      {item.sangga && <span className="text-purple-400"> • {item.sangga}</span>}
                    </p>
                  </div>

                  {/* Date - Hidden on mobile */}
                  <span className="hidden sm:block text-xs text-slate-500 shrink-0">
                    {formatDate(item.created_at)}
                  </span>

                  {/* Expand Icon */}
                  <ChevronIcon 
                    className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                  />
                </div>
              </div>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className="border-t border-slate-700/50 bg-slate-800/30 px-4 py-4 space-y-4">
                  {/* Info Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl bg-slate-800/50 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Kelas</p>
                      <p className="text-sm font-semibold text-slate-200">{item.kelas}</p>
                    </div>
                    <div className="rounded-xl bg-slate-800/50 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">No. Absen</p>
                      <p className="text-sm font-semibold text-slate-200">{item.absen}</p>
                    </div>
                    <div className="rounded-xl bg-slate-800/50 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Sangga</p>
                      <p className="text-sm font-semibold text-purple-300">{item.sangga || '-'}</p>
                    </div>
                    <div className="rounded-xl bg-slate-800/50 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Waktu</p>
                      <p className="text-sm font-semibold text-slate-200">{formatDate(item.created_at)}</p>
                      <p className="text-xs text-slate-400">{formatTime(item.created_at)}</p>
                    </div>
                  </div>

                  {/* Alasan */}
                  <div className="rounded-xl bg-slate-800/50 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Alasan Izin</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{item.alasan}</p>
                  </div>

                  {/* Verification Info */}
                  {item.verified_by && (
                    <div className="flex items-center gap-2 text-xs text-sky-400 bg-sky-500/10 rounded-xl px-3 py-2">
                      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Diverifikasi oleh <strong>{item.verified_by}</strong></span>
                    </div>
                  )}

                  {/* Actions */}
                  {canManage && (
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => onDeleteClick(item)}
                        disabled={busyId === item.id}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-500/50 bg-slate-800 px-4 py-2 text-sm font-medium text-rose-400 shadow-sm transition hover:border-rose-400 hover:bg-rose-500/10 hover:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:cursor-not-allowed disabled:border-rose-800 disabled:text-rose-700"
                      >
                        <TrashIcon className={busyId === item.id ? 'h-4 w-4 animate-pulse' : 'h-4 w-4'} />
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
