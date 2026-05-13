'use client';

import { AlertTriangle, X } from 'lucide-react';
import { Simulator } from '@/hooks/useSimulators';

interface DeleteSimulatorModalProps {
  simulator: Simulator | null;
  isOpen: boolean;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteSimulatorModal({
  simulator,
  isOpen,
  isPending,
  onConfirm,
  onClose,
}: DeleteSimulatorModalProps) {
  if (!isOpen || !simulator) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Inativar Simulador?</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            O simulador <strong className="text-slate-800">&quot;{simulator.title}&quot;</strong> será
            marcado como inativo e não estará mais visível para os alunos.
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Você pode reativar este simulador a qualquer momento na aba &quot;Inativos&quot;.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            {isPending ? (
              <svg className="h-4 w-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : null}
            {isPending ? 'Inativando...' : 'Inativar Simulador'}
          </button>
        </div>
      </div>
    </div>
  );
}
