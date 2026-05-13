'use client';

import { useState } from 'react';
import { useEssayPrompts, EssayPrompt } from '@/hooks/useEssayPrompts';
import { ChevronDown, Search, Plus } from 'lucide-react';

interface EssayPromptSelectorProps {
  value: string;
  onChange: (promptId: string, prompt: EssayPrompt | null) => void;
  error?: string;
}

export function EssayPromptSelector({ value, onChange, error }: EssayPromptSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  // Apenas propostas publicadas para o professor
  const { data: res, isLoading } = useEssayPrompts({ 
    page: 1, 
    pageSize: 50, 
    search,
    status: 'Publicado' 
  });
  
  const prompts = res?.data || [];
  
  const selectedPrompt = prompts.find(p => p.id === value);

  return (
    <div className="relative">
      <div 
        className={`w-full flex items-center justify-between px-4 py-3 bg-white border ${error ? 'border-red-500' : 'border-slate-200'} rounded-xl cursor-pointer hover:border-fuchsia-300 transition-colors`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center shrink-0">
            <Plus className="w-4 h-4" />
          </div>
          <div>
            {selectedPrompt ? (
              <span className="text-sm font-medium text-slate-800">{selectedPrompt.title}</span>
            ) : (
              <span className="text-sm font-medium text-fuchsia-600">Criar tema a partir de uma proposta</span>
            )}
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedPrompt ? 'Clique para alterar a proposta' : 'Você pode usar um tema já cadastrado como base e modificar as informações.'}
            </p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar temas disponíveis..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-100 transition-all"
              />
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto p-2">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-slate-500">Carregando propostas...</div>
            ) : prompts.length > 0 ? (
              prompts.map(prompt => (
                <div 
                  key={prompt.id}
                  className={`px-4 py-3 rounded-lg cursor-pointer transition-colors ${value === prompt.id ? 'bg-fuchsia-50' : 'hover:bg-slate-50'}`}
                  onClick={() => {
                    onChange(prompt.id, prompt);
                    setIsOpen(false);
                  }}
                >
                  <p className={`text-sm font-medium ${value === prompt.id ? 'text-fuchsia-700' : 'text-slate-800'}`}>
                    {prompt.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{prompt.internal_name}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="text-[10px] text-slate-500">{prompt.category || 'Geral'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-slate-500">Nenhuma proposta encontrada.</div>
            )}
          </div>
        </div>
      )}
      
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}
