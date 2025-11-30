'use client';

import { Izin } from '@/lib/supabase';
import { StatusBadge } from './StatusBadge';

type RecentActivityProps = {
  data: Izin[];
};

export function RecentActivity({ data }: RecentActivityProps) {
  return (
    <div className="space-y-2 overflow-hidden">
      {data.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-2 rounded-lg border border-slate-700 bg-slate-800/50 p-2 sm:gap-3 sm:rounded-xl sm:p-3 overflow-hidden"
        >
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-sky-900/60 text-[10px] font-bold text-sky-400 sm:h-8 sm:w-8 sm:text-xs">
            {item.nama.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between gap-1.5 overflow-hidden">
              <p className="font-semibold text-slate-100 truncate text-xs sm:text-sm min-w-0 flex-1">
                {item.nama}
              </p>
              <StatusBadge label={item.status} />
            </div>
            <p className="text-[9px] text-slate-400 sm:text-xs">
              {item.kelas} · #{item.absen}
            </p>
            <p className="mt-0.5 line-clamp-1 text-[9px] text-slate-300 sm:text-xs">
              {item.alasan}
            </p>
            <p className="mt-0.5 text-[8px] text-slate-500 sm:mt-1 sm:text-[10px]">
              {new Intl.DateTimeFormat('id-ID', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(item.created_at))}
            </p>
          </div>
        </div>
      ))}
      {data.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-700 p-4 text-center text-xs text-slate-500 sm:rounded-xl sm:p-6 sm:text-sm">
          Aktivitas terbaru akan muncul di sini.
        </div>
      )}
    </div>
  );
}
