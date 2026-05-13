'use client';

import { useState, useRef, useCallback } from 'react';
import {
  useHabilidades, useCreateHabilidade, useUpdateHabilidade,
  useDeleteHabilidade, useImportHabilidades,
} from '@/hooks/useAdminData';
import { HeroSummary } from '@/components/ui/HeroSummary';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import InputField from '@/components/ui/InputField';
import {
  Sparkles, Plus, Search, Edit2, Trash2, AlertTriangle,
  Upload, ChevronDown, X, CheckCircle2, FileText,
} from 'lucide-react';

// ─── Disciplinas fixas do CSV ──────────────────────────────────
const DISCIPLINAS = [
  'Arte', 'Ciências', 'Educação Física', 'Educação Infantil',
  'Geografia', 'História', 'Língua Inglesa', 'Língua Portuguesa', 'Matemática',
];

// ─── Etapas mapeadas pelo prefixo do código BNCC ──────────────
const ETAPAS: { value: string; label: string; group: string }[] = [
  { value: 'EI01', label: 'EI01 — Bebês (0–1a6m)',                    group: 'Educação Infantil' },
  { value: 'EI02', label: 'EI02 — Crianças bem pequenas (1a7m–3a11m)', group: 'Educação Infantil' },
  { value: 'EI03', label: 'EI03 — Crianças pequenas (4a–5a11m)',       group: 'Educação Infantil' },
  { value: 'EF01', label: 'EF01 — 1º Ano',    group: 'Ensino Fundamental' },
  { value: 'EF02', label: 'EF02 — 2º Ano',    group: 'Ensino Fundamental' },
  { value: 'EF03', label: 'EF03 — 3º Ano',    group: 'Ensino Fundamental' },
  { value: 'EF04', label: 'EF04 — 4º Ano',    group: 'Ensino Fundamental' },
  { value: 'EF05', label: 'EF05 — 5º Ano',    group: 'Ensino Fundamental' },
  { value: 'EF06', label: 'EF06 — 6º Ano',    group: 'Ensino Fundamental' },
  { value: 'EF07', label: 'EF07 — 7º Ano',    group: 'Ensino Fundamental' },
  { value: 'EF08', label: 'EF08 — 8º Ano',    group: 'Ensino Fundamental' },
  { value: 'EF09', label: 'EF09 — 9º Ano',    group: 'Ensino Fundamental' },
  { value: 'EF12', label: 'EF12 — 1º e 2º Anos',      group: 'Ensino Fundamental (faixas)' },
  { value: 'EF15', label: 'EF15 — 1º ao 5º Ano',      group: 'Ensino Fundamental (faixas)' },
  { value: 'EF35', label: 'EF35 — 3º ao 5º Ano',      group: 'Ensino Fundamental (faixas)' },
  { value: 'EF67', label: 'EF67 — 6º e 7º Anos',      group: 'Ensino Fundamental (faixas)' },
  { value: 'EF69', label: 'EF69 — 6º ao 9º Ano',      group: 'Ensino Fundamental (faixas)' },
  { value: 'EF89', label: 'EF89 — 8º e 9º Anos',      group: 'Ensino Fundamental (faixas)' },
];

