"use client";

import React, { useState } from "react";
import dynamic from 'next/dynamic';
import { ReportFilters } from "@/components/reports/ReportFilters";
import { OverviewMetrics } from "@/components/reports/OverviewMetrics";

// Lazy loading components pesados (Recharts)
const ClassDistributionChart = dynamic(() => import('@/components/reports/ClassDistributionChart').then(mod => mod.ClassDistributionChart), { ssr: false, loading: () => <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-xl animate-pulse"><p className="text-gray-400 font-medium">Carregando gráfico...</p></div> });
const ScatterPerformanceChart = dynamic(() => import('@/components/reports/ScatterPerformanceChart').then(mod => mod.ScatterPerformanceChart), { ssr: false, loading: () => <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-xl animate-pulse"><p className="text-gray-400 font-medium">Carregando gráfico...</p></div> });
const ComparativeAnalysisChart = dynamic(() => import('@/components/reports/ComparativeAnalysisChart').then(mod => mod.ComparativeAnalysisChart), { ssr: false, loading: () => <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-xl animate-pulse"><p className="text-gray-400 font-medium">Carregando gráfico...</p></div> });
const ProficiencyCharts = dynamic(() => import('@/components/reports/ProficiencyCharts').then(mod => mod.ProficiencyCharts), { ssr: false, loading: () => <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-xl animate-pulse"><p className="text-gray-400 font-medium">Carregando gráficos...</p></div> });

import { ItemAnalysisGrid } from "@/components/reports/ItemAnalysisGrid";
import { StudentPerformanceTable } from "@/components/reports/StudentPerformanceTable";
import { WritingMetrics } from "@/components/reports/WritingMetrics";
import { WritingPerformanceTable } from "@/components/reports/WritingPerformanceTable";
import { ItemAuditorModal } from "@/components/reports/ItemAuditorModal";
import { ProficiencyListModal } from "@/components/reports/ProficiencyListModal";
import { ExportReportSection } from "@/components/reports/ExportReportSection";
import { useReportData } from "@/hooks/useReportData";
import { PerformanceCategory, QuestionStat, Subject } from "@/types/report";
import { BookOpen, PenTool, LayoutGrid, CheckCircle2 } from "lucide-react";

export default function DesempenhoPage() {
  const [filters, setFilters] = useState({
    school: "",
    year: "all",
    class: "all",
    subject: "",
  });

  const [activeTab, setActiveTab] = useState<"objetivas" | "redacao">("objetivas");
  
  // Estados para Modais Detalhados
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionStat | null>(null);
  const [selectedProficiency, setSelectedProficiency] = useState<{ category: PerformanceCategory, subject: "Linguagens" | "Matemática" } | null>(null);

  const { data, isLoading } = useReportData(filters);

  return (
    <div className="p-6 max-w-[1600px] mx-auto animate-fade-in">
      <div className="mb-8 bg-gradient-to-r from-kodar-600 to-kodar-400 rounded-2xl p-8 shadow-md relative overflow-hidden flex items-center gap-5">
        {/* Elementos decorativos de fundo para simular o efeito do print */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="absolute bottom-0 right-32 w-40 h-40 bg-kodar-800/20 rounded-full blur-2xl -mb-10 pointer-events-none"></div>
        
        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm z-10 flex-shrink-0">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <div className="z-10">
          <h1 className="text-3xl font-bold text-white tracking-tight">Relatório de Desempenho Escolar</h1>
          <p className="text-kodar-50 text-sm md:text-base mt-1.5 max-w-2xl font-medium">
            Análise qualitativa e quantitativa com base nos simulados e avaliações.
          </p>
        </div>
      </div>

      <ReportFilters filters={filters} setFilters={setFilters} />

      {filters.subject === "" ? (
        <div className="flex flex-col items-center justify-center py-32 px-4 bg-white/50 rounded-2xl border-2 border-dashed border-gray-200 mt-8 animate-fade-in">
          <div className="w-20 h-20 bg-kodar-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <BookOpen className="w-10 h-10 text-kodar-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-3 text-center">Nenhuma Disciplina Selecionada</h2>
          <p className="text-gray-500 text-center max-w-md font-medium">
            Para iniciar a análise dos dados pedagógicos, selecione <strong>Linguagens</strong> ou <strong>Matemática</strong> no filtro acima.
          </p>
        </div>
      ) : (
        <>
          {/* Tabs / Segmented Control */}
          <div className="flex bg-gray-100/80 p-1.5 rounded-2xl mt-8 mb-8 w-full max-w-2xl mx-auto shadow-inner border border-gray-200/60">
            <button
              onClick={() => setActiveTab("objetivas")}
              className={`flex-1 py-3 px-6 rounded-xl flex items-center justify-center gap-3 text-base font-bold transition-all duration-300 ${
                activeTab === "objetivas"
                  ? "bg-white text-kodar-700 shadow-sm border border-gray-200/50 scale-[1.02]"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/50"
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
              Avaliações Objetivas
            </button>
            <button
              onClick={() => setActiveTab("redacao")}
              className={`flex-1 py-3 px-6 rounded-xl flex items-center justify-center gap-3 text-base font-bold transition-all duration-300 ${
                activeTab === "redacao"
                  ? "bg-white text-kodar-700 shadow-sm border border-gray-200/50 scale-[1.02]"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/50"
              }`}
            >
              <PenTool className="w-5 h-5" />
              Produção Textual
            </button>
          </div>

          {isLoading || !data ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-kodar-200 border-t-kodar-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500 font-medium animate-pulse">Carregando dados do relatório...</p>
            </div>
          ) : (
            <div className="animate-slide-up">
          <OverviewMetrics metrics={data.metrics} />
          
          {activeTab === "objetivas" ? (
            <div className="animate-fade-in">
              <ProficiencyCharts
                linguagens={data.proficiencyLinguagens}
                matematica={data.proficiencyMatematica}
                subject={filters.subject}
                onCategoryClick={(category, subject) => setSelectedProficiency({ category, subject })}
              />
              
              <div className="w-full">
                <ComparativeAnalysisChart subject={filters.subject} />
              </div>

              <div className="flex flex-col gap-8 mb-8">
                {filters.class === "all" && (
                  <div className="w-full">
                    <ClassDistributionChart students={data.students} subject={filters.subject} />
                  </div>
                )}
                <div className="w-full">
                  <ScatterPerformanceChart students={data.students} subject={filters.subject} />
                </div>
              </div>
              <ItemAnalysisGrid 
                questions={data.questions} 
                subject={filters.subject}
                onQuestionClick={(q) => setSelectedQuestion(q)}
              />
              <StudentPerformanceTable students={data.students} gabarito={data.gabarito} />
            </div>
          ) : (
            <div className="animate-fade-in">
              <WritingMetrics 
                metrics={data.writingMetrics} 
                onCategoryClick={(category) => setSelectedProficiency({ category, subject: "Redação" as any })} 
              />
              <WritingPerformanceTable students={data.students} gabarito={data.gabarito} />
            </div>
          )}

          {/* Modais de Detalhamento Condicionais */}
          {!!selectedQuestion && (
            <ItemAuditorModal 
              isOpen={!!selectedQuestion}
              onClose={() => setSelectedQuestion(null)}
              question={selectedQuestion}
              students={data.students}
              gabarito={selectedQuestion.subject === 'Linguagens' ? data.gabarito?.linguagens[selectedQuestion.number-1] : data.gabarito?.matematica[selectedQuestion.number-1]}
            />
          )}

          {!!selectedProficiency && (
            <ProficiencyListModal 
              isOpen={!!selectedProficiency}
              onClose={() => setSelectedProficiency(null)}
              category={selectedProficiency.category}
              subject={selectedProficiency.subject}
              students={data.students}
            />
          )}

          {/* Seção de Exportação Otimizada */}
          <ExportReportSection filters={filters} />
        </div>
      )}
      </>
      )}
    </div>
  );
}

