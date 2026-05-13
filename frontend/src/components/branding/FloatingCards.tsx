'use client';

const cards = [
  {
    delay: 0,
    duration: '5s',
    icon: (
      <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    iconBg: 'rgba(255,255,255,0.22)',
    value: '+12k',
    label: 'Alunos',
    side: 'left' as const,
  },
  {
    delay: 1.4,
    duration: '6.5s',
    icon: (
      <svg className="h-4 w-4 text-emerald-300" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    ),
    iconBg: 'rgba(52,211,153,0.22)',
    value: '98%',
    label: 'Aprovação',
    side: 'left' as const,
  },
  {
    delay: 0.7,
    duration: '7s',
    icon: (
      <svg className="h-4 w-4 text-amber-300" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    iconBg: 'rgba(251,191,36,0.22)',
    value: '4.9 ★',
    label: 'Avaliação',
    side: 'right' as const,
  },
  {
    delay: 2.1,
    duration: '5.5s',
    icon: (
      <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
      </svg>
    ),
    iconBg: 'rgba(255,255,255,0.22)',
    value: '+350',
    label: 'Escolas',
    side: 'right' as const,
  },
];

const leftCards  = cards.filter((c) => c.side === 'left');
const rightCards = cards.filter((c) => c.side === 'right');

function Card({ card }: { card: (typeof cards)[number] }) {
  return (
    <div
      style={{
        animation: `floatCard ${card.duration} ease-in-out infinite`,
        animationDelay: `${card.delay}s`,
      }}
    >
      <div
        className="flex items-center gap-2.5 rounded-2xl border border-white/15 px-4 py-3 shadow-2xl transition-transform duration-300 hover:scale-105"
        style={{
          background: 'rgba(255,255,255,0.13)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: card.iconBg }}
        >
          {card.icon}
        </div>
        <div>
          <p className="text-[13px] font-bold text-white leading-none">{card.value}</p>
          <p className="mt-1 text-[11px] text-white/55 leading-none">{card.label}</p>
        </div>
      </div>
    </div>
  );
}

export default function FloatingCards() {
  return (
    <>
      {/* Keyframe injected via style tag — works in any client component */}
      <style>{`
        @keyframes floatCard {
          0%,100% { transform: translateY(0px);   }
          50%      { transform: translateY(-10px); }
        }
      `}</style>

      {/* Left column */}
      <div className="absolute left-7 z-30 flex flex-col gap-3" style={{ top: '30%' }}>
        {leftCards.map((c) => <Card key={c.label} card={c} />)}
      </div>

      {/* Right column */}
      <div className="absolute right-7 z-30 flex flex-col gap-3" style={{ top: '30%' }}>
        {rightCards.map((c) => <Card key={c.label} card={c} />)}
      </div>
    </>
  );
}
