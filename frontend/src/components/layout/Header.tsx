'use client';

import { usePathname, useRouter } from 'next/navigation';
import { AuthUser } from '@/types/auth.types';
import { signOut } from '@/services/auth.service';
import { useState } from 'react';

// Common header SVG Icons
const Icons = {
  Logout: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
  ),
  UserGeneric: () => (
    <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
    </svg>
  ),
};

interface HeaderProps {
  user: AuthUser | null;
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  // Compute page title dynamically based on local route structure
  const getPageTitle = () => {
    if (pathname.includes('/config/organizacao')) return 'Organização';
    if (pathname.includes('/config/clientes')) return 'Clientes';
    if (pathname.includes('/config/escolas')) return 'Escolas';
    if (pathname.includes('/config/projetos')) return 'Projetos';
    if (pathname.includes('/config/usuarios')) return 'Usuários';
    if (pathname.includes('/config')) return 'Configurações';
    return 'Dashboard';
  };
  const title = getPageTitle();

  async function handleSignOut() {
    try {
      setLoading(true);
      await signOut();
      router.push('/login');
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
      setLoading(false);
    }
  }

  // Format visual roles with nice colors mapped
  const roleDisplayNames = {
    admin: { label: 'Admin', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    gestor: { label: 'Gestor', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    coordenador: { label: 'Coordenador', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    professor: { label: 'Professor', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  };

  const userRole = user?.role || 'admin';
  const roleToken = roleDisplayNames[userRole];

  return (
    <header className="h-16 w-full flex items-center justify-between px-8 bg-white border-b border-slate-200">
      {/* ── Left Side: Page Context Context ── */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold text-slate-800">
          {title}
        </h1>
      </div>

      {/* ── Right Side: User Account & Actions ── */}
      <div className="flex items-center gap-6">
        
        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3 border-r border-slate-200 pr-6">
            
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-slate-800 leading-tight">
                {user.email.split('@')[0]} {/* Simple display logic fallback */}
              </span>
              <span className="text-xs text-slate-500 leading-tight block mt-[2px]">{user.email}</span>
            </div>

            {/* Avatar Placeholder */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 border border-slate-200 ring-2 ring-white">
              <Icons.UserGeneric />
            </div>

            {/* Role Badge */}
            <div className={`ml-1 flex items-center justify-center rounded-full px-2.5 py-0.5 border text-[10px] font-bold uppercase tracking-wider ${roleToken?.color}`}>
              {roleToken?.label}
            </div>

          </div>
        )}

        {/* Logout Action */}
        <button
          onClick={handleSignOut}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
          aria-label="Sair do sistema"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">
            <Icons.Logout />
          </span>
          {loading ? 'Saindo...' : 'Sair'}
        </button>
      </div>

    </header>
  );
}
