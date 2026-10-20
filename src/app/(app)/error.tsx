"use client";

import { useEffect } from "react";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Terjadi kesalahan</h1>
      <p
        role="alert"
        className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-red-700"
      >
        Halaman ini gagal dimuat. Coba lagi, kalau masih gagal hubungi admin.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="inline-flex min-h-11 items-center justify-center rounded-lg border px-4 text-sm text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Coba lagi
      </button>
    </div>
  );
}
