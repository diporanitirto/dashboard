type StatusBadgeProps = {
  label: 'pending' | 'approved' | 'rejected';
};

const styles: Record<StatusBadgeProps['label'], string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

const text: Record<StatusBadgeProps['label'], string> = {
  pending: 'Pending',
  approved: 'Diizinkan',
  rejected: 'Ditolak',
};

export function StatusBadge({ label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${styles[label]}`}
    >
      {text[label]}
    </span>
  );
}
