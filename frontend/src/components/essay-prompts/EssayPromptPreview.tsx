'use client';

import { EssayPrompt } from '@/hooks/useEssayPrompts';
import { X, Calendar, User, FileText, ExternalLink } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface EssayPromptPreviewProps {
  prompt: EssayPrompt | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EssayPromptPreview({ prompt, isOpen, onClose }: EssayPromptPreviewProps) {
  if (!prompt) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Visualização do tema`} maxWidth="max-w-4xl">
      <div className="relative">
        {/* Capa */}
        {prompt.cover_image_url && (
          <div className="w-full h-48 sm:h-64 rounded-xl overflow-hidden mb-6 border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={prompt.cover_image_url} alt={prompt.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Título */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800 uppercase mb-1">{prompt.internal_name}</h2>
          <h3 className="text-lg text-fuchsia-700 font-medium">{prompt.title}</h3>
        </div>

        {/* Metadados rápidos (Mocks de datas/autores pois isso seria da instância da turma, mas para preview admin usamos dados do prompt) */}
        <div className="flex flex-wrap items-center gap-6 py-4 border-y border-slate-100 mb-6">
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Criado em</p>
              <p className="text-sm font-medium">{new Date(prompt.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <User className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Categoria</p>
              <p className="text-sm font-medium">{prompt.category || 'Geral'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <FileText className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Dificuldade</p>
              <p className="text-sm font-medium">{prompt.difficulty_level}</p>
            </div>
          </div>
        </div>

        {/* Descrição */}
        {prompt.description && (
          <div className="mb-8">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Descrição</h4>
            <div 
              className="prose prose-sm prose-slate max-w-none prose-a:text-fuchsia-600"
              dangerouslySetInnerHTML={{ __html: prompt.description }}
            />
          </div>
        )}

        {/* Arquivo da Proposta */}
        {prompt.file_url && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Arquivo da Proposta</h4>
              <a 
                href={prompt.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Abrir em nova aba
              </a>
            </div>
            
            <div className="w-full h-[600px] border border-slate-200 rounded-xl overflow-hidden bg-slate-100">
              {/* Fallback para iframe - para uma visualização melhor, poderíamos usar react-pdf no futuro */}
              <iframe 
                src={`${prompt.file_url}#toolbar=0`} 
                className="w-full h-full"
                title="Visualizador de PDF"
              />
            </div>
          </div>
        )}

        {/* Instruções */}
        {prompt.instructions && (
          <div className="mb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Instruções para os Alunos</h4>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {prompt.instructions}
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
