'use client';

import { Suspense, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import type { LessonPlan } from '../types';
import {
  ArrowLeft, Save, Bold, Italic, Strikethrough,
  List, ListOrdered, CheckSquare, Table2,
  Heading1, Heading2, Heading3,
  Undo2, Redo2, Minus, Quote,
  Highlighter, AlignLeft, Clock, CheckCircle2,
  FileText, Layers, ChevronDown, Type,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Templates
// ─────────────────────────────────────────────────────────────
const TEMPLATE_PLANO_AULA = `
<h1>Plano de Aula</h1>
<h2>🏷️ Identificação</h2>
<table>
  <tbody>
    <tr><td><strong>Título</strong></td><td>Digite o título</td></tr>
    <tr><td><strong>Disciplina</strong></td><td></td></tr>
    <tr><td><strong>Série / Ano</strong></td><td></td></tr>
    <tr><td><strong>Tempo estimado</strong></td><td></td></tr>
    <tr><td><strong>Professor(a)</strong></td><td></td></tr>
  </tbody>
</table>
<h2>🎯 Objetivos</h2>
<p>Descreva os objetivos da aula:</p>
<ul><li></li></ul>
<h2>📌 Habilidades (BNCC)</h2>
<ul><li>(EF...)</li></ul>
<h2>📚 Conteúdos</h2>
<ul><li></li></ul>
<h2>🧩 Metodologia</h2>
<ol>
  <li>Introdução...</li>
  <li>Desenvolvimento...</li>
  <li>Prática...</li>
  <li>Encerramento...</li>
</ol>
<h2>🧪 Recursos Didáticos</h2>
<ul><li></li></ul>
<h2>📊 Avaliação</h2>
<table>
  <thead><tr><th>Critério</th><th>Descrição</th></tr></thead>
  <tbody>
    <tr><td>Participação</td><td></td></tr>
    <tr><td>Compreensão</td><td></td></tr>
  </tbody>
</table>
<h2>🧑‍🤝‍🧑 Adaptações</h2>
<ul><li></li></ul>
<h2>🔗 Referências</h2>
<ul><li></li></ul>
<h2>📝 Observações</h2>
<p></p>
`;

const TEMPLATE_SEQUENCIA = `
<h1>Sequência Didática</h1>
<h2>🏷️ Identificação</h2>
<table>
  <tbody>
    <tr><td><strong>Título</strong></td><td>Digite o título</td></tr>
    <tr><td><strong>Disciplina</strong></td><td></td></tr>
    <tr><td><strong>Série / Ano</strong></td><td></td></tr>
    <tr><td><strong>Nº de aulas</strong></td><td></td></tr>
    <tr><td><strong>Tempo total</strong></td><td></td></tr>
  </tbody>
</table>
<h2>🎯 Objetivos</h2>
<ul><li></li></ul>
<h2>📌 Habilidades (BNCC)</h2>
<ul><li>(EF...)</li></ul>
<h2>📋 Estrutura das Aulas</h2>
<table>
  <thead><tr><th>Aula</th><th>Tema</th><th>Atividade</th><th>Duração</th></tr></thead>
  <tbody>
    <tr><td>1</td><td></td><td></td><td></td></tr>
    <tr><td>2</td><td></td><td></td><td></td></tr>
    <tr><td>3</td><td></td><td></td><td></td></tr>
  </tbody>
</table>
<h2>🧩 Metodologias Ativas</h2>
<ul><li></li></ul>
<h2>🧪 Recursos Didáticos</h2>
<ul><li></li></ul>
<h2>📊 Avaliação</h2>
<table>
  <thead><tr><th>Momento</th><th>Instrumento</th><th>Critério</th></tr></thead>
  <tbody>
    <tr><td>Diagnóstica</td><td></td><td></td></tr>
    <tr><td>Formativa</td><td></td><td></td></tr>
    <tr><td>Somativa</td><td></td><td></td></tr>
  </tbody>
</table>
<h2>🔗 Referências</h2>
<ul><li></li></ul>
<h2>📝 Observações</h2>
<p></p>
`;

const STORAGE_KEY = 'kodar_lesson_plans';

function loadPlan(id: string): LessonPlan | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const plans = JSON.parse(raw) as LessonPlan[];
    return plans.find((p) => p.id === id) ?? null;
  } catch { return null; }
}

function savePlan(plan: LessonPlan) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const plans: LessonPlan[] = raw ? JSON.parse(raw) : [];
    const next = plans.map((p) => p.id === plan.id ? plan : p);
    if (!next.find((p) => p.id === plan.id)) next.unshift(plan);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch { /* ignore */ }
}

