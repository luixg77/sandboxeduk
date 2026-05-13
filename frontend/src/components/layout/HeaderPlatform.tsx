'use client';

import { useRouter } from 'next/navigation';
import { AuthUser } from '@/types/auth.types';
import { signOut } from '@/services/auth.service';
import { useState, useRef, useEffect } from 'react';

const Icons = {
  Menu: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
  ),
  Profile: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  ChevronDown: ({ open }: { open: boolean }) => (
    <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  ),
};

/* Logo/avatar do cliente (tenant) */
function SchoolBrand({ name, logoUrl }: { name?: string; logoUrl?: string }) {
  const initials = (name ?? 'ES')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');

  return (
    <div className="flex items-center gap-3 shrink-0">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={name ?? 'Logo'}
          className="h-9 w-auto max-w-[120px] object-contain shrink-0"
        />
      ) : (
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-sm shrink-0">
          <span className="text-white text-xs font-extrabold tracking-wide">{initials}</span>
        </div>
      )}
      {name && (
        <span className="text-[14px] font-bold text-slate-800 leading-tight max-w-[220px] truncate hidden sm:block">
          {name}
        </span>
      )}
    </div>
  );
}

/* Avatar com iniciais */
function Avatar({ name, role }: { name: string; role: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');

  const ROLE_COLORS: Record<string, string> = {
    professor:   'from-orange-400 to-orange-600',
    gestor:      'from-blue-400   to-blue-600',
    coordenador: 'from-teal-400   to-teal-600',
    admin:       'from-purple-400 to-purple-600',
  };

  const gradient = ROLE_COLORS[role] ?? 'from-slate-400 to-slate-600';

  return (
    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-sm`}>
      <span className="text-white text-xs font-extrabold tracking-wide">{initials || '?'}</span>
    </div>
  );
}

interface HeaderPlatformProps {
  user:          AuthUser | null;
  onMenuToggle?: () => void;
}

export default function HeaderPlatform({ user, onMenuToggle }: HeaderPlatformProps) {
  const router   = useRouter();
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);
  const dropRef  = useRef<HTMLDivElement>(null);

  const rawName    = user?.email?.split('@')[0] ?? 'Usuário';
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const roleRaw    = user?.role ?? 'gestor';
  const roleLabel  = roleRaw.charAt(0).toUpperCase() + roleRaw.slice(1);

  /* fecha dropdown ao clicar fora */
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  async function handleSignOut() {
    try {
      setLoading(true);
      setOpen(false);
      await signOut();
      router.push('/login');
    } catch {
      setLoading(false);
    }
  }

  return (
    <header className="h-[5.5rem] w-full flex items-center justify-between px-10 bg-white border-b border-slate-100 z-40 shrink-0">

      {/* ── Hambúrguer mobile ── */}
      {onMenuToggle && (
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors shrink-0"
          aria-label="Abrir menu"
        >
          <Icons.Menu />
        </button>
      )}

      {/* ── Left: Logo do cliente (sem nome) ── */}
      <div className="flex items-center shrink-0">
        {user?.tenantLogoUrl ? (
          <img
            src={user.tenantLogoUrl}
            alt={user.tenantName ?? 'Logo'}
            className="h-9 w-auto max-w-[120px] object-contain"
          />
        ) : (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-sm shrink-0">
            <span className="text-white text-xs font-extrabold tracking-wide">
              {(user?.tenantName ?? 'ES').split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')}
            </span>
          </div>
        )}
      </div>

      {/* ── Right: Profile dropdown ── */}
      <div className="relative" ref={dropRef}>
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-3 rounded-2xl px-3 py-2 hover:bg-slate-50 transition-colors"
        >
          <Avatar name={displayName} role={roleRaw} />

          <div className="hidden sm:flex flex-col items-start leading-none">
            <span className="text-[13px] font-bold text-slate-800">{displayName}</span>
            <span className="text-[11px] font-semibold text-orange-500 mt-0.5">{roleLabel}</span>
          </div>

          <Icons.ChevronDown open={open} />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-[calc(100%+8px)] w-48 bg-white rounded-2xl border border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden z-50">
            <button
              onClick={() => { setOpen(false); router.push('/professor/perfil'); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span className="text-slate-400"><Icons.Profile /></span>
              Meu Perfil
            </button>
            <div className="h-px bg-slate-100" />
            <button
              onClick={handleSignOut}
              disabled={loading}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              <span className="text-red-400"><Icons.Logout /></span>
              {loading ? 'Saindo…' : 'Sair'}
            </button>
          </div>
        )}
      </div>

    </header>
  );
}
