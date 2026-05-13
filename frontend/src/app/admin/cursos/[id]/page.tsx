'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  useCourseById, useCreateCourse, useUpdateCourse,
  useCourseModules, useCreateCourseModule, useUpdateCourseModule, useDeleteCourseModule,
  useCourseModuleItems, useAddCourseModuleItem, useRemoveCourseModuleItem,
  useReorderCourseModules, useReorderModuleItems,
  useDisciplines, useGrades, useProjects,
} from '@/hooks/useAdminData';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import InputField from '@/components/ui/InputField';
import { SelectField } from '@/components/ui/SelectField';
import Button from '@/components/ui/Button';
import ContentPanel from './components/ContentPanel';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft, GraduationCap, BookOpen, Plus, Trash2, Edit2,
  ChevronDown, ChevronRight, Image as ImageIcon, UploadCloud,
  Play, Headphones, HelpCircle, X, AlertTriangle, FolderKanban,
  GripVertical, Calendar, CheckCircle2,
} from 'lucide-react';

// ─── Config ───────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'draft',     label: 'Rascunho' },
  { value: 'published', label: 'Publicado' },
  { value: 'archived',  label: 'Arquivado' },
];
const AUDIENCE_OPTIONS = [
  { value: 'student', label: 'Aluno' },
  { value: 'teacher', label: 'Professor' },
  { value: 'both',    label: 'Aluno e Professor' },
];
const ITEM_CFG: Record<string, { Icon: any; color: string; label: string }> = {
  video:    { Icon: Play,       color: 'text-violet-500 bg-violet-50', label: 'Vídeo' },
  audio:    { Icon: Headphones, color: 'text-blue-500 bg-blue-50',    label: 'Áudio' },
  question: { Icon: HelpCircle, color: 'text-amber-500 bg-amber-50',  label: 'Questão' },
};
const STATUS_BADGE: Record<string, string> = {
  draft:     'bg-slate-100 text-slate-600',
  published: 'bg-emerald-100 text-emerald-700',
  archived:  'bg-amber-100 text-amber-700',
};
const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho', published: 'Publicado', archived: 'Arquivado',
};

// ─── Toast ────────────────────────────────────────────────────
function SavedToast({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-semibold animate-fade-in">
      <CheckCircle2 className="w-4 h-4" /> Salvo com sucesso!
    </div>
  );
}