// ─────────────────────────────────────────────────────────────
// Tiptap editor styles (injected as a <style> tag)
// ─────────────────────────────────────────────────────────────
const EDITOR_STYLES = `
.ProseMirror {
  outline: none;
  min-height: 100%;
}
.ProseMirror > * + * { margin-top: 0.75em; }
.ProseMirror h1 { font-size: 2rem; font-weight: 800; color: #0f172a; margin-top: 1.5em; margin-bottom: 0.5em; }
.ProseMirror h2 { font-size: 1.35rem; font-weight: 700; color: #1e293b; margin-top: 1.5em; margin-bottom: 0.4em; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.25em; }
.ProseMirror h3 { font-size: 1.1rem; font-weight: 600; color: #334155; margin-top: 1.25em; margin-bottom: 0.35em; }
.ProseMirror p { color: #334155; line-height: 1.75; font-size: 0.9375rem; }
.ProseMirror ul, .ProseMirror ol { padding-left: 1.5rem; }
.ProseMirror ul li, .ProseMirror ol li { color: #334155; line-height: 1.75; font-size: 0.9375rem; margin-bottom: 0.25em; }
.ProseMirror ul { list-style-type: disc; }
.ProseMirror ol { list-style-type: decimal; }
.ProseMirror strong { font-weight: 700; color: #0f172a; }
.ProseMirror em { font-style: italic; }
.ProseMirror s { text-decoration: line-through; color: #94a3b8; }
.ProseMirror blockquote { border-left: 4px solid #6366f1; padding-left: 1rem; margin-left: 0; color: #64748b; font-style: italic; background: #f8f9ff; border-radius: 0 8px 8px 0; padding: 0.75rem 1rem; }
.ProseMirror code { background: #f1f5f9; padding: 0.15em 0.4em; border-radius: 4px; font-family: ui-monospace, monospace; font-size: 0.85em; color: #6366f1; }
.ProseMirror pre { background: #0f172a; border-radius: 8px; padding: 1rem; overflow-x: auto; }
.ProseMirror pre code { background: none; color: #e2e8f0; font-size: 0.875em; }
.ProseMirror hr { border: none; border-top: 2px solid #e2e8f0; margin: 2em 0; }
.ProseMirror mark { background: #fef08a; border-radius: 2px; padding: 0.05em 0.15em; }
.ProseMirror table { border-collapse: collapse; width: 100%; margin: 1.5em 0; border-radius: 8px; overflow: hidden; box-shadow: 0 0 0 1px #e2e8f0; }
.ProseMirror table td, .ProseMirror table th { border: 1px solid #e2e8f0; padding: 0.6rem 0.9rem; text-align: left; font-size: 0.875rem; min-width: 100px; }
.ProseMirror table th { background: #f8fafc; font-weight: 700; color: #334155; }
.ProseMirror table tr:nth-child(even) td { background: #fafafa; }
.ProseMirror table .selectedCell:after { background: #e0e7ff; content: ""; left: 0; right: 0; top: 0; bottom: 0; pointer-events: none; position: absolute; z-index: 2; }
.ProseMirror ul[data-type="taskList"] { list-style: none; padding: 0; }
.ProseMirror ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5rem; }
.ProseMirror ul[data-type="taskList"] li > label { margin-top: 0.2rem; cursor: pointer; }
.ProseMirror ul[data-type="taskList"] li > label input { accent-color: #6366f1; width: 1rem; height: 1rem; }
.ProseMirror ul[data-type="taskList"] li[data-checked="true"] > div { text-decoration: line-through; color: #94a3b8; }
.ProseMirror .is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: #94a3b8; pointer-events: none; height: 0; font-style: italic; }
`;