// ─── CSV Parser ───────────────────────────────────────────────
function parseCSV(text: string): { code: string; description: string; disciplina: string; objeto_conhecimento: string }[] {
  const lines = text.split('\n');
  const results: { code: string; description: string; disciplina: string; objeto_conhecimento: string }[] = [];

  let i = 1; // skip header
  while (i < lines.length) {
    let line = lines[i];
    if (!line.trim()) { i++; continue; }

    // Handle multi-line quoted fields
    while ((line.match(/"/g) || []).length % 2 !== 0 && i + 1 < lines.length) {
      i++;
      line += '\n' + lines[i];
    }

    const cols = parseCSVLine(line);
    if (cols.length >= 4 && cols[1]?.trim()) {
      results.push({
        description: cols[0]?.trim() || '',
        code:        cols[1]?.trim() || '',
        disciplina:  cols[2]?.trim() || '',
        objeto_conhecimento: cols[3]?.trim() || '',
      });
    }
    i++;
  }
  return results;
}

function parseCSVLine(line: string): string[] {
  const cols: string[] = [];
  let cur = '';
  let inQuote = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      cols.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  cols.push(cur);
  return cols;
}

// ─── Form initial state ───────────────────────────────────────
const EMPTY_FORM = { code: '', description: '', disciplina: '', objeto_conhecimento: '' };

export default function HabilidadesPage() {
  const [page, setPage]           = useState(1);
  const limit = 50;
  const [search, setSearch]             = useState('');
  const [filterDisc, setFilterDisc]     = useState('');
  const [filterEtapa, setFilterEtapa]   = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<NodeJS.Timeout>();

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedSearch(val); setPage(1); }, 350);
  };

  const { data: response, isLoading } = useHabilidades(
    { keyword: debouncedSearch || undefined, disciplina: filterDisc || undefined, etapa: filterEtapa || undefined },
    page, limit
  );
  const rows = response?.data || [];
  const totalPages = response?.count ? Math.ceil(response.count / limit) : 1;

  const { mutateAsync: createHab, isPending: isCreating } = useCreateHabilidade();
  const { mutateAsync: updateHab, isPending: isUpdating } = useUpdateHabilidade();
  const { mutate: deleteHab, isPending: isDeleting }      = useDeleteHabilidade();
  const { mutateAsync: importHabs, isPending: isImporting } = useImportHabilidades();

  // ── Modal state ──
  type ModalType = 'create' | 'edit' | 'delete' | 'import' | null;
  const [modal, setModal]   = useState<ModalType>(null);
  const [target, setTarget] = useState<any>(null);
  const [form, setForm]     = useState({ ...EMPTY_FORM });

  const openCreate = () => { setForm({ ...EMPTY_FORM }); setTarget(null); setModal('create'); };
  const openEdit   = (row: any) => { setForm({ code: row.code, description: row.description, disciplina: row.disciplina || '', objeto_conhecimento: row.objeto_conhecimento || '' }); setTarget(row); setModal('edit'); };
  const openDelete = (row: any) => { setTarget(row); setModal('delete'); };
  const closeModal = () => { setModal(null); setTarget(null); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modal === 'create') await createHab(form);
      else if (modal === 'edit') await updateHab({ id: target.id, payload: form });
      closeModal();
    } catch (err: any) { alert(err?.message || 'Erro ao salvar.'); }
  };

  const handleDelete = () => {
    if (!target?.id) return;
    deleteHab(target.id, { onSuccess: closeModal });
  };

  // ── Import ──
  const fileRef = useRef<HTMLInputElement>(null);
  const [importPreview, setImportPreview] = useState<{ code: string; description: string; disciplina: string; objeto_conhecimento: string }[]>([]);
  const [importFile, setImportFile]       = useState<string>('');
  const [importDone, setImportDone]       = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file.name);
    setImportDone(0);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      setImportPreview(parsed);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleImport = async () => {
    if (!importPreview.length) return;
    try {
      const count = await importHabs(importPreview);
      setImportDone(count);
      setImportPreview([]);
      setImportFile('');
      if (fileRef.current) fileRef.current.value = '';
    } catch (err: any) { alert(err?.message || 'Erro na importação.'); }
  };

  const discPreview = importPreview.reduce<Record<string, number>>((acc, r) => {
    acc[r.disciplina] = (acc[r.disciplina] || 0) + 1; return acc;
  }, {});

  return (
    <div className="p-8 pb-32">
      <HeroSummary
        title="Habilidades (BNCC)"
        description="Gerencie as habilidades da Base Nacional Curricular por disciplina e objeto de conhecimento."
        icon={<Sparkles className="w-8 h-8 text-white" />}
        themeClass="bg-sky-600"
      >
        <div className="flex gap-2">
          <button
            onClick={() => { setImportDone(0); setImportPreview([]); setImportFile(''); setModal('import'); }}
            className="flex items-center gap-2 bg-white/20 text-white border border-white/30 px-4 py-3 rounded-xl font-bold hover:bg-white/30 transition-colors text-sm"
          >
            <Upload className="w-4 h-4" /> Importar CSV
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-white text-sky-600 px-5 py-3 rounded-xl font-bold shadow hover:bg-slate-50 transition-colors"
          >
            <Plus className="w-5 h-5" /> Nova Habilidade
          </button>
        </div>
      </HeroSummary>

      {/* Filters */}
      <Card className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Pesquisar por código ou descrição..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
        </div>
        <div className="relative min-w-[180px]">
          <select
            value={filterDisc}
            onChange={e => { setFilterDisc(e.target.value); setPage(1); }}
            className="w-full appearance-none pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-700"
          >
            <option value="">Todas as disciplinas</option>
            {DISCIPLINAS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>

        <div className="relative min-w-[210px]">
          <select
            value={filterEtapa}
            onChange={e => { setFilterEtapa(e.target.value); setPage(1); }}
            className="w-full appearance-none pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-700"
          >
            <option value="">Todas as etapas</option>
            {['Educação Infantil', 'Ensino Fundamental', 'Ensino Fundamental (faixas)'].map(group => (
              <optgroup key={group} label={group}>
                {ETAPAS.filter(e => e.group === group).map(e => (
                  <option key={e.value} value={e.value}>{e.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>

        {(search || filterDisc || filterEtapa) && (
          <button onClick={() => { handleSearch(''); setFilterDisc(''); setFilterEtapa(''); setPage(1); }}
            className="text-xs text-slate-500 hover:text-red-500 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
            Limpar
          </button>
        )}
        {response?.count !== undefined && (
          <span className="ml-auto text-xs text-slate-400 font-medium">{response.count} habilidade{response.count !== 1 ? 's' : ''}</span>
        )}
      </Card>

      <Table
        isLoading={isLoading}
        data={rows}
        emptyMessage="Nenhuma habilidade encontrada. Importe o CSV ou crie manualmente."
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        columns={[
          {
            header: 'Código',
            accessor: (row: any) => (
              <span className="px-2 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-xs font-bold font-mono">
                {row.code}
              </span>
            ),
            className: 'w-32',
          },
          {
            header: 'Descrição',
            accessor: (row: any) => (
              <p className="text-sm text-slate-700 line-clamp-2 max-w-xl">{row.description}</p>
            ),
          },
          {
            header: 'Disciplina',
            accessor: (row: any) => row.disciplina
              ? <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold">{row.disciplina}</span>
              : <span className="text-slate-400 text-xs">—</span>,
            className: 'w-44',
          },
          {
            header: 'Objeto de Conhecimento',
            accessor: (row: any) => (
              <span className="text-xs text-slate-500 line-clamp-1">{row.objeto_conhecimento || '—'}</span>
            ),
            className: 'w-56',
          },
          {
            header: 'Ações',
            accessor: (row: any) => (
              <div className="flex items-center justify-end gap-1">
                <button onClick={() => openEdit(row)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-lg transition-colors">
                  <Edit2 className="w-3.5 h-3.5" /> Editar
                </button>
                <button onClick={() => openDelete(row)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </button>
              </div>
            ),
            className: 'w-40 text-right',
          },
        ]}
      />

      {/* ── Create / Edit Modal ── */}
      <Modal
        isOpen={modal === 'create' || modal === 'edit'}
        onClose={closeModal}
        title={modal === 'edit' ? 'Editar Habilidade' : 'Nova Habilidade'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Código *" placeholder="Ex: EF15LP01" value={form.code}
              onChange={e => setForm(p => ({ ...p, code: e.target.value }))} required autoFocus />
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Disciplina</label>
              <div className="relative">
                <select value={form.disciplina} onChange={e => setForm(p => ({ ...p, disciplina: e.target.value }))}
                  className="w-full appearance-none pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500">
                  <option value="">— nenhuma —</option>
                  {DISCIPLINAS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Descrição *</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={4} required placeholder="Descreva a habilidade..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none" />
          </div>
          <InputField label="Objeto de Conhecimento" placeholder="Ex: Estratégia de leitura"
            value={form.objeto_conhecimento}
            onChange={e => setForm(p => ({ ...p, objeto_conhecimento: e.target.value }))} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" loading={isCreating || isUpdating} disabled={!form.code.trim() || !form.description.trim()}>
              {modal === 'edit' ? 'Salvar' : 'Criar Habilidade'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Modal ── */}
      <Modal isOpen={modal === 'delete'} onClose={closeModal} title="Excluir Habilidade">
        <div className="space-y-4">
          <div className="flex items-start gap-3 text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-200">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">
              Excluir a habilidade <strong>{target?.code}</strong>? Questões que a referenciam não serão afetadas.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={closeModal}>Cancelar</Button>
            <Button onClick={handleDelete} loading={isDeleting} className="bg-red-600 hover:bg-red-700 text-white">
              Sim, Excluir
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Import Modal ── */}
      <Modal isOpen={modal === 'import'} onClose={closeModal} title="Importar Habilidades via CSV">
        <div className="space-y-5">
          {importDone > 0 ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              <p className="font-bold text-slate-800 text-lg">{importDone} habilidades importadas!</p>
              <p className="text-sm text-slate-500">Os dados já estão disponíveis na listagem.</p>
              <Button onClick={closeModal}>Fechar</Button>
            </div>
          ) : (
            <>
              {/* Format info */}
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-xs text-sky-700">
                <p className="font-bold mb-1 flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Formato esperado do CSV:</p>
                <code className="block bg-white rounded-lg px-2 py-1 border border-sky-100 font-mono text-[11px]">
                  descricao,codigo,disciplina,objeto_conhecimento
                </code>
              </div>

              {/* File picker */}
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-sky-400 hover:bg-sky-50/50 transition-colors"
              >
                <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                {importFile
                  ? <p className="font-semibold text-slate-700 text-sm">{importFile}</p>
                  : <p className="text-sm text-slate-400">Clique para selecionar o arquivo CSV</p>
                }
                <input type="file" accept=".csv,text/csv" ref={fileRef} className="hidden" onChange={handleFileChange} />
              </div>

              {/* Preview */}
              {importPreview.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-700 text-sm">
                      <span className="text-sky-600">{importPreview.length}</span> habilidades detectadas
                    </p>
                    <button onClick={() => { setImportPreview([]); setImportFile(''); if (fileRef.current) fileRef.current.value = ''; }}
                      className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1">
                      <X className="w-3.5 h-3.5" /> Remover
                    </button>
                  </div>

                  {/* Disciplinas breakdown */}
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(discPreview).sort((a, b) => b[1] - a[1]).map(([disc, count]) => (
                      <span key={disc} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-xs font-medium">
                        {disc}: {count}
                      </span>
                    ))}
                  </div>

                  {/* Preview table */}
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                      {importPreview.slice(0, 8).map((r, i) => (
                        <div key={i} className="flex items-start gap-3 px-3 py-2">
                          <span className="px-1.5 py-0.5 bg-sky-50 text-sky-700 rounded text-[11px] font-mono font-bold shrink-0">{r.code}</span>
                          <p className="text-xs text-slate-600 line-clamp-1 flex-1">{r.description}</p>
                          <span className="text-[11px] text-slate-400 shrink-0">{r.disciplina}</span>
                        </div>
                      ))}
                      {importPreview.length > 8 && (
                        <p className="text-xs text-center text-slate-400 py-2">
                          + {importPreview.length - 8} mais...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <Button type="button" variant="ghost" onClick={closeModal}>Cancelar</Button>
                <Button
                  onClick={handleImport}
                  loading={isImporting}
                  disabled={!importPreview.length || isImporting}
                >
                  <Upload className="w-4 h-4 mr-1.5" />
                  Importar {importPreview.length > 0 ? `${importPreview.length} habilidades` : ''}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
