type StatusBadgeProps = {
  label: 'pending' | 'approved' | 'rejected';
};

const styles: Record<StatusBadgeProps['label'], string> = {
  pending: 'bg-yellow-900/50 text-yellow-300 border-yellow-700/50',
  approved: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50',
  rejected: 'bg-red-900/50 text-red-300 border-red-700/50',
};

const text: Record<StatusBadgeProps['label'], string> = {
  pending: 'Pending',
  approved: 'Diizinkan',
  rejected: 'Ditolak',
};

export function StatusBadge({ label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide flex-shrink-0 sm:px-3 sm:py-1 sm:text-xs ${styles[label]}`}
    >
      {text[label]}
    </span>
  );
}
