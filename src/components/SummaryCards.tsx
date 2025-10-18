type SummaryCardsProps = {
  total: number;
  pending: number;
  approved: number;
  approvalRate: number;
};

const cards = [
  {
    key: 'total',
    title: 'Total Izin',
    gradient: 'from-sky-300 via-sky-400 to-blue-400',
  },
  {
    key: 'pending',
    title: 'Menunggu Keputusan',
    gradient: 'from-amber-200 via-amber-300 to-orange-300',
  },
  {
    key: 'approved',
    title: 'Sudah Diizinkan',
    gradient: 'from-emerald-200 via-emerald-300 to-teal-300',
  },
  {
    key: 'approvalRate',
    title: 'Persentase Approval',
    gradient: 'from-fuchsia-200 via-pink-200 to-rose-200',
  },
] as const;

export function SummaryCards({ total, pending, approved, approvalRate }: SummaryCardsProps) {
  const values: Record<string, string> = {
    total: total.toString(),
    pending: pending.toString(),
    approved: approved.toString(),
    approvalRate: `${Number.isFinite(approvalRate) ? approvalRate.toFixed(0) : 0}%`,
  };

  const primaryCards = cards.filter((card) => card.key !== 'approvalRate');
  const approvalCard = cards.find((card) => card.key === 'approvalRate');

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {primaryCards.map((card) => (
          <div
            key={card.key}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} p-[1px] shadow-lg transition hover:scale-[1.01]`}
          >
            <div className="flex h-full flex-col items-center justify-center rounded-[calc(theme(spacing.4))] bg-white/95 py-3 backdrop-blur">
              <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                {card.title}
              </p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900">
                {values[card.key]}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {approvalCard && (
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${approvalCard.gradient} p-[1px] shadow-lg transition hover:scale-[1.01]`}>
          <div className="flex h-full flex-col items-center justify-center rounded-[calc(theme(spacing.6))] bg-white/95 py-6 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              {approvalCard.title}
            </p>
            <h3 className="mt-2 text-4xl font-bold text-slate-900">
              {values[approvalCard.key]}
            </h3>
          </div>
        </div>
      )}
    </div>
  );
}
