"use client";

import { useState } from "react";
import { ScanQrCode, X } from "lucide-react";
import QrScanner from "@/components/qr-scanner";
import { notify } from "@/components/notifier";

export default function MobileNav() {
  const [scanOpen, setScanOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setScanOpen(true)}
        aria-label="Scan QR"
        className="fixed bottom-1 left-1/2 z-40 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:hidden"
      >
        <ScanQrCode className="h-6 w-6" />
      </button>

      {scanOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/90 p-4 md:hidden">
          <div className="flex items-center justify-between text-white">
            <p className="font-semibold">Scan QR Izin</p>
            <button onClick={() => setScanOpen(false)} aria-label="Tutup">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="mt-4 flex-1 flex items-center">
            <QrScanner
              onDetected={(text) => {
                const m = text.match(/\/verify\/([^/?#]+)/);
                if (m) {
                  setScanOpen(false);
                  window.location.href = `/api/scan-handoff?id=${encodeURIComponent(m[1])}`;
                  return true;
                }
                notify("QR tidak berisi URL verifikasi izin.");
                return false;
              }}
            />
          </div>
          <p className="pb-4 text-center text-sm text-white/70">Arahkan kamera ke QR pada surat</p>
        </div>
      )}
    </>
  );
}
