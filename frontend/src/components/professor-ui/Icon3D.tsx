'use client';

import { ReactNode } from 'react';

type Icon3DColor = 'orange' | 'teal' | 'purple' | 'pink' | 'green' | 'blue' | 'amber' | 'red';
type Icon3DSize  = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const colorMap: Record<Icon3DColor, { grad: string; glow: string; border: string }> = {
  orange: { grad: 'from-orange-400 to-orange-600', glow: 'shadow-orange-200/70', border: 'border-orange-700/20' },
  teal:   { grad: 'from-teal-400   to-teal-600',   glow: 'shadow-teal-200/70',   border: 'border-teal-700/20' },
  purple: { grad: 'from-purple-400 to-purple-600', glow: 'shadow-purple-200/70', border: 'border-purple-700/20' },
  pink:   { grad: 'from-pink-400   to-pink-600',   glow: 'shadow-pink-200/70',   border: 'border-pink-700/20' },
  green:  { grad: 'from-green-400  to-green-600',  glow: 'shadow-green-200/70',  border: 'border-green-700/20' },
  blue:   { grad: 'from-blue-400   to-blue-600',   glow: 'shadow-blue-200/70',   border: 'border-blue-700/20' },
  amber:  { grad: 'from-amber-400  to-amber-600',  glow: 'shadow-amber-200/70',  border: 'border-amber-700/20' },
  red:    { grad: 'from-red-400    to-red-600',    glow: 'shadow-red-200/70',    border: 'border-red-700/20' },
};

const sizeMap: Record<Icon3DSize, { wrap: string; icon: string; radius: string }> = {
  xs: { wrap: 'w-8  h-8',  icon: 'w-4 h-4',   radius: 'rounded-[10px]' },
  sm: { wrap: 'w-10 h-10', icon: 'w-5 h-5',   radius: 'rounded-[12px]' },
  md: { wrap: 'w-14 h-14', icon: 'w-7 h-7',   radius: 'rounded-[16px]' },
  lg: { wrap: 'w-18 h-18', icon: 'w-9 h-9',   radius: 'rounded-[20px]' },
  xl: { wrap: 'w-24 h-24', icon: 'w-12 h-12', radius: 'rounded-[24px]' },
};

interface Icon3DProps {
  color?: Icon3DColor;
  size?:  Icon3DSize;
  children: ReactNode;
  className?: string;
  animate?: boolean;
}

export function Icon3D({ color = 'orange', size = 'md', children, className = '', animate = false }: Icon3DProps) {
  const c = colorMap[color];
  const s = sizeMap[size];

  return (
    <div
      className={`
        relative flex items-center justify-center shrink-0
        bg-gradient-to-br ${c.grad}
        ${s.wrap} ${s.radius}
        shadow-[0_6px_0_rgba(0,0,0,0.18),0_2px_12px_rgba(0,0,0,0.12)] ${c.glow}
        border border-white/25 ${c.border}
        ${animate ? 'animate-float' : ''}
        ${className}
      `}
    >
      {/* Top-left glass highlight */}
      <span className="pointer-events-none absolute top-1.5 left-2 w-5 h-2 rounded-full bg-white/30 blur-[3px]" />
      {/* Icon */}
      <span className={`relative z-10 text-white ${s.icon} flex items-center justify-center`}>
        {children}
      </span>
    </div>
  );
}

/* ── Preset SVG icons ── */
export const ProfIcons = {
  Book: () => (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  Game: () => (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.536.57a48.204 48.204 0 01-.3 4.163c-.022.252.17.472.423.49 1.657.114 3.336.171 5.03.171 1.694 0 3.373-.057 5.03-.17.252-.018.444-.239.423-.49a48.204 48.204 0 01-.3-4.164v0c-.019-.31.226-.57.536-.57.355 0 .676.186.959.401.29.221.634.349 1.003.349 1.036 0 1.875-1.007 1.875-2.25s-.84-2.25-1.875-2.25c-.369 0-.713.128-1.003.349-.283.215-.604.401-.959.401v0a.656.656 0 01-.658-.663 48.422 48.422 0 00.315-4.907c.018-.252-.17-.472-.423-.49-.408-.029-.817-.056-1.225-.083a.64.64 0 01-.657-.643v0z" />
    </svg>
  ),
  Video: () => (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
    </svg>
  ),
  Chart: () => (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  Star: () => (
    <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  Turma: () => (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  Trophy: () => (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.25 9.71 2 12 2c2.291 0 4.545.25 6.75.721v1.515M18.75 4.236c.982.143 1.954.317 2.916.52a6.003 6.003 0 01-5.395 5.492M18.75 4.236V4.5a6.75 6.75 0 01-2.48 5.228" />
    </svg>
  ),
  Clipboard: () => (
    <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
    </svg>
  ),
};