// ─────────────────────────────────────────────────────────────
// Toolbar Button
// ─────────────────────────────────────────────────────────────
function ToolBtn({
  onClick, active = false, disabled = false, title, children,
}: {
  onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        active
          ? 'bg-indigo-100 text-indigo-700'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-slate-200 mx-1 shrink-0" />;
}

// ─────────────────────────────────────────────────────────────
// Heading dropdown
// ─────────────────────────────────────────────────────────────
function HeadingDropdown({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!editor) return null;

  const current =
    editor.isActive('heading', { level: 1 }) ? 'H1'
    : editor.isActive('heading', { level: 2 }) ? 'H2'
    : editor.isActive('heading', { level: 3 }) ? 'H3'
    : 'Texto';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 h-7 px-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
      >
        <Type className="h-3.5 w-3.5" />
        <span>{current}</span>
        <ChevronDown className="h-3 w-3 text-slate-400" />
      </button>
      {open && (
        <div className="absolute top-9 left-0 z-50 bg-white rounded-xl shadow-lg border border-slate-100 py-1 w-36 overflow-hidden">
          {[
            { label: 'Texto normal', action: () => editor.chain().focus().setParagraph().run(), active: editor.isActive('paragraph') },
            { label: 'Heading 1',   action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive('heading', { level: 1 }) },
            { label: 'Heading 2',   action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
            { label: 'Heading 3',   action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }) },
          ].map(({ label, action, active }) => (
            <button
              key={label}
              type="button"
              onClick={() => { action(); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${active ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Toolbar
// ─────────────────────────────────────────────────────────────
function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> | null }) {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-0.5 px-4 py-2 bg-white border-b border-slate-100 flex-wrap">
      {/* Undo / Redo */}
      <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Desfazer (Ctrl+Z)">
        <Undo2 className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Refazer (Ctrl+Y)">
        <Redo2 className="h-3.5 w-3.5" />
      </ToolBtn>

      <Divider />

      {/* Heading dropdown */}
      <HeadingDropdown editor={editor} />

      <Divider />

      {/* Inline formatting */}
      <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Negrito (Ctrl+B)">
        <Bold className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Itálico (Ctrl+I)">
        <Italic className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Tachado">
        <Strikethrough className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Destacar">
        <Highlighter className="h-3.5 w-3.5" />
      </ToolBtn>

      <Divider />

      {/* Lists */}
      <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista">
        <List className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerada">
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="Lista de tarefas">
        <CheckSquare className="h-3.5 w-3.5" />
      </ToolBtn>

      <Divider />

      {/* Blocks */}
      <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Citação">
        <Quote className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Linha horizontal">
        <Minus className="h-3.5 w-3.5" />
      </ToolBtn>

      <Divider />

      {/* Table */}
      <ToolBtn
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        title="Inserir tabela"
      >
        <Table2 className="h-3.5 w-3.5" />
      </ToolBtn>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Word count
// ─────────────────────────────────────────────────────────────
function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ─────────────────────────────────────────────────────────────
// Editor content
// ─────────────────────────────────────────────────────────────
function EditorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('id');

  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [wordCountVal, setWordCountVal] = useState(0);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load plan from localStorage
  useEffect(() => {
    if (!planId) return;
    const loaded = loadPlan(planId);
    setPlan(loaded);
  }, [planId]);

  const handleSave = useCallback((content: Record<string, unknown>, text: string) => {
    if (!plan) return;
    const updated: LessonPlan = { ...plan, content: content, updated_at: new Date().toISOString() };
    setPlan(updated);
    savePlan(updated);
    setSaveStatus('saved');
    setWordCountVal(wordCount(text));
  }, [plan]);

  const template = plan?.tipo_documento === 'sequencia_didatica' ? TEMPLATE_SEQUENCIA : TEMPLATE_PLANO_AULA;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Highlight,
      Placeholder.configure({ placeholder: 'Comece a escrever seu plano...' }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: plan?.content
      ? plan.content
      : (plan ? template : ''),
    onUpdate: ({ editor: e }) => {
      setSaveStatus('unsaved');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        setSaveStatus('saving');
        handleSave(e.getJSON() as Record<string, unknown>, e.getText());
      }, 1500);
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none',
      },
    },
  }, [plan?.id]);

  // Cleanup timer
  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); }, []);

  // Keyboard save: Ctrl+S
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (editor) {
          setSaveStatus('saving');
          handleSave(editor.getJSON() as Record<string, unknown>, editor.getText());
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [editor, handleSave]);

  if (!planId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-500">Nenhum plano selecionado.</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Carregando plano...</p>
        </div>
      </div>
    );
  }

  const tipoLabel = plan.tipo_documento === 'plano_aula' ? 'Plano de Aula' : 'Sequência Didática';
  const TipoIcon  = plan.tipo_documento === 'plano_aula' ? FileText : Layers;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-50">
      <style>{EDITOR_STYLES}</style>

      {/* ── Top bar ── */}
      <header className="flex items-center gap-4 px-6 py-3 bg-white border-b border-slate-100 shadow-sm shrink-0">
        <button
          onClick={() => router.push('/admin/gestao-conteudos/planos-aula')}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <div className="w-px h-5 bg-slate-200 shrink-0" />

        {/* Plan info */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 ${plan.tipo_documento === 'plano_aula' ? 'bg-indigo-50' : 'bg-violet-50'}`}>
            <TipoIcon className={`h-3.5 w-3.5 ${plan.tipo_documento === 'plano_aula' ? 'text-indigo-600' : 'text-violet-600'}`} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{plan.title}</p>
            <p className="text-[11px] text-slate-400">{tipoLabel}{plan.disciplina ? ` · ${plan.disciplina}` : ''}{plan.serie ? ` · ${plan.serie}` : ''}</p>
          </div>
        </div>

        {/* Status + stats */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px] text-slate-400 hidden sm:block">
            {wordCountVal} palavras
          </span>

          <div className="flex items-center gap-1.5 text-xs">
            {saveStatus === 'saved'   && <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /><span className="text-emerald-600 font-medium">Salvo</span></>}
            {saveStatus === 'saving'  && <><div className="h-3 w-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /><span className="text-indigo-600 font-medium">Salvando...</span></>}
            {saveStatus === 'unsaved' && <><Clock className="h-3.5 w-3.5 text-amber-500" /><span className="text-amber-600 font-medium">Não salvo</span></>}
          </div>

          <button
            onClick={() => {
              if (editor) {
                setSaveStatus('saving');
                handleSave(editor.getJSON() as Record<string, unknown>, editor.getText());
              }
            }}
            className="flex items-center gap-2 px-4 py-1.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            Salvar
          </button>
        </div>
      </header>

      {/* ── Toolbar ── */}
      <Toolbar editor={editor} />

      {/* ── Editor area ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-12">
          <EditorContent editor={editor} className="min-h-[calc(100vh-200px)]" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Page export — Suspense required for useSearchParams
// ─────────────────────────────────────────────────────────────
export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <EditorPageContent />
    </Suspense>
  );
}
