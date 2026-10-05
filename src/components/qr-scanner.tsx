"use client";

import { useEffect, useRef } from "react";
import jsQR from "jsqr";
import { notify } from "@/components/notifier";

export default function QrScanner({ onDetected }: { onDetected?: (text: string) => boolean | void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stopped = useRef(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    stopped.current = false;

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
          if (stopped.current) return;
          if (video.readyState === video.HAVE_ENOUGH_DATA && canvas && ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(img.data, img.width, img.height);
            if (code) {
              const handled = onDetected?.(code.data);
              if (handled !== false) {
                stopped.current = true;
                return;
              }
            }
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        notify("Tidak bisa mengakses kamera. Izinkan akses kamera lalu coba lagi.");
      }
    }

    start();
    return () => {
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <video ref={videoRef} className="w-full rounded-lg border bg-black" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />
    </>
  );
}
