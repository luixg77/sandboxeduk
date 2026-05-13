'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useEssayPrompts, EssayPrompt, useEssayCategories } from '@/hooks/useEssayPrompts';
import { PenTool, Plus, Search, Eye, Edit2, Copy, Trash2, ArrowLeft, SlidersHorizontal, Filter, X } from 'lucide-react';
import { HeroSummary } from '@/components/ui/HeroSummary';
import { EssayPromptPreview } from '@/components/essay-prompts/EssayPromptPreview';

// Helper component for select filters
function FilterSelect({ label, value, onChange, children, disabled = false }: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className={`text-[10px] font-black uppercase tracking-widest block mb-1.5 ${disabled ? 'text-slate-300' : 'text-slate-400'}`}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full pl-3 pr-8 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 text-slate-700 appearance-none disabled:bg-slate-50 disabled:text-slate-400"
      >
        {children}
      </select>
    </div>
  );
}

export default function EssayPromptsPage() {
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [filtersOpen, setFiltersOpen] = useState(true);
  const [previewPrompt, setPreviewPrompt] = useState<EssayPrompt | null>(null);

  const { data: res, isLoading } = useEssayPrompts({ page, pageSize, search, difficulty, category });
  const { data: categories = [] } = useEssayCategories();
  
  const prompts = res?.data || [];
  
  const hasActiveFilters = search || difficulty || category;
  const activeFilterCount = [search, difficulty, category].filter(Boolean).length;

  const clearFilters = () => {
    setSearch('');
    setDifficulty('');
    setCategory('');
    setPage(1);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-8 pt-8">
        <Link href="/admin/gestao-conteudos" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar
        </Link>

        <HeroSummary
          title="Propostas de Redação"
          description="Repositório global de modelos e temas de redação para os professores."
          icon={<PenTool className="w-8 h-8 text-white" />}
          themeClass="bg-gradient-to-br from-fuchsia-600 via-fuchsia-500 to-pink-500"
        >
          <Link 
            href="/admin/gestao-conteudos/redacoes/nova"
            className="flex items-center gap-2 bg-white text-fuchsia-700 px-5 py-3 rounded-xl font-bold shadow-sm hover:bg-fuchsia-50 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Nova Proposta
          </Link>
        </HeroSummary>
      </div>

      <div className="flex flex-1 gap-6 px-8 pb-16 pt-8 items-start">
        {/* ═══════════ FILTER SIDEBAR ═══════════ */}
        <aside className={`shrink-0 sticky top-8 transition-all duration-300 ${filtersOpen ? 'w-64' : 'w-12'}`}>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              {filtersOpen && (
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-fuchsia-600" />
                  <span className="text-sm font-bold text-slate-700">Filtros</span>
                  {activeFilterCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-600 text-[10px] font-bold text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
              )}
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ml-auto"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>

            {filtersOpen && (
              <div className="p-4 space-y-5">
                {/* Search */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
                    Buscar
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Título ou tema..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-8 pr-7 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 placeholder-slate-400"
                    />
                    {search && (
                      <button
                        onClick={() => setSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                      >
                        <X className="h-3 w-3 text-slate-400" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Dificuldade */}
                <FilterSelect
                  label="Dificuldade"
                  value={difficulty}
                  onChange={setDifficulty}
                >
                  <option value="">Todas</option>
                  <option value="Fácil">Fácil</option>
                  <option value="Média">Média</option>
                  <option value="Difícil">Difícil</option>
                </FilterSelect>

                {/* Categoria / Tema */}
                <FilterSelect
                  label="Tema / Categoria"
                  value={category}
                  onChange={setCategory}
                >
                  <option value="">Todos</option>
                  {categories.map((cat: string) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </FilterSelect>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-100"
                  >
                    <X className="h-3.5 w-3.5" /> Limpar filtros
                  </button>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* ═══════════ MAIN CONTENT ═══════════ */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex flex-col space-y-3">
            {isLoading ? (
              <div className="flex flex-col space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-24 bg-white rounded-xl border border-slate-100 p-4 animate-pulse"></div>
                ))}
              </div>
            ) : prompts.length > 0 ? (
              prompts.map((prompt) => (
                <div key={prompt.id} className="flex items-center justify-between p-5 bg-white rounded-xl border border-slate-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:border-fuchsia-300 transition-all">
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className="w-28 h-20 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                      {prompt.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={prompt.cover_image_url} alt="Capa" className="w-full h-full object-cover" />
                      ) : (
                        <PenTool className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${prompt.status === 'Publicado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {prompt.status}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                          {prompt.difficulty_level}
                        </span>
                        {prompt.category && (
                          <span className="text-xs font-medium text-slate-400">
                            {prompt.category}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-800 line-clamp-1 group-hover:text-fuchsia-700 transition-colors">{prompt.title}</h3>
                      <p className="text-sm text-slate-500 truncate">{prompt.internal_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0 ml-5">
                    <button 
                      onClick={() => setPreviewPrompt(prompt)}
                      className="p-2.5 text-slate-400 hover:text-fuchsia-600 hover:bg-fuchsia-50 rounded-lg transition-colors" 
                      title="Visualizar"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Duplicar">
                      <Copy className="w-5 h-5" />
                    </button>
                    <Link href={`/admin/gestao-conteudos/redacoes/${prompt.id}`} className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Editar">
                      <Edit2 className="w-5 h-5" />
                    </Link>
                    <button className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <PenTool className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-sm font-bold text-slate-700">Nenhuma proposta encontrada</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm text-center">
                  {hasActiveFilters 
                    ? 'Tente remover alguns filtros de busca.' 
                    : 'Crie sua primeira proposta de redação para que os professores possam utilizá-la.'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-3 text-sm font-medium text-fuchsia-600 hover:text-fuchsia-700 transition-colors"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <EssayPromptPreview 
        prompt={previewPrompt} 
        isOpen={!!previewPrompt} 
        onClose={() => setPreviewPrompt(null)} 
      />
    </div>
  );
}
