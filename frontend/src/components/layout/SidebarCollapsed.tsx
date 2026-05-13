'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const Icons = {
  ProjectLogoFull: () => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/kodar-horizontal.png" alt="Kodar" className="h-8 w-auto object-contain" />
  ),
  KodarAppLogoCompact: () => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/kodar-symbol.png" alt="Kodar" className="h-9 w-9 object-contain" />
  ),
  Home: () => (
    <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10" />
    </svg>
  ),
  Grid: () => (
    <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
  Books: () => (
    <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  Games: () => (
    <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.536.57a48.204 48.204 0 01-.3 4.163c-.022.252.17.472.423.49 1.657.114 3.336.171 5.03.171 1.694 0 3.373-.057 5.03-.17.252-.018.444-.239.423-.49a48.204 48.204 0 01-.3-4.164v0c-.019-.31.226-.57.536-.57.355 0 .676.186.959.401.29.221.634.349 1.003.349 1.036 0 1.875-1.007 1.875-2.25s-.84-2.25-1.875-2.25c-.369 0-.713.128-1.003.349-.283.215-.604.401-.959.401v0a.656.656 0 01-.658-.663 48.422 48.422 0 00.315-4.907c.018-.252-.17-.472-.423-.49-.408-.029-.817-.056-1.225-.083a.64.64 0 01-.657-.643v0z" />
    </svg>
  ),
  Play: () => (
    <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
    </svg>
  ),
  Headphones: () => (
    <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M14.463 8.287a5.25 5.25 0 010 7.426M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
  ),
  Clipboard: () => (
    <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  ),
  Trilhas: () => (
    <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
    </svg>
  ),
  Briefcase: () => (
    <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 14.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
    </svg>
  ),
  Chart: () => (
    <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  Trending: () => (
    <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  ),
  Building: () => (
    <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-2.25A2.25 2.25 0 0111.25 16.5h1.5a2.25 2.25 0 012.25 2.25V21" />
    </svg>
  ),
  Team: () => (
    <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  Profile: () => (
    <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Avaliacoes: () => (
    <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
    </svg>
  ),
  ProducaoTextual: () => (
    <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  ),
  MinhasTurmas: () => (
    <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  ),
};

/* ── Menu por role ── */
function buildMenuGroups(rolePrefix: string, role: string) {
  if (role === 'professor') {
    return [
      {
        groupLabel: '',
        items: [
          { title: 'Início',       icon: Icons.Home,       href: rolePrefix },
        ],
      },
      {
        groupLabel: 'CONTEÚDOS',
        items: [
          { title: 'Acervo Digital', icon: Icons.Grid,    href: `${rolePrefix}/acervo` },
          { title: 'Trilhas',        icon: Icons.Trilhas, href: `${rolePrefix}/trilhas` },
          { title: 'Livros',         icon: Icons.Books,  href: `${rolePrefix}/livros` },
        ],
      },
      {
        groupLabel: 'MEU ESPAÇO',
        items: [
          { title: 'Meu Estojo',       icon: Icons.Briefcase,      href: `${rolePrefix}/estojo` },
          { title: 'Avaliações',       icon: Icons.Avaliacoes,     href: `${rolePrefix}/avaliacoes` },
          { title: 'Produção Textual', icon: Icons.ProducaoTextual, href: `${rolePrefix}/producao-textual` },
          { title: 'Minhas Turmas',    icon: Icons.MinhasTurmas,   href: `${rolePrefix}/turmas` },
        ],
      },
      {
        groupLabel: 'ACOMPANHAMENTO',
        items: [
          { title: 'Painéis Visuais',     icon: Icons.Chart,    href: `${rolePrefix}/paineis` },
          { title: 'Gestão Educacional',  icon: Icons.Trending, href: `${rolePrefix}/gestao` },
        ],
      },
    ];
  }

  // Default: gestor / coordenador
  return [
    {
      groupLabel: '',
      items: [
        { title: 'Início', icon: Icons.Home, href: rolePrefix },
      ],
    },
    {
      groupLabel: 'BIBLIOTECA',
      items: [
        { title: 'Livros',  icon: Icons.Books, href: `${rolePrefix}/livros` },
        { title: 'Jogos',   icon: Icons.Games, href: `${rolePrefix}/jogos` },
        { title: 'Vídeos',  icon: Icons.Play,  href: `${rolePrefix}/aulas` },
      ],
    },
    {
      groupLabel: 'CONTEÚDOS',
      items: [
        { title: 'Tabela de Fluência', icon: Icons.Clipboard, href: `${rolePrefix}/fluencia` },
      ],
    },
    {
      groupLabel: 'MAPAS DE ACOMPANHAMENTO',
      items: [
        { title: 'Painéis Visuais',    icon: Icons.Chart,    href: `${rolePrefix}/paineis` },
        { title: 'Gestão Educacional', icon: Icons.Trending, href: `${rolePrefix}/gestao` },
      ],
    },
    {
      groupLabel: 'ADMINISTRAÇÃO',
      items: [
        { title: 'Escolas',   icon: Icons.Building, href: `${rolePrefix}/instituicao` },
        { title: 'Turmas',    icon: Icons.Team,     href: `${rolePrefix}/turmas` },
        { title: 'Usuários',  icon: Icons.Profile,  href: `${rolePrefix}/perfil` },
      ],
    },
  ];
}

interface SidebarCollapsedProps {
  tenantLogoUrl?: string;
  tenantName?:    string;
  mobileOpen?:    boolean;
  onMobileClose?: () => void;
}

export default function SidebarCollapsed({ tenantLogoUrl, tenantName, mobileOpen = false, onMobileClose }: SidebarCollapsedProps) {
  const pathname    = usePathname();
  const baseSegment = pathname.split('/')[1] || 'gestor';
  const rolePrefix  = `/${baseSegment}`;
  const menuGroups  = buildMenuGroups(rolePrefix, baseSegment);

  /* BIBLIOTECA e MEU ESPAÇO abertos por padrão; ACOMPANHAMENTO fechado */
  const CLOSED_BY_DEFAULT = ['ACOMPANHAMENTO'];

  const initOpen = () => {
    const state: Record<number, boolean> = {};
    menuGroups.forEach((group, gi) => {
      state[gi] = !CLOSED_BY_DEFAULT.includes(group.groupLabel);
    });
    return state;
  };

  const [openGroups, setOpenGroups] = useState<Record<number, boolean>>(initOpen);
  const toggle = (gi: number) => setOpenGroups(prev => ({ ...prev, [gi]: !prev[gi] }));

  return (
    <aside className={`group fixed left-0 top-0 h-screen flex flex-col bg-white border-r border-slate-100 overflow-x-hidden overflow-y-auto z-50 shadow-[3px_0_20px_-5px_rgba(0,0,0,0.05)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] transition-all duration-300 ease-in-out
      ${mobileOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full w-[88px]'}
      md:translate-x-0 md:w-[88px] md:hover:w-[280px]
    `}>

      {/* ── Logo ── */}
      <div className="h-[5.5rem] px-[18px] flex justify-start items-center relative overflow-hidden shrink-0 border-b border-slate-100">
        <div className="flex shrink-0 h-[50px] w-[50px] items-center justify-center bg-amber-100 bg-opacity-40 rounded-[20px] transition-opacity duration-200 group-hover:opacity-0 absolute left-[18px]">
          <Icons.KodarAppLogoCompact />
        </div>
        <div className={`shrink-0 h-[50px] transition-opacity duration-300 absolute left-[18px] flex items-center ${mobileOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 pointer-events-none'}`}>
          {tenantLogoUrl ? (
            <img src={tenantLogoUrl} alt={tenantName ?? 'Logo'} className="h-9 w-auto max-w-[160px] object-contain" />
          ) : tenantName ? (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-sm shrink-0">
                <span className="text-white text-xs font-extrabold tracking-wide">
                  {tenantName.split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0].toUpperCase()).join('')}
                </span>
              </div>
              <span className="text-sm font-bold text-slate-800 truncate max-w-[120px]">{tenantName}</span>
            </div>
          ) : (
            <Icons.ProjectLogoFull />
          )}
        </div>
      </div>

      {/* ── Nav ── */}
      <div className="flex-1 w-full flex flex-col items-start px-4 pt-4 pb-6 gap-1">
        {menuGroups.map((group, gi) => {
          const isOpen   = openGroups[gi] ?? true;
          const hasLabel = !!group.groupLabel;

          return (
            <div key={gi} className="w-full flex flex-col">

              {/* Label / Toggle — só para grupos com título */}
              {hasLabel && (
                <button
                  type="button"
                  onClick={() => toggle(gi)}
                  className={`w-full px-3 h-7 flex items-center justify-between overflow-hidden whitespace-nowrap transition-opacity duration-300 delay-100 rounded-xl hover:bg-slate-50 mt-3 ${mobileOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                >
                  <span className="text-[11px] font-extrabold text-slate-400 tracking-wider">
                    {group.groupLabel}
                  </span>
                  <svg
                    className={`w-3 h-3 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                    fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
              )}

              {/* Items — no estado recolhido (sem hover) sempre aparece;
                  no estado expandido (hover) obedece ao accordion          */}
              <div className={`
                overflow-hidden transition-all duration-300 ease-in-out flex flex-col
                ${isOpen || !hasLabel ? 'max-h-[600px]' : 'max-h-0'}
              `}>
                {group.items.map((item) => {
                  const isHome   = item.href === rolePrefix;
                  const isActive = isHome ? pathname === rolePrefix : pathname.startsWith(item.href);

                  return (
                    <Link href={item.href} key={item.title} title={item.title} className="w-full relative py-0.5" onClick={onMobileClose}>
                      <div className={`
                        w-full h-14 flex items-center shrink-0 rounded-2xl transition-all duration-300 ease-out relative
                        ${isActive ? 'bg-[#F8FAFC] ring-1 ring-slate-100/50' : 'hover:bg-slate-50/70 scale-[0.98] hover:scale-100'}
                      `}>
                        <div className={`flex shrink-0 items-center justify-center h-full w-[56px] transition-colors duration-200 ${isActive ? 'text-blue-500' : 'text-slate-500 hover:text-slate-700'}`}>
                          <item.icon />
                        </div>
                        <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out font-bold text-sm tracking-tight ${isActive ? 'text-blue-500' : 'text-[#475569]'} ${mobileOpen ? 'w-auto opacity-100 pl-2' : 'w-0 opacity-0 group-hover:w-auto group-hover:opacity-100 group-hover:pl-2'}`}>
                          {item.title}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>

            </div>
          );
        })}
      </div>
    </aside>
  );
}
