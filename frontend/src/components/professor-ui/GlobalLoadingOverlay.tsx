'use client';

import { useEffect, useState } from 'react';

/* ── Fetch interceptor (module-level, runs once on client) ── */
let pendingCount = 0;
const subscribers = new Set<(n: number) => void>();

function notify() {
  subscribers.forEach(fn => fn(pendingCount));
}

if (typeof window !== 'undefined' && !(window as any).__fetchPatched) {
  (window as any).__fetchPatched = true;
  const native = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    pendingCount++;
    notify();
    try {
      return await native(input, init);
    } finally {
      pendingCount--;
      notify();
    }
  };
}

function usePendingRequests() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(pendingCount);
    subscribers.add(setCount);
    return () => { subscribers.delete(setCount); };
  }, []);
  return count;
}

/* ── Overlay ── */
export function GlobalLoadingOverlay() {
  const pending = usePendingRequests();
  if (pending === 0) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 backdrop-blur-sm pointer-events-none">
      <svg width="200" height="200" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <style>{`
          .sq {
            fill: #635BFF;
            animation: slideInSquare 1.5s infinite ease-in-out;
          }
          .kk {
            fill: #635BFF;
            animation: slideInK 1.5s infinite ease-in-out;
          }
          @keyframes slideInSquare {
            0%   { transform: translateX(-50px); opacity: 0; }
            40%  { transform: translateX(0);     opacity: 1; }
            80%  { transform: translateX(0);     opacity: 1; filter: url(#glow); }
            100% { transform: translateX(0);     opacity: 0; }
          }
          @keyframes slideInK {
            0%   { transform: translateX(50px); opacity: 0; }
            40%  { transform: translateX(0);    opacity: 1; }
            80%  { transform: translateX(0);    opacity: 1; filter: url(#glow); }
            100% { transform: translateX(0);    opacity: 0; }
          }
        `}</style>

        <g transform="translate(100, 150)">
          <rect className="sq" x="0" y="55" width="115" height="115" rx="15" />
          <path className="kk" d="M150 110 L280 0 L380 0 L220 140 L380 280 L280 280 L150 170 Z" />
        </g>
      </svg>
    </div>
  );
}
