'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { HeroSummary } from '@/components/ui/HeroSummary';
import { useQuestions, useVideoLessons, useAudioLessons, useLessonPlans, useBooks, useGames } from '@/hooks/useAdminData';
import { useSimulators } from '@/hooks/useSimulators';
import { useEssayPrompts } from '@/hooks/useEssayPrompts';
import { EMPTY_QUESTION_FILTERS } from '@/types/question.types';
import {
  HelpCircle,
  Video,
  Headphones,
  ClipboardList,
  Library,
  ImageIcon,
  Gamepad2,
  Box,
  LayoutGrid,
  Search,
  PenTool,
} from 'lucide-react';

interface ContentModule {
  id: string;
  title: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  href: string;
  count: number;
  countLabel: string;
  gradientFrom: string;
  gradientTo: string;
  iconWrapperClass: string;
  iconClass: string;
  accentClass: string;
}

const contentModules: ContentModule[] = [
  {
    id: 'banco-questoes',
    title: 'Banco de Questões',
    description: 'Gerencie questões para provas, simulados e avaliações',
    icon: HelpCircle,
    href: '/admin/gestao-conteudos/banco-questoes',
    count: 0,
    countLabel: 'questões',
    gradientFrom: 'from-violet-500',
    gradientTo: 'to-purple-600',
    iconWrapperClass: 'bg-violet-50',
    iconClass: 'text-violet-600',
    accentClass: 'text-violet-600',
  },
  {
    id: 'propostas-redacao',
    title: 'Propostas de Redação',
    description: 'Gerencie modelos e temas de redação para professores',
    icon: PenTool,
    href: '/admin/gestao-conteudos/redacoes',
    count: 0,
    countLabel: 'propostas',
    gradientFrom: 'from-fuchsia-500',
    gradientTo: 'to-pink-600',
    iconWrapperClass: 'bg-fuchsia-50',
    iconClass: 'text-fuchsia-600',
    accentClass: 'text-fuchsia-600',
  },
  {
    id: 'videos',
    title: 'Vídeos e Videoaulas',
    description: 'Organize conteúdos em vídeo para apoio ao aprendizado',
    icon: Video,
    href: '/admin/gestao-conteudos/videos',
    count: 0,
    countLabel: 'vídeos',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-sky-500',
    iconWrapperClass: 'bg-blue-50',
    iconClass: 'text-blue-600',
    accentClass: 'text-blue-600',
  },
  {
    id: 'audios',
    title: 'Áudios',
    description: 'Gerencie podcasts, áudios infantis e conteúdos de inglês',
    icon: Headphones,
    href: '/admin/gestao-conteudos/audios',
    count: 0,
    countLabel: 'áudios',
    gradientFrom: 'from-rose-500',
    gradientTo: 'to-pink-500',
    iconWrapperClass: 'bg-rose-50',
    iconClass: 'text-rose-600',
    accentClass: 'text-rose-600',
  },
  {
    id: 'planos-aula',
    title: 'Acervo Pedagógico',
    description: 'Gerencie planos de aula, sequências didáticas e materiais do acervo',
    icon: ClipboardList,
    href: '/admin/gestao-conteudos/planos-aula',
    count: 0,
    countLabel: 'materiais',
    gradientFrom: 'from-indigo-500',
    gradientTo: 'to-blue-600',
    iconWrapperClass: 'bg-indigo-50',
    iconClass: 'text-indigo-600',
    accentClass: 'text-indigo-600',
  },
  {
    id: 'biblioteca',
    title: 'Biblioteca',
    description: 'Gerencie livros, textos e materiais de leitura',
    icon: Library,
    href: '/admin/gestao-conteudos/biblioteca',
    count: 0,
    countLabel: 'materiais',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-orange-500',
    iconWrapperClass: 'bg-amber-50',
    iconClass: 'text-amber-600',
    accentClass: 'text-amber-600',
  },
  {
    id: 'infograficos',
    title: 'Infográficos e Imagens',
    description: 'Organize recursos visuais e materiais ilustrativos',
    icon: ImageIcon,
    href: '/admin/gestao-conteudos/infograficos',
    count: 0,
    countLabel: 'recursos',
    gradientFrom: 'from-teal-500',
    gradientTo: 'to-cyan-500',
    iconWrapperClass: 'bg-teal-50',
    iconClass: 'text-teal-600',
    accentClass: 'text-teal-600',
  },
  {
    id: 'jogos',
    title: 'Jogos Educacionais',
    description: 'Gerencie jogos interativos para aprendizagem',
    icon: Gamepad2,
    href: '/admin/gestao-conteudos/jogos',
    count: 0,
    countLabel: 'jogos',
    gradientFrom: 'from-green-500',
    gradientTo: 'to-emerald-500',
    iconWrapperClass: 'bg-green-50',
    iconClass: 'text-green-600',
    accentClass: 'text-green-600',
  },
  {
    id: 'simuladores-3d',
    title: 'Simuladores 3D',
    description: 'Explore experiências imersivas com simulações educacionais',
    icon: Box,
    href: '/admin/gestao-conteudos/simuladores-3d',
    count: 0,
    countLabel: 'simuladores',
    gradientFrom: 'from-slate-600',
    gradientTo: 'to-slate-800',
    iconWrapperClass: 'bg-slate-100',
    iconClass: 'text-slate-600',
    accentClass: 'text-slate-700',
  },
];