// ─── MultiDisciplineSelect ────────────────────────────────────
function MultiDisciplineSelect({ disciplines, selected, onChange }: {
  disciplines: any[]; selected: string[]; onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const filtered = disciplines.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
  const selectedItems = disciplines.filter(d => selected.includes(d.id));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Disciplinas</label>
      <div
        onClick={() => setOpen(v => !v)}
        className="min-h-[42px] w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer flex flex-wrap gap-1 items-center hover:border-slate-300"
      >
        {selectedItems.length === 0
          ? <span className="text-sm text-slate-400">Selecionar disciplinas...</span>
          : selectedItems.map(d => (
            <span key={d.id} className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold text-white"
              style={{ backgroundColor: d.color_hex || '#6366f1' }}>
              {d.name}
              <button type="button" onClick={e => { e.stopPropagation(); toggle(d.id); }}
                className="ml-0.5 opacity-70 hover:opacity-100">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        }
        <ChevronDown className={`w-4 h-4 text-slate-400 ml-auto shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>
      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <input autoFocus type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar disciplina..."
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400" />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0
              ? <p className="text-sm text-center text-slate-400 py-4">Nenhuma encontrada.</p>
              : filtered.map(d => {
                const sel = selected.includes(d.id);
                return (
                  <label key={d.id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors ${sel ? 'bg-emerald-50/60' : ''}`}>
                    <input type="checkbox" checked={sel} onChange={() => toggle(d.id)}
                      className="w-4 h-4 rounded accent-emerald-500" />
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color_hex || '#6366f1' }} />
                    <span className={`text-sm font-medium ${sel ? 'text-emerald-700' : 'text-slate-700'}`}>{d.name}</span>
                  </label>
                );
              })
            }
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Module Trail ─────────────────────────────────────────────
function ModuleTrail({ moduleId, courseId }: { moduleId: string; courseId: string }) {
  const { data: items = [], isLoading } = useCourseModuleItems(moduleId);
  const { mutate: removeItem } = useRemoveCourseModuleItem();
  const { mutate: reorderItems } = useReorderModuleItems();
  const { mutate: addItem } = useAddCourseModuleItem();

  const [localItems, setLocalItems] = useState<any[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => { setLocalItems([...items]); }, [items]);

  const handleAdd = useCallback((content: { item_type: string; item_id: string; title: string; thumbnail_url?: string }) => {
    addItem({
      module_id: moduleId,
      course_id: courseId,
      item_type: content.item_type,
      item_id: content.item_id,
      title: content.title,
      thumbnail_url: content.thumbnail_url,
      order_index: localItems.length,
    });
  }, [moduleId, courseId, localItems.length, addItem]);

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOver(idx); };
  const handleDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === toIdx) { setDragIdx(null); setDragOver(null); return; }
    const next = [...localItems];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(toIdx, 0, moved);
    setLocalItems(next);
    setDragIdx(null);
    setDragOver(null);
    reorderItems({ moduleId, items: next.map((it, i) => ({ id: it.id, order_index: i })) });
  };

  if (isLoading) return (
    <div className="px-4 py-3 text-sm text-slate-400 animate-pulse border-t border-slate-100">
      Carregando trilha...
    </div>
  );

  return (
    <div>
      {localItems.length === 0 ? (
        <div className="px-4 py-4 text-sm text-slate-400 text-center border-t border-slate-100">
          Nenhum conteúdo na trilha. Adicione abaixo.
        </div>
      ) : (
        <div className="divide-y divide-slate-50 border-t border-slate-100">
          {localItems.map((item: any, idx: number) => {
            const cfg = ITEM_CFG[item.item_type] || ITEM_CFG.video;
            const Icon = cfg.Icon;
            return (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={e => handleDragOver(e, idx)}
                onDrop={e => handleDrop(e, idx)}
                onDragEnd={() => { setDragIdx(null); setDragOver(null); }}
                className={`flex items-center gap-3 px-4 py-2.5 group transition-all cursor-grab active:cursor-grabbing
                  ${dragIdx === idx ? 'opacity-40 bg-slate-50' : 'hover:bg-slate-50'}
                  ${dragOver === idx && dragIdx !== idx ? 'border-t-2 border-emerald-400' : ''}
                `}
              >
                <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-400 shrink-0" />
                <span className="text-xs font-bold text-slate-400 w-5 shrink-0">{idx + 1}</span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cfg.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                {item.thumbnail_url && (
                  <img src={item.thumbnail_url} alt="" className="w-12 h-8 rounded object-cover shrink-0 border border-slate-200" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{item.title}</p>
                  <p className="text-xs text-slate-400">{cfg.label}</p>
                </div>
                <button
                  onClick={() => removeItem({ id: item.id, moduleId })}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:bg-red-50 rounded transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="border-t border-slate-100">
        <button
          type="button"
          onClick={() => setAddOpen(v => !v)}
          className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors
            ${addOpen ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:text-emerald-600 hover:bg-slate-50'}`}
        >
          <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> Adicionar à Trilha</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${addOpen ? 'rotate-180' : ''}`} />
        </button>
        {addOpen && <ContentPanel moduleId={moduleId} courseId={courseId} onAdd={handleAdd} />}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
type ModuleAction = { type: 'create' | 'edit' | 'delete' | null; record: any };

export default function CourseEditorPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const isNew = courseId === 'novo';
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'info' | 'modules'>('info');
  const [savedToast, setSavedToast] = useState(false);

  const showToast = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  // ── Rehydrate tab from hash on arrival ──
  useEffect(() => {
    if (window.location.hash === '#modules') {
      setActiveTab('modules');
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // ── Data ──
  const { data: courseData } = useCourseById(isNew ? '' : courseId);
  const { data: discsResp } = useDisciplines(1, 100);
  const { data: gradesResp } = useGrades(1, 100);
  const { data: projsResp } = useProjects(1, 100);
  const disciplines = discsResp?.data || [];
  const grades = gradesResp?.data || [];
  const projects = projsResp?.data || [];

  const { mutateAsync: createCourse, isPending: isCreating } = useCreateCourse();
  const { mutateAsync: updateCourse, isPending: isUpdating } = useUpdateCourse();

  // ── Form state ──
  const [form, setForm] = useState({
    title: '', description: '', start_date: '', end_date: '',
    target_audience: 'both', status: 'draft',
  });
  const [selectedDisciplineIds, setSelectedDisciplineIds] = useState<string[]>([]);
  const [selectedGradeIds, setSelectedGradeIds] = useState<string[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const thumbRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!courseData) return;
    setForm({
      title: courseData.title || '',
      description: courseData.description || '',
      start_date: courseData.start_date || '',
      end_date: courseData.end_date || '',
      target_audience: courseData.target_audience || 'both',
      status: courseData.status || 'draft',
    });
    setThumbPreview(courseData.thumbnail_url || '');
    setSelectedDisciplineIds((courseData.course_disciplines || []).map((d: any) => d.discipline_id).filter(Boolean));
    setSelectedGradeIds((courseData.course_grades || []).map((g: any) => g.grade_id).filter(Boolean));
    setSelectedProjectIds((courseData.course_projects || []).map((p: any) => p.project_id).filter(Boolean));
  }, [courseData]);

  // ── Upload thumbnail helper ──
  const uploadThumb = async (): Promise<string | null> => {
    if (!thumbFile) return null;
    setIsUploading(true);
    try {
      const ext = thumbFile.name.split('.').pop();
      const path = `courses/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('logoclient').upload(path, thumbFile, { upsert: false });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('logoclient').getPublicUrl(path);
      return publicUrl;
    } finally {
      setIsUploading(false);
    }
  };

  // ── Save course info ──
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    let thumbnailUrl = courseData?.thumbnail_url || '';
    try {
      const uploaded = await uploadThumb();
      if (uploaded) thumbnailUrl = uploaded;
    } catch {
      alert('Erro no upload da thumbnail.');
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      target_audience: form.target_audience,
      status: form.status,
      thumbnail_url: thumbnailUrl || null,
    };

    try {
      if (isNew) {
        const res = await createCourse({
          course: payload,
          disciplineIds: selectedDisciplineIds,
          gradeIds: selectedGradeIds,
          projectIds: selectedProjectIds,
        });
        showToast();
        router.replace(`/admin/cursos/${(res as any).id}#modules`);
      } else {
        await updateCourse({
          id: courseId,
          course: payload,
          disciplineIds: selectedDisciplineIds,
          gradeIds: selectedGradeIds,
          projectIds: selectedProjectIds,
        });
        showToast();
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar o curso.');
    }
  };

  // ── Modules ──
  const { data: rawModules = [], isLoading: loadingModules } = useCourseModules(courseId);
  const [moduleOrder, setModuleOrder] = useState<string[]>([]);
  useEffect(() => { setModuleOrder(rawModules.map((m: any) => m.id)); }, [rawModules]);
  const modules = moduleOrder
    .map(id => rawModules.find((m: any) => m.id === id))
    .filter(Boolean) as any[];

  const { mutateAsync: createModuleAsync, isPending: isCreatingModule } = useCreateCourseModule();
  const { mutateAsync: updateModuleAsync, isPending: isUpdatingModule } = useUpdateCourseModule();
  const { mutate: deleteModule, isPending: isDeletingModule } = useDeleteCourseModule();
  const { mutate: reorderModules } = useReorderCourseModules();

  const [moduleAction, setModuleAction] = useState<ModuleAction>({ type: null, record: null });
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', start_date: '', end_date: '' });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // DnD modules
  const [dragModuleIdx, setDragModuleIdx] = useState<number | null>(null);
  const [dragModuleOver, setDragModuleOver] = useState<number | null>(null);

  const handleModuleDragStart = (idx: number) => setDragModuleIdx(idx);
  const handleModuleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragModuleOver(idx); };
  const handleModuleDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    if (dragModuleIdx === null || dragModuleIdx === toIdx) {
      setDragModuleIdx(null); setDragModuleOver(null); return;
    }
    const next = [...moduleOrder];
    const [moved] = next.splice(dragModuleIdx, 1);
    next.splice(toIdx, 0, moved);
    setModuleOrder(next);
    setDragModuleIdx(null);
    setDragModuleOver(null);
    reorderModules({ courseId, modules: next.map((id, i) => ({ id, order_index: i })) });
  };

  const openModuleModal = (type: ModuleAction['type'], record: any = null) => {
    setModuleAction({ type, record });
    setModuleForm(record
      ? { title: record.title, description: record.description || '', start_date: record.start_date || '', end_date: record.end_date || '' }
      : { title: '', description: '', start_date: '', end_date: '' }
    );
  };

  // ── Save module — handles new course creation if needed ──
  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...moduleForm,
      start_date: moduleForm.start_date || undefined,
      end_date: moduleForm.end_date || undefined,
    };

    // If course not saved yet, auto-save it first then create module, then navigate
    if (isNew) {
      let realCourseId: string;
      try {
        const res = await createCourse({
          course: {
            title: form.title.trim() || 'Novo Curso',
            description: form.description,
            start_date: form.start_date || null,
            end_date: form.end_date || null,
            target_audience: form.target_audience,
            status: form.status,
            thumbnail_url: null,
          },
          disciplineIds: selectedDisciplineIds,
          gradeIds: selectedGradeIds,
          projectIds: selectedProjectIds,
        });
        realCourseId = (res as any).id;
      } catch (err) {
        console.error(err);
        alert('Erro ao salvar o curso.');
        return;
      }

      try {
        await createModuleAsync({ course_id: realCourseId, ...payload, order_index: 0 });
      } catch (err) {
        console.error(err);
        alert('Erro ao criar módulo.');
        return;
      }

      setModuleAction({ type: null, record: null });
      // Navigate AFTER both operations complete
      router.replace(`/admin/cursos/${realCourseId}#modules`);
      return;
    }

    try {
      if (moduleAction.type === 'create') {
        await createModuleAsync({ course_id: courseId, ...payload, order_index: modules.length });
      } else if (moduleAction.type === 'edit' && moduleAction.record) {
        await updateModuleAsync({ id: moduleAction.record.id, courseId, payload });
      }
      setModuleAction({ type: null, record: null });
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar módulo.');
    }
  };

  const handleDeleteModule = () => {
    if (!moduleAction.record?.id) return;
    deleteModule(
      { id: moduleAction.record.id, courseId },
      { onSuccess: () => setModuleAction({ type: null, record: null }) }
    );
  };

  const isSaving = isCreating || isUpdating || isUploading;

  return (
    <div className="p-8 pb-32">
      <SavedToast visible={savedToast} />

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={() => router.push('/admin/cursos')}
          className="p-2.5 bg-white rounded-xl shadow border border-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-800 truncate">
              {isNew ? 'Criar Novo Curso' : (form.title || 'Carregando...')}
            </h1>
            <p className="text-slate-500 text-sm">EAD — Trilhas de aprendizagem</p>
          </div>
          {!isNew && courseData && (
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${STATUS_BADGE[courseData.status] || STATUS_BADGE.draft}`}>
              {STATUS_LABEL[courseData.status] || courseData.status}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 mb-8">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2
            ${activeTab === 'info' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <GraduationCap className="w-4 h-4" /> Informações do Curso
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('modules')}
          className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2
            ${activeTab === 'modules' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <BookOpen className="w-4 h-4" /> Módulos &amp; Trilha
          {modules.length > 0 && (
            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black">
              {modules.length}
            </span>
          )}
        </button>
      </div>

      {/* ── TAB: Informações ── */}
      {activeTab === 'info' && (
        <div className="max-w-3xl">
          <form onSubmit={handleSaveInfo} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Thumbnail */}
              <div className="lg:col-span-1">
                <Card className="p-4 flex flex-col items-center gap-3">
                  <div
                    onClick={() => thumbRef.current?.click()}
                    className="w-full aspect-video rounded-xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center relative group cursor-pointer"
                  >
                    {thumbPreview
                      ? <img src={thumbPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                      : <div className="flex flex-col items-center gap-2 text-slate-400">
                          <ImageIcon className="w-8 h-8" />
                          <span className="text-xs text-center">Capa 16:9</span>
                        </div>
                    }
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                      <UploadCloud className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <input
                    type="file" accept="image/*" ref={thumbRef} className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) { setThumbFile(f); setThumbPreview(URL.createObjectURL(f)); }
                    }}
                  />
                  <p className="text-xs text-slate-500 text-center">Clique para alterar a capa.</p>
                </Card>
              </div>

              {/* Main fields */}
              <div className="lg:col-span-2 space-y-4">
                <InputField
                  label="Título do Curso *"
                  placeholder="Ex: Preparação SAEB — 5º Ano"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  required
                />
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Descrição</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={3}
                    placeholder="Descreva os objetivos do curso..."
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Data de Início" type="date" value={form.start_date}
                onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
              <InputField label="Data de Encerramento" type="date" value={form.end_date}
                onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Público-Alvo *" options={AUDIENCE_OPTIONS} value={form.target_audience}
                onChange={e => setForm(p => ({ ...p, target_audience: e.target.value }))} required />
              <SelectField label="Status *" options={STATUS_OPTIONS} value={form.status}
                onChange={e => setForm(p => ({ ...p, status: e.target.value }))} required />
            </div>

            <MultiDisciplineSelect
              disciplines={disciplines}
              selected={selectedDisciplineIds}
              onChange={setSelectedDisciplineIds}
            />

            {/* Grades */}
            {grades.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Séries Atendidas</label>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="max-h-40 overflow-y-auto divide-y divide-slate-50">
                    {grades.map((g: any) => {
                      const ch = selectedGradeIds.includes(g.id);
                      return (
                        <label key={g.id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors ${ch ? 'bg-emerald-50/60' : ''}`}>
                          <input type="checkbox" checked={ch}
                            onChange={() => setSelectedGradeIds(prev => ch ? prev.filter(x => x !== g.id) : [...prev, g.id])}
                            className="w-4 h-4 rounded accent-emerald-500" />
                          <span className={`text-sm font-medium ${ch ? 'text-emerald-700' : 'text-slate-700'}`}>{g.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Projects */}
            {projects.length > 0 && (
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-2">
                  <FolderKanban className="w-4 h-4 text-amber-500" /> Projetos Vinculados
                </label>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="max-h-36 overflow-y-auto divide-y divide-slate-50">
                    {projects.map((p: any) => {
                      const ch = selectedProjectIds.includes(p.id);
                      return (
                        <label key={p.id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors ${ch ? 'bg-amber-50/60' : ''}`}>
                          <input type="checkbox" checked={ch}
                            onChange={() => setSelectedProjectIds(prev => ch ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                            className="w-4 h-4 rounded accent-amber-500" />
                          <span className={`text-sm font-medium ${ch ? 'text-amber-700' : 'text-slate-700'}`}>{p.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button type="submit" loading={isSaving} disabled={!form.title.trim() || isSaving}>
                {isNew ? 'Salvar e ir para Módulos' : 'Salvar Informações'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB: Módulos ── */}
      {activeTab === 'modules' && (
        <div className="max-w-3xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Módulos do Curso</h2>
              <p className="text-sm text-slate-500">Arraste para reordenar. Expanda para gerenciar a trilha.</p>
            </div>
            <button
              type="button"
              onClick={() => openModuleModal('create')}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold shadow hover:bg-emerald-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" /> Novo Módulo
            </button>
          </div>

          {loadingModules ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : modules.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="w-12 h-12 text-slate-200 mb-4" />
              <p className="font-semibold text-slate-600 mb-1">Nenhum módulo ainda</p>
              <p className="text-sm text-slate-400 mb-5">Crie o primeiro módulo e monte a trilha.</p>
              <button
                type="button"
                onClick={() => openModuleModal('create')}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm"
              >
                <Plus className="w-4 h-4" /> Criar Primeiro Módulo
              </button>
            </Card>
          ) : (
            <div className="space-y-2">
              {modules.map((mod: any, idx: number) => {
                const isExpanded = expandedId === mod.id;
                return (
                  <div
                    key={mod.id}
                    draggable
                    onDragStart={() => handleModuleDragStart(idx)}
                    onDragOver={e => handleModuleDragOver(e, idx)}
                    onDrop={e => handleModuleDrop(e, idx)}
                    onDragEnd={() => { setDragModuleIdx(null); setDragModuleOver(null); }}
                    className={`border rounded-xl overflow-hidden bg-white shadow-sm transition-all
                      ${dragModuleIdx === idx ? 'opacity-40 scale-[0.99]' : ''}
                      ${dragModuleOver === idx && dragModuleIdx !== idx ? 'border-emerald-400 shadow-emerald-100' : 'border-slate-200'}
                    `}
                  >
                    <div className="flex items-center gap-2 px-3 py-3">
                      <GripVertical className="w-4 h-4 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing shrink-0" />
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black shrink-0">
                        {idx + 1}
                      </div>
                      <button
                        type="button"
                        className="flex-1 flex items-center gap-2 text-left min-w-0"
                        onClick={() => setExpandedId(isExpanded ? null : mod.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-sm">{mod.title}</p>
                          {(mod.start_date || mod.end_date) && (
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3" />
                              {mod.start_date ? new Date(mod.start_date + 'T00:00:00').toLocaleDateString('pt-BR') : '?'} →{' '}
                              {mod.end_date ? new Date(mod.end_date + 'T00:00:00').toLocaleDateString('pt-BR') : '?'}
                            </p>
                          )}
                        </div>
                        {isExpanded
                          ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                          : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                        }
                      </button>
                      <button
                        type="button"
                        onClick={() => openModuleModal('edit', mod)}
                        className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openModuleModal('delete', mod)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {isExpanded && <ModuleTrail moduleId={mod.id} courseId={courseId} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Module Form Modal ── */}
      <Modal
        isOpen={moduleAction.type === 'create' || moduleAction.type === 'edit'}
        onClose={() => setModuleAction({ type: null, record: null })}
        title={moduleAction.type === 'edit' ? 'Editar Módulo' : 'Novo Módulo'}
      >
        <form onSubmit={handleSaveModule} className="space-y-4">
          <InputField
            label="Título do Módulo *"
            placeholder="Ex: Módulo 1 — Fundamentos"
            value={moduleForm.title}
            onChange={e => setModuleForm(p => ({ ...p, title: e.target.value }))}
            required
            autoFocus
          />
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Descrição</label>
            <textarea
              value={moduleForm.description}
              onChange={e => setModuleForm(p => ({ ...p, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Data de Início" type="date" value={moduleForm.start_date}
              onChange={e => setModuleForm(p => ({ ...p, start_date: e.target.value }))} />
            <InputField label="Data de Encerramento" type="date" value={moduleForm.end_date}
              onChange={e => setModuleForm(p => ({ ...p, end_date: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModuleAction({ type: null, record: null })}>
              Cancelar
            </Button>
            <Button type="submit" loading={isCreatingModule || isUpdatingModule || isCreating} disabled={!moduleForm.title.trim()}>
              {moduleAction.type === 'edit' ? 'Salvar Módulo' : 'Criar Módulo'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Module Delete Modal ── */}
      <Modal
        isOpen={moduleAction.type === 'delete'}
        onClose={() => setModuleAction({ type: null, record: null })}
        title="Excluir Módulo"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-200">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">
              Excluir <strong>"{moduleAction.record?.title}"</strong>? Os itens da trilha serão removidos.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModuleAction({ type: null, record: null })}>Cancelar</Button>
            <Button onClick={handleDeleteModule} loading={isDeletingModule} className="bg-red-600 hover:bg-red-700 text-white">
              Sim, Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
