'use client';

type ClassDistributionProps = {
  data: Record<string, number>;
};

export function ClassDistribution({ data }: ClassDistributionProps) {
  const total = Object.values(data).reduce((sum, val) => sum + val, 0);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Distribusi Kelas</h3>
          <p className="text-sm text-slate-500">
            Total {total} izin dari 8 kelas
          </p>
        </div>
      </div>
      <div className="mt-6 space-y-4">
        {Object.entries(data).map(([kelas, value]) => {
          const percentage = total === 0 ? 0 : Math.round((value / total) * 100);
          return (
            <div key={kelas}>
              <div className="flex items-center justify-between text-sm font-medium text-slate-600">
                <span>Kelas {kelas}</span>
                <span>{value} siswa • {percentage}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-300 via-blue-300 to-indigo-400"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
