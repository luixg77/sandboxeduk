import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import LoginForm from '@/components/auth/LoginForm';
import FloatingCards from '@/components/branding/FloatingCards';
import { ROLE_ROUTES, UserRole } from '@/types/auth.types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Entrar — Kodar',
  description: 'Acesse a plataforma educacional inteligente Kodar. Aprendizagem personalizada focada em SAEB e ENEM.',
};

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const role = user.user_metadata?.role as UserRole | undefined;
    if (role && ROLE_ROUTES[role]) redirect(ROLE_ROUTES[role]);
  }

  return (
    <main className="flex min-h-screen">

      {/* ══════════════════════════════════════════════
          LEFT PANEL — Hero (desktop only)
      ══════════════════════════════════════════════ */}
      <div
        className="relative hidden lg:flex lg:w-[52%] flex-col overflow-hidden"
        style={{ background: 'linear-gradient(155deg, #0f3fc7 0%, #1a6ef5 50%, #2d8bfa 100%)' }}
      >

        {/* ── Background depth layers ── */}
        <div className="animate-glow absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%)' }} />
        <div className="animate-glow animation-delay-2000 absolute -bottom-32 -right-20 h-[400px] w-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(80,160,255,0.22) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[560px] w-[560px] rounded-full pointer-events-none opacity-15"
          style={{ background: 'radial-gradient(circle, #4a9eff 0%, transparent 65%)' }} />



        {/* ── Organic SVG blobs ── */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 900" fill="none" preserveAspectRatio="xMidYMid slice">
          <path d="M520 -60 C620 20,640 180,560 240 C480 300,380 220,400 120 C420 20,460 -100,520 -60Z" fill="rgba(255,255,255,0.05)" />
          <path d="M-60 380 C20 300,140 320,160 420 C180 520,80 580,-20 540 C-120 500,-140 460,-60 380Z" fill="rgba(255,255,255,0.04)" />
        </svg>

        {/* ── Dot-grid texture ── */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        {/* ══════════════════════════
            TOP HEADLINE
        ══════════════════════════ */}
        <div className="relative z-20 px-10 pt-10 pb-0 animate-slide-up">


          <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-white/50 mb-2">
            Plataforma educacional
          </p>
          <h1 className="text-[2.6rem] font-extrabold leading-[1.1] tracking-tight text-white">
            Bem-vindo à<br />
            plataforma{' '}
            <span
              className="relative inline-block"
              style={{
                background: 'linear-gradient(90deg, #bfdbfe, #ffffff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Kodar
              {/* underline accent */}
              <span
                className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #60a5fa, rgba(255,255,255,0.3))' }}
              />
            </span>
          </h1>
          <p className="mt-3 text-[14px] font-medium text-white/55 leading-relaxed max-w-[340px]">
            Aprendizagem inteligente e personalizada focada em{' '}
            <span className="text-white/80 font-semibold">SAEB</span> &amp;{' '}
            <span className="text-white/80 font-semibold">ENEM</span>
          </p>
        </div>

        {/* ══════════════════════════
            STAT CARDS — floating, 2×2
        ══════════════════════════ */}
        <FloatingCards />

        {/* ── Wavy stroke behind student ── */}
        <svg
          className="absolute bottom-[26%] left-0 w-full z-10 pointer-events-none"
          viewBox="0 0 700 100" fill="none" preserveAspectRatio="none"
        >
          <path d="M-30 65 C60 12,140 85,230 50 C320 15,390 80,480 44 C570 8,640 68,740 38"
            stroke="#C8933A" strokeWidth="36" strokeLinecap="round" opacity="0.72" />
          <path d="M-30 65 C60 12,140 85,230 50 C320 15,390 80,480 44 C570 8,640 68,740 38"
            stroke="#E8C47A" strokeWidth="10" strokeLinecap="round" opacity="0.30" />
        </svg>

        {/* ── Student image ── */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20 w-[86%] max-w-[470px]">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[65%] h-16 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(0,20,80,0.40) 0%, transparent 70%)' }} />
          <Image
            src="/student.png"
            alt="Estudante com globo terrestre"
            width={720} height={800}
            className="mask-fade-bottom w-full object-contain object-bottom relative z-10"
            priority
          />
        </div>

      </div>

      {/* ══════════════════════════════════════════════
          RIGHT PANEL — login form
      ══════════════════════════════════════════════ */}
      <div className="flex flex-1 flex-col bg-slate-50 login-bg-pattern">

        {/* ── Mobile hero (visible only < lg) ── */}
        <div className="lg:hidden mobile-hero-gradient px-6 py-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white">Kodar</span>

          </div>
          <p className="text-sm text-white/70">
            Aprendizagem inteligente focada em SAEB &amp; ENEM
          </p>
        </div>

        {/* ── Form container ── */}
        <div className="flex flex-1 items-center justify-center px-6 py-12 lg:px-16">
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
        </div>

      </div>

    </main>
  );
}
