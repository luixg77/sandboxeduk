'use client';

import { ReactNode } from 'react';

/* ── SVG Illustration Variants ── */

function IllustrationBooks() {
  return (
    <>
      {/* Isometric book stack — right side */}
      {/* Book 1 (bottom, large, magenta) */}
      <polygon points="1040,155 1185,75 1400,100 1255,180" fill="#F472B6" opacity="0.95" />
      <polygon points="1255,180 1400,100 1400,155 1255,235" fill="#BE185D" opacity="0.95" />
      <polygon points="1040,155 1040,210 1255,235 1255,180" fill="#EC4899" opacity="0.95" />
      {/* Spine highlight */}
      <line x1="1040" y1="155" x2="1185" y2="75" stroke="white" strokeWidth="1.5" opacity="0.3" />
      {/* Book 2 (middle, smaller, purple) */}
      <polygon points="1075,100 1195,35 1360,58 1240,123" fill="#A78BFA" opacity="0.95" />
      <polygon points="1240,123 1360,58 1360,105 1240,170" fill="#6D28D9" opacity="0.95" />
      <polygon points="1075,100 1075,147 1240,170 1240,123" fill="#8B5CF6" opacity="0.95" />
      {/* Book 3 (top, smallest, amber) */}
      <polygon points="1105,55 1210,5  1340,25 1235,75" fill="#FCD34D" opacity="0.95" />
      <polygon points="1235,75 1340,25 1340,63 1235,113" fill="#D97706" opacity="0.95" />
      <polygon points="1105,55 1105,93 1235,113 1235,75" fill="#F59E0B" opacity="0.95" />
      {/* Purple concentric rings */}
      <circle cx="1080" cy="195" r="74" fill="none" stroke="#7C3AED" strokeWidth="13" opacity="0.9" />
      <circle cx="1060" cy="170" r="50" fill="none" stroke="#A78BFA" strokeWidth="9" opacity="0.7" />
    </>
  );
}

function IllustrationGames() {
  return (
    <>
      {/* 3D Game Controller */}
      {/* Body top face */}
      <ellipse cx="1240" cy="95" rx="140" ry="60" fill="#6D28D9" opacity="0.9" transform="rotate(-10,1240,95)" />
      {/* Body front face */}
      <path d="M1100,115 Q1100,185 1240,195 Q1380,185 1380,115 L1380,95 Q1380,155 1240,165 Q1100,155 1100,95 Z" fill="#5B21B6" opacity="0.9" />
      {/* D-pad */}
      <rect x="1140" y="120" width="12" height="35" rx="3" fill="#A78BFA" />
      <rect x="1128" y="132" width="35" height="12" rx="3" fill="#A78BFA" />
      {/* Buttons */}
      <circle cx="1330" cy="125" r="8"  fill="#F472B6" />
      <circle cx="1315" cy="140" r="8"  fill="#FCD34D" />
      <circle cx="1345" cy="140" r="8"  fill="#34D399" />
      <circle cx="1330" cy="155" r="8"  fill="#60A5FA" />
      {/* Joystick bumps */}
      <ellipse cx="1175" cy="165" rx="22" ry="16" fill="#7C3AED" />
      <ellipse cx="1285" cy="165" rx="22" ry="16" fill="#7C3AED" />
      {/* Rings */}
      <circle cx="1070" cy="195" r="68" fill="none" stroke="#EC4899" strokeWidth="12" opacity="0.85" />
      <circle cx="1050" cy="168" r="45" fill="none" stroke="#F9A8D4" strokeWidth="8" opacity="0.6" />
    </>
  );
}

