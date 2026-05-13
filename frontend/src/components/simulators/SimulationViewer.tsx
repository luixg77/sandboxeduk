import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Maximize2, Minimize2, Info, ChevronDown } from 'lucide-react';
import { Simulator } from '@/hooks/useSimulators';

interface SimulationViewerProps {
  simulator: Simulator;
  onClose: () => void;
}

export function SimulationViewer({ simulator, onClose }: SimulationViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Escape to close
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && !document.fullscreenElement) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Click on backdrop to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      onClose();
    }
  };

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 md:p-8"
    >
      <div
        ref={containerRef}
        className={`bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl h-[90vh] sm:h-[85vh]'
        }`}
      >
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-900 text-white shrink-0">
          <div className="flex flex-col min-w-0 mr-2">
            <h2 className="text-sm sm:text-lg font-semibold truncate">{simulator.title}</h2>
            <span className="text-[10px] sm:text-xs text-gray-400 truncate">{simulator.knowledge_area}</span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              className="p-1.5 sm:p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              onClick={() => setShowInfo(!showInfo)}
              title="Informações do Simulador"
              aria-label="Informações do Simulador"
            >
              <Info className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              className="hidden sm:flex p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
              aria-label={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>

            <div className="w-px h-5 sm:h-6 bg-gray-700 mx-0.5 sm:mx-2" />

            <button
              className="p-1.5 sm:p-2 text-gray-300 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
              onClick={onClose}
              title="Fechar (Esc)"
              aria-label="Fechar"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 relative flex flex-col md:flex-row bg-gray-100 min-h-0">
          {/* Iframe container */}
          <div className={`relative transition-all duration-300 ${
            showInfo ? 'flex-1 min-h-[40vh] md:min-h-0' : 'flex-1'
          }`}>
            <iframe
              src={simulator.iframe_url}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              title={simulator.title}
            />
          </div>

          {/* Info Panel — sidebar on desktop, bottom drawer on mobile */}
          {showInfo && (
            <div className="w-full md:w-80 lg:w-96 bg-white border-t md:border-t-0 md:border-l border-gray-200 overflow-y-auto animate-in slide-in-from-bottom md:slide-in-from-right-8 duration-300 max-h-[45vh] md:max-h-none">
              {/* Mobile drawer handle */}
              <div className="flex md:hidden items-center justify-center py-2 border-b border-gray-100">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              <div className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Sobre este Simulador</h3>

                <div className="space-y-5">
                  {simulator.learning_objectives && (
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Objetivos de Aprendizagem
                      </h4>
                      <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                        {simulator.learning_objectives.split(';').map((obj, i) => (
                          <li key={i}>{obj.trim()}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {simulator.topics && (
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Tópicos Abordados
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {simulator.topics.split(';').map((topic, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-md font-medium border border-slate-200/60">
                            {topic.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {simulator.system_requirements && (
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Requisitos de Sistema
                      </h4>
                      <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        {simulator.system_requirements}
                      </p>
                    </div>
                  )}

                  {simulator.source && (
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Fonte
                      </h4>
                      <p className="text-xs text-gray-500">{simulator.source}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
