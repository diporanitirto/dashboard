'use client';

import { useState, useEffect } from 'react';

type LoadingProps = {
  text?: string;
};

export default function Loading({ text }: LoadingProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const intervals = [
      { time: 100, progress: 25 },
      { time: 150, progress: 50 },
      { time: 200, progress: 75 },
      { time: 150, progress: 90 },
      { time: 100, progress: 100 },
    ];

    let currentStep = 0;
    const runProgress = () => {
      if (currentStep < intervals.length) {
        const { time, progress: prog } = intervals[currentStep];
        setTimeout(() => {
          setProgress(prog);
          currentStep++;
          runProgress();
        }, time);
      }
    };

    runProgress();
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50">
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mb-2">
            Memuat Data
          </h2>
          <p className="text-slate-400 text-sm">
            Mohon tunggu sebentar...
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="relative">
          {/* Background track */}
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden shadow-inner">
            {/* Progress fill */}
            <div 
              className="h-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            </div>
          </div>

          {/* Percentage text */}
          <div className="mt-3 text-center">
            <span className="text-sm font-bold text-slate-300">
              {progress}%
            </span>
          </div>
        </div>

        {/* Loading messages based on progress */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500 font-medium">
            {text ? text : (
              <>
                {progress < 40 && "Memuat data..."}
                {progress >= 40 && progress < 80 && "Memproses..."}
                {progress >= 80 && "Hampir selesai..."}
              </>
            )}
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
