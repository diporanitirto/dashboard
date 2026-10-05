"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");
  const [scanned, setScanned] = useState(false);
  const stopRef = useRef(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d", { willReadFrequently: true });
        const tick = () => {
          if (video.readyState === video.HAVE_ENOUGH_DATA && canvas && ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(img.data, img.width, img.height);
            if (code && !stopRef.current) {
              const m = code.data.match(/\/verify\/([^/?#]+)/);
              if (m) {
                stopRef.current = true;
                setScanned(true);
                setError("");
                window.location.href = `/api/scan-handoff?id=${encodeURIComponent(m[1])}`;
                return;
              } else {
                setError("QR tidak berisi URL verifikasi izin.");
              }
            }
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        setError("Tidak bisa mengakses kamera. Izinkan akses kamera lalu muat ulang.");
      }
    }

    start();
    return () => {
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Scan QR Izin</h1>
      <Card>
        <CardHeader>
          <CardTitle>Arahkan kamera ke QR pada surat</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {scanned && !error && <p className="text-sm text-muted-foreground">Mengalihkan...</p>}
          <video ref={videoRef} className="w-full max-w-md rounded-lg border" playsInline muted />
          <canvas ref={canvasRef} className="hidden" />
        </CardContent>
      </Card>
    </div>
  );
}
