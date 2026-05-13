import { Play, Tag, Layers, Eye, Edit2, Archive, RefreshCw } from 'lucide-react';
import { Simulator } from '@/hooks/useSimulators';
import Link from 'next/link';

interface SimulatorCardProps {
  simulator: Simulator;
  onOpenViewer: (simulator: Simulator) => void;
  onInactivate?: (simulator: Simulator) => void;
  onActivate?: (simulator: Simulator) => void;
  showInactiveActions?: boolean;
}

export function SimulatorCard({
  simulator,
  onOpenViewer,
  onInactivate,
  onActivate,
  showInactiveActions = false,
}: SimulatorCardProps) {
  const topicsList = simulator.topics
    ? simulator.topics.split(';').map(t => t.trim()).filter(Boolean)
    : [];

  const isInactive = simulator.status === 'inactive';

  return (
    <div
      role="article"
      aria-label={`Simulador: ${simulator.title}`}
      tabIndex={0}
      onClick={() => onOpenViewer(simulator)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenViewer(simulator); } }}
      className={`group flex items-center justify-between p-5 bg-white rounded-xl border border-slate-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:border-slate-300 transition-all cursor-pointer
        ${isInactive ? 'opacity-70 bg-slate-50' : ''}
      `}
    >
      {/* Thumbnail e Info Básica */}
      <div className="flex items-center gap-5 flex-1 min-w-0">
        <div className="w-28 h-20 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center relative">
          {simulator.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={simulator.thumbnail_url} alt={simulator.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
              <Play className="w-5 h-5 text-slate-400 ml-0.5" />
            </div>
          )}
          {/* Hover overlay — play button */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
            <Play className="w-6 h-6 text-white ml-0.5" />
          </div>
        </div>
        
        <div className="min-w-0 flex flex-col justify-center flex-1 py-0.5">
          {/* Header Metadados */}
          <div className="flex items-center gap-2 mb-1">
            {isInactive && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-700">
                Inativo
              </span>
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              {simulator.knowledge_area || 'Multidisciplinar'}
            </span>
            <span className="text-[11px] font-medium text-slate-400 capitalize">
              {simulator.source || '3D WebGL'}
            </span>
          </div>
          
          {/* Título Principal */}
          <h3 className="text-base font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors" title={simulator.title}>
            {simulator.title}
          </h3>
          
          {/* Previews Condicionais */}
          {(simulator.learning_objectives || topicsList.length > 0) && (
            <div className="mt-1.5 flex flex-col gap-1.5 w-full">
              {simulator.learning_objectives && (
                <p className="text-sm text-slate-500 truncate" title={simulator.learning_objectives}>
                  <span className="font-semibold text-slate-600">Objetivos:</span> {simulator.learning_objectives}
                </p>
              )}
              {topicsList.length > 0 && (
                <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap w-full relative">
                  <span className="text-xs font-semibold text-slate-400 flex items-center shrink-0">
                    <Tag className="w-3.5 h-3.5 mr-1" /> Tópicos:
                  </span>
                  <div className="flex items-center gap-1.5 flex-nowrap overflow-hidden w-full">
                    {topicsList.map((topic, idx) => (
                      <span key={idx} className="text-[11px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                        {topic}
                      </span>
                    ))}
                  </div>
                  {/* Gradiente para suavizar o corte das tags na direita */}
                  <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons — Always visible */}
      <div className="flex items-center gap-1.5 shrink-0 ml-5">
        <button 
          onClick={(e) => { e.stopPropagation(); onOpenViewer(simulator); }}
          className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
          title="Visualizar"
          aria-label="Visualizar simulador"
        >
          <Eye className="w-5 h-5" />
        </button>

        {!showInactiveActions && (
          <>
            <Link 
              href={`/admin/gestao-conteudos/simuladores-3d/${simulator.id}`} 
              onClick={(e) => e.stopPropagation()}
              className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" 
              title="Editar"
              aria-label="Editar simulador"
            >
              <Edit2 className="w-5 h-5" />
            </Link>
            <button 
              onClick={(e) => { e.stopPropagation(); onInactivate?.(simulator); }}
              className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
              title="Inativar"
              aria-label="Inativar simulador"
            >
              <Archive className="w-5 h-5" />
            </button>
          </>
        )}

        {showInactiveActions && (
          <button
            onClick={(e) => { e.stopPropagation(); onActivate?.(simulator); }}
            className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Reativar"
            aria-label="Reativar simulador"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
