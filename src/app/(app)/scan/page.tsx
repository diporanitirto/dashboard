"use client";

import { useState } from "react";
import QrScanner from "@/components/qr-scanner";
import { notify } from "@/components/notifier";

export default function ScanPage() {
  const [done, setDone] = useState(false);

  const handle = (text: string) => {
    const m = text.match(/\/verify\/([^/?#]+)/);
    if (m) {
      setDone(true);
      window.location.href = `/api/scan-handoff?id=${encodeURIComponent(m[1])}`;
      return true;
    }
    notify("QR tidak berisi URL verifikasi izin.");
    return false;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Scan QR Izin</h1>
      <p className="text-sm text-muted-foreground">Arahkan kamera ke QR pada surat.</p>
      {done ? <p className="text-sm">Mengalihkan...</p> : <div className="max-w-md"><QrScanner onDetected={handle} /></div>}
    </div>
  );
}
