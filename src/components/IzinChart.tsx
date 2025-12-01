'use client';

import { useMemo } from 'react';
import type { Izin } from '@/lib/supabase';

type IzinChartProps = {
  izinList: Izin[];
};

export function IzinChart({ izinList }: IzinChartProps) {
  // Calculate stats
  const stats = useMemo(() => {
    const pending = izinList.filter(i => i.status === 'pending' && !i.is_archived).length;
    const approved = izinList.filter(i => i.status === 'approved' && !i.is_archived).length;
    const archived = izinList.filter(i => i.is_archived).length;
    const total = izinList.length;

    return { pending, approved, archived, total };
  }, [izinList]);

  // Calculate daily trend for last 7 days
  const dailyTrend = useMemo(() => {
    const days: { date: string; label: string; count: number }[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayLabel = date.toLocaleDateString('id-ID', { weekday: 'short' });
      
      const count = izinList.filter(izin => {
        const izinDate = new Date(izin.created_at).toISOString().split('T')[0];
        return izinDate === dateStr;
      }).length;

      days.push({ date: dateStr, label: dayLabel, count });
    }

    return days;
  }, [izinList]);

  const maxCount = Math.max(...dailyTrend.map(d => d.count), 1);

  // Pie chart calculations
  const pieData = useMemo(() => {
    const total = stats.pending + stats.approved + stats.archived;
    if (total === 0) return [];

    const items = [
      { label: 'Pending', value: stats.pending, color: '#f59e0b' },
      { label: 'Diizinkan', value: stats.approved, color: '#10b981' },
      { label: 'Diarsipkan', value: stats.archived, color: '#64748b' },
    ].filter(item => item.value > 0);

    let currentAngle = 0;
    return items.map(item => {
      const percentage = (item.value / total) * 100;
      const angle = (item.value / total) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;
      return { ...item, percentage, startAngle, endAngle: currentAngle };
    });
  }, [stats]);

  // Generate SVG arc path
  const getArcPath = (startAngle: number, endAngle: number, radius: number) => {
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);
    
    const x1 = 50 + radius * Math.cos(startRad);
    const y1 = 50 + radius * Math.sin(startRad);
    const x2 = 50 + radius * Math.cos(endRad);
    const y2 = 50 + radius * Math.sin(endRad);
    
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M 50 50 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Status Distribution - Donut Chart */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6">
        <h3 className="mb-4 text-sm font-semibold text-slate-300">Distribusi Status</h3>
        
        <div className="flex items-center gap-6">
          {/* Donut Chart */}
          <div className="relative h-32 w-32 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              {pieData.length > 0 ? (
                pieData.map((item, index) => (
                  <path
                    key={index}
                    d={getArcPath(item.startAngle, item.endAngle, 40)}
                    fill={item.color}
                    className="transition-all duration-300 hover:opacity-80"
                  />
                ))
              ) : (
                <circle cx="50" cy="50" r="40" fill="#334155" />
              )}
              {/* Inner circle for donut effect */}
              <circle cx="50" cy="50" r="25" fill="#1e293b" />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">{stats.total}</span>
              <span className="text-xs text-slate-400">Total</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="text-sm text-slate-400">Pending</span>
              <span className="ml-auto text-sm font-semibold text-white">{stats.pending}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-slate-400">Diizinkan</span>
              <span className="ml-auto text-sm font-semibold text-white">{stats.approved}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-slate-500" />
              <span className="text-sm text-slate-400">Diarsipkan</span>
              <span className="ml-auto text-sm font-semibold text-white">{stats.archived}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Trend - Bar Chart */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6">
        <h3 className="mb-4 text-sm font-semibold text-slate-300">Izin 7 Hari Terakhir</h3>
        
        <div className="flex h-32 items-end gap-2">
          {dailyTrend.map((day, index) => {
            const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
            const isToday = index === dailyTrend.length - 1;
            
            return (
              <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
                {/* Bar */}
                <div className="relative flex h-24 w-full items-end justify-center">
                  <div
                    className={`w-full max-w-8 rounded-t-lg transition-all duration-500 ${
                      isToday 
                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400' 
                        : 'bg-gradient-to-t from-slate-600 to-slate-500'
                    }`}
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  {/* Count tooltip */}
                  {day.count > 0 && (
                    <span className="absolute -top-5 text-xs font-medium text-slate-400">
                      {day.count}
                    </span>
                  )}
                </div>
                {/* Label */}
                <span className={`text-xs ${isToday ? 'font-semibold text-emerald-400' : 'text-slate-500'}`}>
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
