'use client';

import { useEffect, useState } from 'react';
import { ProfessorButton } from './Button';

interface FinalizeCourseModalProps {
  open:         boolean;
  courseTitle:  string;
  progress:     number;
  onClose:      () => void;
  onSubmit:     (data: { rating: number; feedback?: string }) => Promise<void>;
}

export function FinalizeCourseModal({
  open, courseTitle, progress, onClose, onSubmit,
}: FinalizeCourseModalProps) {
  const [rating, setRating]       = useState(0);
  const [hover, setHover]         = useState(0);
  const [feedback, setFeedback]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // Reset state on open
  useEffect(() => {
    if (open) {
      setRating(0);
      setHover(0);
      setFeedback('');
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  // ESC fecha
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, submitting]);

  if (!open) return null;

  const canSubmit = rating >= 1 && rating <= 5 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ rating, feedback: feedback.trim() || undefined });
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao finalizar curso');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-extrabold text-lg leading-tight">Finalizar curso</h2>
              <p className="text-white/80 text-xs font-semibold">Progresso atual: {progress}%</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <p className="text-sm text-slate-600 leading-relaxed">
            Você está finalizando <strong className="text-slate-800">{courseTitle}</strong>.
            Após finalizar, o curso continuará acessível mas não poderá ser refinalizado.
          </p>

          {/* Rating */}
          <div>
            <label className="block text-sm font-extrabold text-slate-700 mb-2">
              Como você avalia este curso? <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(n => {
                const filled = (hover || rating) >= n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    className="p-1 transition-transform hover:scale-110"
                    aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
                  >
                    <svg
                      className={`w-9 h-9 transition-colors ${filled ? 'text-amber-400' : 'text-slate-200'}`}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  </button>
                );
              })}
              {rating > 0 && (
                <span className="ml-3 text-sm font-bold text-slate-600">
                  {rating} de 5
                </span>
              )}
            </div>
          </div>

          {/* Feedback */}
          <div>
            <label className="block text-sm font-extrabold text-slate-700 mb-2">
              Comentário <span className="text-slate-400 font-semibold">(opcional)</span>
            </label>
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Compartilhe sua impressão sobre o curso..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none"
            />
            <p className="text-[11px] text-slate-400 text-right mt-1">{feedback.length}/500</p>
          </div>

          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 font-semibold">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <ProfessorButton
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </ProfessorButton>
          <ProfessorButton
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting ? 'Enviando...' : 'Finalizar curso'}
          </ProfessorButton>
        </div>
      </div>
    </div>
  );
}
