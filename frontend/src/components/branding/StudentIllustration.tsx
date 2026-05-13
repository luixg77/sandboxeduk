export default function StudentIllustration() {
  return (
    <svg
      viewBox="0 0 420 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-sm"
      aria-label="Estudante aprendendo"
    >
      {/* Desk */}
      <rect x="60" y="270" width="300" height="18" rx="9" fill="rgba(255,255,255,0.25)" />
      <rect x="90" y="288" width="20" height="60" rx="6" fill="rgba(255,255,255,0.2)" />
      <rect x="310" y="288" width="20" height="60" rx="6" fill="rgba(255,255,255,0.2)" />

      {/* Laptop base */}
      <rect x="130" y="228" width="160" height="42" rx="6" fill="rgba(255,255,255,0.3)" />
      {/* Laptop screen */}
      <rect x="140" y="160" width="140" height="90" rx="8" fill="rgba(255,255,255,0.15)" />
      <rect x="148" y="168" width="124" height="74" rx="5" fill="rgba(255,255,255,0.2)" />
      {/* Screen content lines */}
      <rect x="158" y="178" width="70" height="6" rx="3" fill="rgba(255,255,255,0.5)" />
      <rect x="158" y="191" width="100" height="4" rx="2" fill="rgba(255,255,255,0.3)" />
      <rect x="158" y="200" width="85" height="4" rx="2" fill="rgba(255,255,255,0.3)" />
      <rect x="158" y="209" width="60" height="4" rx="2" fill="rgba(255,255,255,0.3)" />
      <rect x="158" y="222" width="40" height="10" rx="5" fill="rgba(255,255,255,0.5)" />

      {/* Book on desk */}
      <rect x="290" y="248" width="50" height="22" rx="3" fill="rgba(255,255,255,0.35)" />
      <rect x="293" y="252" width="44" height="14" rx="2" fill="rgba(255,255,255,0.2)" />

      {/* Coffee cup */}
      <rect x="82" y="252" width="28" height="22" rx="6" fill="rgba(255,255,255,0.3)" />
      <path d="M110 260 Q122 260 122 268 Q122 275 110 275" stroke="rgba(255,255,255,0.4)" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Steam */}
      <path d="M90 248 Q93 240 90 232" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M100 246 Q103 238 100 230" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Student body */}
      {/* Torso */}
      <path
        d="M175 160 Q178 220 182 228 H238 Q242 220 245 160"
        fill="rgba(255,255,255,0.35)"
      />
      {/* Collar detail */}
      <path d="M196 162 L210 178 L224 162" stroke="rgba(255,255,255,0.5)" strokeWidth="2" fill="none" />

      {/* Neck */}
      <rect x="204" y="126" width="12" height="22" rx="6" fill="rgba(255,255,255,0.45)" />

      {/* Head */}
      <ellipse cx="210" cy="110" rx="28" ry="30" fill="rgba(255,255,255,0.45)" />

      {/* Hair */}
      <path
        d="M182 100 Q185 72 210 70 Q235 72 238 100 Q230 84 210 84 Q190 84 182 100Z"
        fill="rgba(255,255,255,0.6)"
      />

      {/* Eyes */}
      <ellipse cx="200" cy="108" rx="4" ry="4.5" fill="rgba(29,78,216,0.7)" />
      <ellipse cx="220" cy="108" rx="4" ry="4.5" fill="rgba(29,78,216,0.7)" />
      <circle cx="201" cy="107" r="1.5" fill="white" />
      <circle cx="221" cy="107" r="1.5" fill="white" />

      {/* Smile */}
      <path d="M202 118 Q210 125 218 118" stroke="rgba(29,78,216,0.5)" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Left arm (pointing at screen) */}
      <path
        d="M178 170 Q162 185 158 195 Q155 200 162 202 Q168 204 172 196 Q178 186 190 178"
        fill="rgba(255,255,255,0.35)"
      />
      {/* Right arm (on desk) */}
      <path
        d="M242 170 Q256 185 258 210 Q258 220 250 220 Q242 220 240 210 Q238 192 228 178"
        fill="rgba(255,255,255,0.35)"
      />

      {/* Floating stars / sparkles */}
      <g opacity="0.8">
        <path d="M60 80 L63 72 L66 80 L74 83 L66 86 L63 94 L60 86 L52 83 Z" fill="white" />
        <path d="M340 100 L342 94 L344 100 L350 102 L344 104 L342 110 L340 104 L334 102 Z" fill="white" opacity="0.7" />
        <path d="M310 50 L312 45 L314 50 L319 52 L314 54 L312 59 L310 54 L305 52 Z" fill="white" opacity="0.6" />
        <path d="M80 150 L81.5 146 L83 150 L87 151.5 L83 153 L81.5 157 L80 153 L76 151.5 Z" fill="white" opacity="0.5" />
      </g>

      {/* Floating dots decoration */}
      <circle cx="350" cy="160" r="5" fill="rgba(255,255,255,0.3)" />
      <circle cx="360" cy="175" r="3" fill="rgba(255,255,255,0.25)" />
      <circle cx="345" cy="185" r="4" fill="rgba(255,255,255,0.2)" />
      <circle cx="70" cy="200" r="4" fill="rgba(255,255,255,0.25)" />
      <circle cx="58" cy="215" r="3" fill="rgba(255,255,255,0.2)" />

      {/* Floating formula/math symbols */}
      <text x="340" y="72" fill="rgba(255,255,255,0.4)" fontSize="18" fontFamily="serif">∑</text>
      <text x="55" y="120" fill="rgba(255,255,255,0.35)" fontSize="16" fontFamily="serif">π</text>
      <text x="355" y="230" fill="rgba(255,255,255,0.35)" fontSize="14" fontFamily="serif">∞</text>
    </svg>
  );
}
