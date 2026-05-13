'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  X, CheckCircle2, BookOpen, Target, Calendar,
  GraduationCap, Hash, FileText, Building2, Edit2,
  Download, Loader2, FileDown,
} from 'lucide-react';
import type { Question } from '@/types/question.types';
import { DIFFICULTY_CONFIG, questionDisplayCode } from '@/types/question.types';

interface QuestionDetailModalProps {
  question: Question | null;
  onClose: () => void;
  onEdit?: (question: Question) => void;
}

export function QuestionDetailModal({ question, onClose, onEdit }: QuestionDetailModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (question) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = 'unset';
    };
  }, [question, onClose]);

  // ── Export state ──
  const [exportState, setExportState] = useState<'idle' | 'loading' | 'ready'>('idle');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');

  // Reset export state when question changes
  useEffect(() => {
    setExportState('idle');
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(null);
    }
  }, [question?.id]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  const handleExport = useCallback(async () => {
    if (!question || exportState === 'loading') return;
    setExportState('loading');
    try {
      const res = await fetch('/api/admin/questions/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Falha na exportação');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const code = questionDisplayCode(question.id);
      setDownloadUrl(url);
      setDownloadFilename(`questao-${code}.docx`);
      setExportState('ready');
    } catch (err) {
      console.error('[export]', err);
      setExportState('idle');
      alert('Erro ao exportar a questão. Tente novamente.');
    }
  }, [question, exportState]);

  if (!question) return null;

  const diff = question.difficulty ? DIFFICULTY_CONFIG[question.difficulty] : null;
  const disciplineColor = question.disciplines?.color_hex ?? '#94a3b8';

  const metadata = [
    { Icon: BookOpen,      label: 'Fonte',          value: question.source ?? '—'                         },
    { Icon: Calendar,      label: 'Ano',             value: question.year ? String(question.year) : '—'    },
    { Icon: Target,        label: 'Habilidade BNCC', value: question.bncc_skills?.code ?? '—'              },
    { Icon: GraduationCap, label: 'Série / Etapa',   value: [question.grades?.name, question.education_stages?.name].filter(Boolean).join(' — ') || '—' },
    { Icon: Hash,          label: 'Descrição BNCC',  value: question.bncc_skills?.description ?? '—'       },
    { Icon: FileText,      label: 'Disciplina',      value: question.disciplines?.name ?? '—'              },
    { Icon: FileText,      label: 'Assunto',         value: question.subjects?.name ?? '—'                 },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 flex flex-col w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl animate-bounce-in overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg tracking-wide">
              {questionDisplayCode(question.id)}
            </span>
            {question.disciplines && (
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full border"
                style={{
                  backgroundColor: `${disciplineColor}18`,
                  color: disciplineColor,
                  borderColor: `${disciplineColor}40`,
                }}
              >
                {question.disciplines.name}
              </span>
            )}
            {diff && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${diff.cls}`}>
                {diff.label}
              </span>
            )}
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-600">
              {question.type === 'multiple_choice' ? 'Múltipla Escolha' : 'Discursiva'}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              question.origin === 'system'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-violet-50 text-violet-700 border-violet-200'
            }`}>
              {question.origin === 'system' ? 'Sistema' : 'Criada por mim'}
            </span>
            {question.status === 'draft' && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-orange-200 bg-orange-50 text-orange-700">
                Rascunho
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-7">

          {/* Enunciado */}
          <section>
            <SectionLabel color="bg-purple-500" text="Enunciado" />
            <div className="mt-3 space-y-4">
              <div 
                className="text-[15px] text-slate-800 leading-relaxed font-medium prose prose-slate max-w-none prose-p:my-2 prose-img:rounded-lg prose-img:max-h-[350px] prose-img:object-contain prose-img:p-1 prose-img:bg-slate-50 prose-img:border prose-img:border-slate-200"
                dangerouslySetInnerHTML={{ __html: question.statement }}
              />
              {question.image_url && !question.statement.includes('<img') && (
                <div className="flex justify-start">
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-sm p-1 inline-block max-w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={question.image_url} 
                      alt="Imagem do enunciado" 
                      className="max-w-full max-h-[350px] object-contain rounded-lg" 
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Alternativas */}
          {question.type === 'multiple_choice' && question.question_alternatives.length > 0 && (
            <section>
              <SectionLabel color="bg-blue-500" text="Alternativas" />
              <div className="mt-3 space-y-2">
                {question.question_alternatives.map((alt) => (
                  <div
                    key={alt.id}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors ${
                      alt.is_correct
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      alt.is_correct
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-500'
                    }`}>
                      {alt.letter}
                    </div>
                    <div className="flex-1 flex flex-col gap-3 min-w-0 pt-0.5">
                      <span 
                        className={`text-sm leading-relaxed ${
                          alt.is_correct ? 'text-emerald-800 font-semibold' : 'text-slate-700'
                        }`}
                        dangerouslySetInnerHTML={{ __html: alt.text }}
                      />
                      {alt.image_url && (
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm p-1 max-w-full w-max">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={alt.image_url} 
                            alt={`Imagem alternativa ${alt.letter}`} 
                            className="max-w-full max-h-[200px] object-contain rounded-lg" 
                          />
                        </div>
                      )}
                    </div>
                    {alt.is_correct && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Comentário */}
          {question.comment && (
            <section>
              <SectionLabel color="bg-amber-500" text="Comentário / Resolução" />
              <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
                <div 
                  className="text-sm text-amber-900 leading-relaxed prose prose-sm max-w-none prose-p:my-2 prose-img:rounded-lg prose-img:max-h-[350px] prose-img:object-contain prose-img:p-1 prose-img:bg-white prose-img:border prose-img:border-amber-200"
                  dangerouslySetInnerHTML={{ __html: question.comment }} 
                />
              </div>
            </section>
          )}

          {/* Metadados */}
          <section>
            <SectionLabel color="bg-slate-400" text="Metadados" />
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {metadata.map(({ Icon, label, value }) => (
                <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-700 leading-snug break-words">{value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Ações */}
          <section>
            <SectionLabel color="bg-indigo-500" text="Ações" />
            <div className="mt-3 space-y-2">
              <button
                onClick={handleExport}
                disabled={exportState === 'loading'}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all border ${
                  exportState === 'loading'
                    ? 'bg-purple-50 text-purple-400 border-purple-100 cursor-wait'
                    : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:border-purple-300'
                }`}
              >
                {exportState === 'loading' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gerando documento…
                  </>
                ) : (
                  <>
                    <FileDown className="h-4 w-4" />
                    Exportar para Word
                  </>
                )}
              </button>
              {exportState === 'ready' && downloadUrl && (
                <a
                  href={downloadUrl}
                  download={downloadFilename}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition-all"
                >
                  <Download className="h-4 w-4" />
                  Baixar Questão (.docx)
                </a>
              )}
            </div>
          </section>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/60 rounded-b-2xl">
          <span className="text-xs text-slate-400">
            Gabarito:{' '}
            <span className="font-bold text-slate-700">
              {question.answer_key
                ? question.answer_key
                : question.type === 'multiple_choice'
                  ? (question.question_alternatives.find((a) => a.is_correct)?.letter ?? '—')
                  : 'Ver comentário'}
            </span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Fechar
            </button>
            {onEdit && (
              <button
                onClick={() => onEdit(question)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors border border-purple-200"
              >
                <Edit2 className="h-3.5 w-3.5" />
                Editar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ color, text }: { color: string; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{text}</span>
    </div>
  );
}
