'use client';

import { Izin } from '@/lib/supabase';
import { StatusBadge } from './StatusBadge';

type RecentActivityProps = {
  data: Izin[];
};

export function RecentActivity({ data }: RecentActivityProps) {
  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-600">
            {item.nama.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-slate-800">
                {item.nama}
              </p>
              <StatusBadge label={item.status} />
            </div>
            <p className="text-sm text-slate-500">
              Kelas {item.kelas} · Absen #{item.absen}
            </p>
            <p className="mt-2 line-clamp-2 text-sm text-slate-600">
              {item.alasan}
            </p>
            <p className="mt-3 text-xs text-slate-400">
              {new Intl.DateTimeFormat('id-ID', {
                weekday: 'short',
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
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          Aktivitas terbaru akan muncul di sini.
        </div>
      )}
    </div>
  );
}
