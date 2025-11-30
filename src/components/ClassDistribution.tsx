'use client';

type ClassDistributionProps = {
  data: Record<string, number>;
};

export function ClassDistribution({ data }: ClassDistributionProps) {
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);

  return (
    <div className="space-y-3">
      {Object.entries(data).map(([kelas, value]) => {
        const percentage = total === 0 ? 0 : Math.round((value / total) * 100);
        return (
          <div key={kelas}>
            <div className="flex items-center justify-between gap-2 text-xs font-medium">
              <span className="text-slate-300 flex-shrink-0">{kelas}</span>
              <span className="text-slate-400 text-right truncate">{value} siswa • {percentage}%</span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-slate-700 sm:h-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
