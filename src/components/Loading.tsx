'use client';

import Image from 'next/image';

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Logo with scale and rotate animation */}
        <div className="mb-6">
          <Image
            src="/logo-diporani.png"
            alt="DIPORANI"
            width={100}
            height={100}
            className="mx-auto animate-scale-rotate"
            priority
          />
        </div>

        {/* Loading Text */}
        <p className="text-slate-400 text-sm">
          Memuat data<span className="animate-dots"></span>
        </p>

        {/* Loading dots */}
        <div className="flex justify-center gap-2 mt-4">
          <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-rotate {
          0%, 100% {
            transform: scale(1) rotate(0deg);
          }
          25% {
            transform: scale(1.1) rotate(-5deg);
          }
          50% {
            transform: scale(1.2) rotate(0deg);
          }
          75% {
            transform: scale(1.1) rotate(5deg);
          }
        }
        
        @keyframes dots {
          0% {
            content: '.';
          }
          33% {
            content: '..';
          }
          66% {
            content: '...';
          }
          100% {
            content: '.';
          }
        }
        
        .animate-scale-rotate {
          animation: scale-rotate 1.5s ease-in-out infinite;
          will-change: transform;
        }
        
        .animate-dots::after {
          content: '.';
          animation: dots 1.5s steps(3, end) infinite;
        }
      `}</style>
    </div>
  );
}
