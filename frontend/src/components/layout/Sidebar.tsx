'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCurrentOrganization } from '@/hooks/useAdminData';

const Icons = {
  KodarLogo: () => (
    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  Settings: () => (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Organization: () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  ),
  Client: () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
    </svg>
  ),
  School: () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
    </svg>
  ),
  Project: () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
    </svg>
  ),
  Users: () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  Education: () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-5.25L21 9l-9 5.25L3 9z" />
    </svg>
  ),
  Book: () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  Grade: () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
    </svg>
  ),
  ChevronDown: ({ open }: { open: boolean }) => (
    <svg className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  ),
  PanelLeftClose: ({ collapsed }: { collapsed?: boolean }) => (
    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      {collapsed ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v18M11.25 8.25l4.5 3.75-4.5 3.75" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 3v18M12.75 8.25L8.25 12l4.5 3.75" />
      )}
    </svg>
  ),
  ContentHub: () => (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
  Courses: () => (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
    </svg>
  ),
};

interface SubmenuItem {
  name: string;
  href: string;
  icon: React.FC;
}

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export default function Sidebar({ isCollapsed, toggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const [configOpen, setConfigOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const { data: currentOrg } = useCurrentOrganization();

  // If sidebar is collapsed but hovered, physically treat it as expanded
  const expanded = !isCollapsed || isHovered;

  const institutionalItems: SubmenuItem[] = [
    { name: 'Organização', href: '/admin/organizacao', icon: Icons.Organization },
    { name: 'Clientes', href: '/admin/clientes', icon: Icons.Client },
    { name: 'Usuários', href: '/admin/usuarios', icon: Icons.Users },
  ];

  const academicItems: SubmenuItem[] = [
    { name: 'Escolas', href: '/admin/escolas', icon: Icons.School },
    { name: 'Disciplinas', href: '/admin/disciplinas', icon: Icons.Book },
    { name: 'Etapas de Ensino', href: '/admin/etapas', icon: Icons.Education },
    { name: 'Séries', href: '/admin/series', icon: Icons.Grade },
    { name: 'Habilidades', href: '/admin/habilidades', icon: () => (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    )},
  ];

  const operationalItems: SubmenuItem[] = [
    { name: 'Projetos', href: '/admin/projetos', icon: Icons.Project },
  ];

  const allConfigItems = [...institutionalItems, ...academicItems, ...operationalItems];
  const isConfigActive = allConfigItems.some((item) => pathname.startsWith(item.href));

  useState(() => {
    if (isConfigActive) setConfigOpen(true);
  });

  return (
    <aside 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        fixed left-0 top-0 flex h-screen flex-col bg-white border-r border-slate-200 z-50
        transition-all duration-300 ease-in-out
        ${expanded ? 'w-64 shadow-xl shadow-slate-200/50' : 'w-[80px] shadow-none'}
      `}
    >
      
      {/* ── Brand ── */}
      <div className={`flex h-16 items-center px-5 border-b border-white shrink-0 transition-solid ${expanded ? 'justify-start' : 'justify-center'}`}>
        <div className={`flex items-center gap-3 w-full transition-opacity duration-300 ${expanded ? 'opacity-100' : 'opacity-0 hidden'} `}>
          {currentOrg?.logo_url ? (
            <img src={currentOrg.logo_url} alt={currentOrg.name} className="h-8 max-w-[150px] object-contain rounded" />
          ) : (
            <>
              <div className="flex h-8 w-8 items-center justify-center bg-kodar-600 rounded-lg shadow-sm shadow-kodar-600/30 shrink-0">
                <Icons.KodarLogo />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-kodar-600 to-kodar-800 truncate">
                {currentOrg?.name || 'Kodar'}
              </span>
            </>
          )}
        </div>
        {/* Compact Logo Version when completely collapsed */}
        {!expanded && (
          <div className="flex h-10 w-10 min-w-10 min-h-10 items-center justify-center bg-kodar-600 rounded-xl shadow-sm shadow-kodar-600/30">
            <Icons.KodarLogo />
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden pt-6 pb-20 space-y-1">

        {/* ── Gestão de Conteúdos ── */}
        <div className={`flex flex-col mb-1 ${expanded ? 'px-4' : 'px-2 items-center'}`}>
          <Link
            href="/admin/gestao-conteudos"
            className={`
              flex items-center rounded-lg transition-colors text-sm font-semibold relative
              ${expanded ? 'w-full justify-start gap-3 px-3 py-2.5' : 'w-12 h-12 justify-center'}
              ${pathname.startsWith('/admin/gestao-conteudos') ? 'bg-kodar-purple-50 text-kodar-purple-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
            `}
          >
            {pathname.startsWith('/admin/gestao-conteudos') && expanded && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-kodar-purple-600 rounded-r-md" />
            )}
            <span className={`flex items-center justify-center ${pathname.startsWith('/admin/gestao-conteudos') ? 'text-kodar-purple-600' : 'text-slate-500'}`}>
              <Icons.ContentHub />
            </span>
            <span className={`whitespace-nowrap transition-all duration-300 ${expanded ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
              Gestão de Conteúdos
            </span>
          </Link>
        </div>

        {/* ── Gestão de Cursos ── */}
        <div className={`flex flex-col mb-1 ${expanded ? 'px-4' : 'px-2 items-center'}`}>
          <Link
            href="/admin/cursos"
            className={`
              flex items-center rounded-lg transition-colors text-sm font-semibold relative
              ${expanded ? 'w-full justify-start gap-3 px-3 py-2.5' : 'w-12 h-12 justify-center'}
              ${pathname.startsWith('/admin/cursos') ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
            `}
          >
            {pathname.startsWith('/admin/cursos') && expanded && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-emerald-600 rounded-r-md" />
            )}
            <span className={`flex items-center justify-center ${pathname.startsWith('/admin/cursos') ? 'text-emerald-600' : 'text-slate-500'}`}>
              <Icons.Courses />
            </span>
            <span className={`whitespace-nowrap transition-all duration-300 ${expanded ? 'opacity-100' : 'opacity-0 w-0 hidden'}`}>
              Gestão de Cursos
            </span>
          </Link>
        </div>

        {/* Container that acts completely different based on visual width */}
        <div className={`flex flex-col ${expanded ? 'px-4' : 'px-2 items-center'}`}>
          <button
            onClick={() => {
              if (!expanded) return;
              setConfigOpen(!configOpen);
            }}
            className={`
              flex items-center rounded-lg transition-colors text-sm font-semibold relative
              ${expanded ? 'w-full justify-between px-3 py-2.5' : 'w-12 h-12 justify-center'}
              ${isConfigActive ? 'bg-slate-50' : 'hover:bg-slate-50'}
            `}
          >
            <div className="flex items-center gap-3 h-full">
              <span className={`flex items-center justify-center ${isConfigActive ? 'text-kodar-600' : 'text-slate-500'}`}>
                <Icons.Settings />
              </span>
              <span className={`whitespace-nowrap transition-all duration-300 ${expanded ? 'opacity-100' : 'opacity-0 w-0 hidden'} ${isConfigActive ? 'text-kodar-700' : 'text-slate-700'}`}>
                Configurações
              </span>
            </div>
            
            {expanded && <Icons.ChevronDown open={configOpen} />}
          </button>

          {/* Submenu Dropdown logic ONLY visible if expanded */}
          <div
            className={`
              overflow-hidden transition-all duration-300 ease-in-out pl-6 space-y-1 content-visibility-auto
              ${configOpen && expanded ? 'max-h-[1000px] mt-2 pb-4 opacity-100' : 'max-h-0 opacity-0'}
            `}
          >
            {/* --- INSTITUCIONAL --- */}
            <div className="pt-2 pb-1 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-3 truncate">Estrutura</div>
            {institutionalItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all relative whitespace-nowrap
                    ${isActive ? 'bg-kodar-50 text-kodar-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                >
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-1 bg-kodar-600 rounded-r-md"></div>}
                  <span className={`${isActive ? 'text-kodar-600' : 'text-slate-400 group-hover:text-slate-500'} shrink-0`}><item.icon /></span>
                  {item.name}
                </Link>
              );
            })}

            {/* --- ACADÊMICO --- */}
            <div className="pt-4 pb-1 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-3 truncate">Acadêmico</div>
            {academicItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all relative whitespace-nowrap
                    ${isActive ? 'bg-kodar-50 text-kodar-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                >
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-1 bg-kodar-600 rounded-r-md"></div>}
                  <span className={`${isActive ? 'text-kodar-600' : 'text-slate-400 group-hover:text-slate-500'} shrink-0`}><item.icon /></span>
                  {item.name}
                </Link>
              );
            })}

            {/* --- OPERACIONAL --- */}
            <div className="pt-4 pb-1 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-3 truncate">Operacional</div>
            {operationalItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all relative whitespace-nowrap
                    ${isActive ? 'bg-kodar-50 text-kodar-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                >
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-1 bg-kodar-600 rounded-r-md"></div>}
                  <span className={`${isActive ? 'text-kodar-600' : 'text-slate-400 group-hover:text-slate-500'} shrink-0`}><item.icon /></span>
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ── Toggle Collapse Button ── */}
      <div className={`p-4 border-t border-slate-100 flex ${expanded ? 'justify-end' : 'justify-center'} transition-all`}>
        <button 
          onClick={toggleCollapse}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-kodar-600 transition-colors tooltip"
          title={isCollapsed ? 'Fixar Menu' : 'Ocultar Menu'}
        >
          <Icons.PanelLeftClose collapsed={isCollapsed} />
        </button>
      </div>
      
    </aside>
  );
}
