"use client";

import React from "react";
import { QuestionStat } from "@/types/report";

interface ItemAnalysisGridProps {
  questions: QuestionStat[];
}

export const ItemAnalysisGrid: React.FC<ItemAnalysisGridProps> = ({ questions }) => {
  // Cores em tons pastel/heatmap suave
  const getHeatmapColor = (percentage: number) => {
    if (percentage >= 85) return "bg-emerald-200 text-emerald-900";
    if (percentage >= 70) return "bg-green-100 text-green-900";
    if (percentage >= 50) return "bg-amber-100 text-amber-900";
    if (percentage >= 30) return "bg-orange-200 text-orange-900";
    return "bg-red-200 text-red-900";
  };

  const linguagens = questions.filter((q) => q.subject === "Linguagens");
  const matematica = questions.filter((q) => q.subject === "Matemática");

  // Identificar as 3 piores questões gerais
  const criticalQuestions = [...questions]
    .sort((a, b) => a.correctPercentage - b.correctPercentage)
    .slice(0, 3);

  const renderGrid = (title: string, data: QuestionStat[]) => (
    <div className="flex-1 w-full">
      <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">{title}</h4>
      <div className="flex flex-wrap gap-2.5">
        {data.map((q) => (
          <div
            key={q.id}
            className={`flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-lg ${getHeatmapColor(
              q.correctPercentage
            )} transition-all hover:scale-110 hover:shadow-md cursor-default flex-shrink-0`}
            title={`Questão ${q.number}: ${q.correctPercentage}% de acerto`}
          >
            <span className="text-xs font-bold opacity-70 mb-0.5">Q{q.number}</span>
            <span className="text-base sm:text-lg font-black leading-none">{q.correctPercentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Análise por Item (% de Acerto)</h3>
          <p className="text-sm text-gray-500 mt-1">Mapa de calor de desempenho das turmas selecionadas.</p>
        </div>
        
        {criticalQuestions.length > 0 && (
          <div className="bg-red-50 border border-red-100 p-3 rounded-lg flex items-center gap-3 w-full md:w-auto">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <div>
              <span className="text-xs font-bold text-red-800 uppercase block mb-0.5">Atenção Crítica</span>
              <div className="flex gap-2">
                {criticalQuestions.map((q) => (
                  <span key={`crit-${q.id}`} className="text-xs font-semibold text-red-700 bg-red-100/50 px-1.5 py-0.5 rounded">
                    Q{q.number} ({q.subject.substring(0,3)}): {q.correctPercentage}%
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6 w-full overflow-x-auto pb-2">
        {renderGrid("Linguagens", linguagens)}
        <div className="w-full h-px bg-gray-100"></div>
        {renderGrid("Matemática", matematica)}
      </div>
      
      {/* Legenda do Heatmap */}
      <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-medium text-gray-500 justify-end">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-emerald-200"></div> &ge; 85%
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-green-100"></div> 70% - 84%
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-amber-100"></div> 50% - 69%
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-orange-200"></div> 30% - 49%
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-red-200"></div> &lt; 30%
        </div>
      </div>
    </div>
  );
};
