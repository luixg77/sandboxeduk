'use client';

type ProgressColor = 'orange' | 'teal' | 'green' | 'purple' | 'blue' | 'pink' | 'amber';
type ProgressSize  = 'xs' | 'sm' | 'md' | 'lg';

const barColors: Record<ProgressColor, string> = {
  orange: 'from-orange-400 to-orange-600',
  teal:   'from-teal-400   to-teal-600',
  green:  'from-green-400  to-green-600',
  purple: 'from-purple-400 to-purple-600',
  blue:   'from-blue-400   to-blue-600',
  pink:   'from-pink-400   to-pink-600',
  amber:  'from-amber-400  to-amber-600',
};

const barSizes: Record<ProgressSize, string> = {
  xs: 'h-1',
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

interface ProgressBarProps {
  value:       number;
  max?:        number;
  color?:      ProgressColor;
  size?:       ProgressSize;
  label?:      string;
  showValue?:  boolean;
  animate?:    boolean;
  className?:  string;
}

export function ProgressBar({
  value,
  max       = 100,
  color     = 'green',
  size      = 'sm',
  label,
  showValue = false,
  animate   = true,
  className = '',
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label   && <span className="text-xs font-semibold text-slate-600">{label}</span>}
          {showValue && <span className="text-xs font-bold text-slate-700">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${barSizes[size]}`}>
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barColors[color]} ${animate ? 'transition-all duration-700 ease-out' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ── Circular progress indicator ── */
interface CircularProgressProps {
  value:       number;
  max?:        number;
  size?:       number;
  strokeWidth?: number;
  color?:      ProgressColor;
  children?:   React.ReactNode;
  className?:  string;
}

const circleStroke: Record<ProgressColor, string> = {
  orange: '#F97316',
  teal:   '#0D9488',
  green:  '#22C55E',
  purple: '#8B5CF6',
  blue:   '#3B82F6',
  pink:   '#EC4899',
  amber:  '#F59E0B',
};

export function CircularProgress({
  value,
  max         = 100,
  size        = 72,
  strokeWidth = 7,
  color       = 'orange',
  children,
  className   = '',
}: CircularProgressProps) {
  const pct    = Math.min(100, Math.max(0, (value / max) * 100));
  const r      = (size - strokeWidth) / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={circleStroke[color]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.7s ease-out' }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
