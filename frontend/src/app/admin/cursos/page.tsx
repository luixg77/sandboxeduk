'use client';

import { useCourses, useDeleteCourse, useDisciplines, useProjects } from '@/hooks/useAdminData';
import { HeroSummary } from '@/components/ui/HeroSummary';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import {
  GraduationCap, Plus, Search, Edit2, Trash2, AlertTriangle,
  Image as ImageIcon, BookOpen, BarChart2, ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft:     { label: 'Rascunho',  className: 'bg-slate-100 text-slate-600' },
  published: { label: 'Publicado', className: 'bg-emerald-100 text-emerald-700' },
  archived:  { label: 'Arquivado', className: 'bg-amber-100 text-amber-700' },
};

export default function CursosPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const limit = 20;
  const [search, setSearch]           = useState('');
  const [filterDisc, setFilterDisc]   = useState('');
  const [filterProj, setFilterProj]   = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { data: response, isLoading } = useCourses(page, limit);
  const courses = response?.data || [];
  const totalPages = response?.count ? Math.ceil(response.count / limit) : 1;

  const { data: discsResp } = useDisciplines(1, 100);
  const { data: projsResp } = useProjects(1, 100);
  const disciplines = discsResp?.data || [];
  const projects    = projsResp?.data || [];

  const { mutate: deleteCourse, isPending: isDeleting } = useDeleteCourse();

  const filtered = courses.filter(c => {
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.course_disciplines || []).some((d: any) => d.disciplines?.name?.toLowerCase().includes(search.toLowerCase()));

    const matchDisc = !filterDisc ||
      (c.course_disciplines || []).some((d: any) => d.discipline_id === filterDisc);

    const matchProj = !filterProj ||
      (c.course_projects || []).some((p: any) => p.project_id === filterProj);

    return matchSearch && matchDisc && matchProj;
  });

  const handleDelete = () => {
    if (!deleteTarget?.id) return;
    deleteCourse(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  const getModuleCount = (course: any) =>
    (course.course_modules || []).filter((m: any) => !m.deleted_at).length;

  const renderDisciplines = (course: any) => {
    const items = (course.course_disciplines || []).map((d: any) => d.disciplines).filter(Boolean);
    if (!items.length) return <span className="text-slate-400 text-xs">—</span>;
    const visible = items.slice(0, 2);
    const extras  = items.slice(2).map((d: any) => d.name).join(', ');
    return (
      <div className="flex flex-wrap items-center gap-1 max-w-full">
        {visible.map((d: any, i: number) => (
          <span
            key={i}
            title={d.name}
            className="px-1.5 py-0.5 rounded text-[11px] font-semibold text-white whitespace-nowrap max-w-[120px] truncate"
            style={{ backgroundColor: d.color_hex || '#6366f1' }}
          >
            {d.name}
          </span>
        ))}
        {items.length > 2 && (
          <span
            title={extras}
            className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[11px] whitespace-nowrap"
          >
            +{items.length - 2}
          </span>
        )}
      </div>
    );
  };

  const renderProjects = (course: any) => {
    const items = (course.course_projects || []).map((p: any) => p.projects).filter(Boolean);
    if (!items.length) return <span className="text-slate-400 text-xs">—</span>;
    const visible = items.slice(0, 2);
    const extras  = items.slice(2).map((p: any) => p.name).join(', ');
    return (
      <div className="flex flex-wrap items-center gap-1 max-w-full">
        {visible.map((p: any, i: number) => (
          <span
            key={i}
            title={p.name}
            className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[11px] font-medium whitespace-nowrap max-w-[120px] truncate"
          >
            {p.name}
          </span>
        ))}
        {items.length > 2 && (
          <span
            title={extras}
            className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[11px] whitespace-nowrap"
          >
            +{items.length - 2}
          </span>
        )}
      </div>
    );
  };

  const hasFilters = search || filterDisc || filterProj;

  return (
    <div className="p-8 pb-32">
      <HeroSummary
        title="Gestão de Cursos (EAD)"
        description="Crie trilhas de aprendizagem completas com módulos, vídeos, questões e áudios."
        icon={<GraduationCap className="w-8 h-8 text-white" />}
        themeClass="bg-emerald-600"
      >
        <button
          onClick={() => router.push('/admin/cursos/novo')}
          className="flex items-center gap-2 bg-white text-emerald-600 px-5 py-3 rounded-xl font-bold shadow hover:bg-slate-50 transition-colors"
        >
          <Plus className="w-5 h-5" /> Novo Curso
        </button>
      </HeroSummary>

      {/* Filters bar */}
      <Card className="mb-6 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Pesquisar por título..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Discipline filter */}
        <div className="relative min-w-[180px]">
          <select
            value={filterDisc}
            onChange={e => setFilterDisc(e.target.value)}
            className="w-full appearance-none pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700"
          >
            <option value="">Todas as disciplinas</option>
            {disciplines.map((d: any) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>

        {/* Project filter */}
        <div className="relative min-w-[180px]">
          <select
            value={filterProj}
            onChange={e => setFilterProj(e.target.value)}
            className="w-full appearance-none pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700"
          >
            <option value="">Todos os projetos</option>
            {projects.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>

        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setFilterDisc(''); setFilterProj(''); }}
            className="text-xs text-slate-500 hover:text-red-500 font-medium transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
          >
            Limpar filtros
          </button>
        )}
      </Card>

      <Table
        isLoading={isLoading}
        data={filtered}
        emptyMessage="Nenhum curso encontrado."
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        columns={[
          {
            header: 'Curso',
            accessor: (row: any) => (
              <div className="flex items-center gap-3">
                <div className="w-14 h-10 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                  {row.thumbnail_url
                    ? <img src={row.thumbnail_url} alt={row.title} className="w-full h-full object-cover" />
                    : <ImageIcon className="w-5 h-5 text-slate-300" />}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-slate-900 truncate">{row.title}</span>
                  <span className="text-xs text-slate-400">
                    {getModuleCount(row)} módulo{getModuleCount(row) !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            ),
          },
          {
            header: 'Disciplinas',
            accessor: (row: any) => renderDisciplines(row),
            className: 'w-48',
          },
          {
            header: 'Projetos',
            accessor: (row: any) => renderProjects(row),
            className: 'w-48',
          },
          {
            header: 'Status',
            accessor: (row: any) => {
              const cfg = STATUS_CONFIG[row.status] || STATUS_CONFIG.draft;
              return (
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${cfg.className}`}>
                  {cfg.label}
                </span>
              );
            },
            className: 'w-32',
          },
          {
            header: 'Ações',
            accessor: (row: any) => (
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => router.push(`/admin/cursos/${row.id}`)}
                  title="Editar curso"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-lg transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Editar
                </button>
                <button
                  onClick={() => router.push(`/admin/cursos/${row.id}#modules`)}
                  title="Acompanhar trilha"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  <BarChart2 className="w-3.5 h-3.5" /> Acompanhar
                </button>
                <button
                  onClick={() => setDeleteTarget(row)}
                  title="Excluir curso"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </button>
              </div>
            ),
            className: 'w-64 text-right',
          },
        ]}
      />

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Excluir Curso">
        <div className="space-y-4">
          <div className="flex items-start gap-3 text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-200">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">
              Tem certeza que deseja excluir o curso <strong>"{deleteTarget?.title}"</strong>?
              Os módulos e itens da trilha serão removidos.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button onClick={handleDelete} loading={isDeleting} className="bg-red-600 hover:bg-red-700 text-white">
              Sim, Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