export default function GestaoConteudosPage() {
  const [search, setSearch] = useState('');
  const { data: questionsRes } = useQuestions(EMPTY_QUESTION_FILTERS, 1, 1);
  const { data: videosRes }    = useVideoLessons({}, 1, 1);
  const { data: audiosRes }    = useAudioLessons({}, 1, 1);
  const { data: plansRes }     = useLessonPlans({}, 1, 1);
  const { data: booksRes }     = useBooks({}, 1, 1);
  const { data: gamesRes }     = useGames({}, 1, 1);
  const { data: simulatorsRes } = useSimulators({ page: 1, pageSize: 1, status: '' });
  const { data: promptsRes }   = useEssayPrompts({ page: 1, pageSize: 1 });

  const questionsCount = questionsRes?.count ?? 0;
  const videosCount    = videosRes?.count    ?? 0;
  const audiosCount    = audiosRes?.count    ?? 0;
  const plansCount     = plansRes?.count     ?? 0;
  const booksCount     = booksRes?.count     ?? 0;
  const gamesCount     = gamesRes?.count     ?? 0;
  const simulatorsCount = simulatorsRes?.count ?? 0;
  const promptsCount   = promptsRes?.count ?? 0;

  const dynamicModules = useMemo(() => {
    return contentModules.map(m => {
      if (m.id === 'banco-questoes' && questionsCount > 0) return { ...m, count: questionsCount };
      if (m.id === 'videos')       return { ...m, count: videosCount };
      if (m.id === 'audios')       return { ...m, count: audiosCount };
      if (m.id === 'planos-aula')  return { ...m, count: plansCount };
      if (m.id === 'biblioteca')   return { ...m, count: booksCount };
      if (m.id === 'jogos')        return { ...m, count: gamesCount };
      if (m.id === 'simuladores-3d') return { ...m, count: simulatorsCount };
      if (m.id === 'propostas-redacao') return { ...m, count: promptsCount };
      return m;
    });
  }, [questionsCount, videosCount, audiosCount, plansCount, booksCount, gamesCount, simulatorsCount, promptsCount]);

  const filtered = dynamicModules.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-8 pb-32 animate-fade-in">
      {/* Hero — usa bg-purple-700 + to-blue-600 (cores padrão Tailwind, sem risco de JIT miss) */}
      <HeroSummary
        title="Gestão de Conteúdos"
        description="Gerencie todos os recursos educacionais da plataforma em um único lugar"
        icon={<LayoutGrid className="w-8 h-8 text-white" />}
        themeClass="bg-gradient-to-br from-purple-700 via-purple-600 to-blue-600"
      />

      {/* Search + Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Módulos de Conteúdo</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {filtered.length === dynamicModules.length
              ? `${dynamicModules.length} módulos disponíveis`
              : `${filtered.length} de ${dynamicModules.length} módulos`}
          </p>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar módulo de conteúdo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              w-full pl-9 pr-4 py-2.5 text-sm
              bg-white border border-slate-200 rounded-xl
              text-slate-800 placeholder-slate-400
              shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]
              focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-500
              transition-all duration-200
            "
          />
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((module, index) => {
            const Icon = module.icon;
            const delay = index < 5 ? `animate-slide-up-d${(index + 1) as 1 | 2 | 3 | 4 | 5}` : 'animate-slide-up';

            return (
              <Link
                key={module.id}
                href={module.href}
                className={`
                  group relative flex flex-col bg-white rounded-2xl border border-slate-100
                  shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)]
                  hover:shadow-[0_16px_48px_-8px_rgba(0,0,0,0.14)]
                  hover:-translate-y-1.5
                  transition-all duration-300 ease-out
                  overflow-hidden cursor-pointer
                  ${delay}
                `}
              >
                {/* Top accent bar */}
                <div className={`h-1 w-full bg-gradient-to-r ${module.gradientFrom} ${module.gradientTo}`} />

                <div className="p-6 flex flex-col flex-1">
                  {/* Icon */}
                  <div className="mb-4">
                    <div
                      className={`
                        flex h-12 w-12 items-center justify-center rounded-xl
                        ${module.iconWrapperClass}
                        transition-transform duration-300 group-hover:scale-110
                      `}
                    >
                      <Icon className={`h-6 w-6 ${module.iconClass}`} />
                    </div>
                  </div>

                  {/* Title + Description */}
                  <div className="flex-1">
                    <h3 className="text-[15px] font-bold text-slate-900 leading-snug mb-1.5 group-hover:text-purple-700 transition-colors duration-200">
                      {module.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {module.description}
                    </p>
                  </div>

                  {/* Count + Arrow */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-end justify-between">
                    <div>
                      <span className={`text-2xl font-extrabold ${module.accentClass} tabular-nums`}>
                        {module.count.toLocaleString('pt-BR')}
                      </span>
                      <span className="text-xs text-slate-400 font-medium ml-1.5">
                        {module.countLabel}
                      </span>
                    </div>
                    <div
                      className={`
                        flex items-center justify-center h-7 w-7 rounded-lg
                        ${module.iconWrapperClass}
                        opacity-0 translate-x-2
                        group-hover:opacity-100 group-hover:translate-x-0
                        transition-all duration-300
                      `}
                    >
                      <svg className={`h-3.5 w-3.5 ${module.iconClass}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 mb-4">
            <Search className="h-7 w-7 text-slate-400" />
          </div>
          <p className="text-base font-semibold text-slate-700">Nenhum módulo encontrado</p>
          <p className="text-sm text-slate-400 mt-1">
            Tente outro termo de busca
          </p>
          <button
            onClick={() => setSearch('')}
            className="mt-4 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
          >
            Limpar busca
          </button>
        </div>
      )}
    </div>
  );
}