function IllustrationCharts() {
  return (
    <>
      {/* Isometric bar chart */}
      {/* Bar 1 — tall, orange */}
      <polygon points="1150,180 1200,150 1200,30 1150,60" fill="#FB923C" opacity="0.95" />
      <polygon points="1150,60 1200,30 1250,60 1200,90" fill="#FED7AA" opacity="0.95" />
      <polygon points="1200,90 1250,60 1250,180 1200,210" fill="#EA580C" opacity="0.95" />
      {/* Bar 2 — medium, teal */}
      <polygon points="1250,180 1300,150 1300,70 1250,100" fill="#2DD4BF" opacity="0.95" />
      <polygon points="1250,100 1300,70 1350,100 1300,130" fill="#99F6E4" opacity="0.95" />
      <polygon points="1300,130 1350,100 1350,180 1300,210" fill="#0D9488" opacity="0.95" />
      {/* Bar 3 — short, purple */}
      <polygon points="1350,180 1400,150 1400,105 1350,135" fill="#C084FC" opacity="0.95" />
      <polygon points="1350,135 1400,105 1400,105 1350,135" fill="#E9D5FF" opacity="0.95" />
      {/* Base platform */}
      <polygon points="1110,195 1200,160 1400,195 1310,230" fill="#0A6470" opacity="0.55" />
      {/* Rings */}
      <circle cx="1075" cy="190" r="72" fill="none" stroke="#8B5CF6" strokeWidth="12" opacity="0.85" />
      <circle cx="1052" cy="162" r="48" fill="none" stroke="#C084FC" strokeWidth="8" opacity="0.65" />
    </>
  );
}

function IllustrationDefault() {
  return (
    <>
      {/* Large isometric 3D slab */}
      <polygon points="1030,145 1175,65 1400,92 1258,172" fill="#F472B6" opacity="0.95" />
      <polygon points="1258,172 1400,92 1400,220 1258,220" fill="#BE185D" opacity="0.95" />
      <polygon points="1030,145 1030,220 1258,220 1258,172" fill="#EC4899" opacity="0.95" />
      <line x1="1030" y1="145" x2="1175" y2="65" stroke="white" strokeWidth="1.5" opacity="0.25" />
      {/* Decorative rings */}
      <circle cx="1078" cy="198" r="76" fill="none" stroke="#7C3AED" strokeWidth="14" opacity="0.9" />
      <circle cx="1055" cy="168" r="51" fill="none" stroke="#A78BFA" strokeWidth="10" opacity="0.7" />
      {/* Small accent dots */}
      <circle cx="970"  cy="80"  r="14" fill="#FCD34D" opacity="0.8" />
      <circle cx="995"  cy="110" r="9"  fill="#FDE68A" opacity="0.6" />
    </>
  );
}

export type HeroIllustration = 'default' | 'books' | 'games' | 'charts';

interface HeroBannerProps {
  title:         string;
  subtitle?:     string;
  label?:        string;
  actions?:      ReactNode;
  illustration?: HeroIllustration;
  className?:    string;
}

export function HeroBanner({
  title,
  subtitle,
  label,
  actions,
  illustration = 'default',
  className    = '',
}: HeroBannerProps) {
  return (
    <div className={`relative w-full h-[150px] md:h-[220px] overflow-hidden ${className}`}>

      {/* ── SVG Background ── */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1400 220"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Base orange fill */}
        <rect width="1400" height="220" fill="#E8760A" />

        {/* Teal blob — bottom-left corner */}
        <circle cx="110" cy="310" r="240" fill="#0A6470" opacity="0.88" />
        {/* Teal blob — upper center area */}
        <circle cx="420" cy="-65" r="195" fill="#0A6470" opacity="0.65" />
        {/* Small teal overlap */}
        <circle cx="565" cy="45"  r="98"  fill="#085560" opacity="0.38" />

        {/* Right-side illustration */}
        {illustration === 'books'   && <IllustrationBooks />}
        {illustration === 'games'   && <IllustrationGames />}
        {illustration === 'charts'  && <IllustrationCharts />}
        {illustration === 'default' && <IllustrationDefault />}

        {/* Subtle vignette — left edge fade */}
        <defs>
          <linearGradient id="heroLeftFade" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%"   stopColor="#E8760A" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#E8760A" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="200" height="220" fill="url(#heroLeftFade)" />
      </svg>

      {/* ── Text Content ── */}
      <div className="relative z-10 h-full flex flex-col justify-center px-5 md:px-14 max-w-full md:max-w-[60%]">
        {label && (
          <span className="text-[11px] font-extrabold text-white/80 uppercase tracking-widest mb-2 drop-shadow">
            {label}
          </span>
        )}
        <h1 className="text-[22px] md:text-[26px] font-extrabold text-white leading-snug drop-shadow-sm">
          {title}
        </h1>
        {subtitle && (
          <p className="text-white/90 text-[14px] md:text-[17px] font-semibold mt-2 leading-snug drop-shadow-sm">
            {subtitle}
          </p>
        )}
        {actions && <div className="mt-4 flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}
