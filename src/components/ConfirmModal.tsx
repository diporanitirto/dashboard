import { useState } from 'react';

type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
};

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Batal',
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      setSuccess(true);
      // Auto close after showing success
      setTimeout(() => {
        setSuccess(false);
        setLoading(false);
        onClose();
      }, 1500);
    } catch (error) {
      setLoading(false);
      console.error('Error:', error);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSuccess(false);
      setLoading(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
        {success ? (
          <div className="space-y-4 text-center py-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-emerald-900/50 p-3">
                <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-50">Berhasil!</h2>
              <p className="mt-2 text-sm text-slate-400">Perubahan telah disimpan</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-50">{title}</h2>
              <p className="mt-2 text-sm text-slate-400">{message}</p>
            </div>
            {loading && (
              <div className="flex items-center justify-center gap-2 py-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-500 border-t-transparent"></div>
                <span className="text-sm text-slate-400">Memproses...</span>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-sky-950 shadow transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Memproses...' : confirmLabel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
