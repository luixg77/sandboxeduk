"use client";

import React, { useState } from "react";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { OverviewMetrics } from "@/components/reports/OverviewMetrics";
import { ProficiencyCharts } from "@/components/reports/ProficiencyCharts";
import { ItemAnalysisGrid } from "@/components/reports/ItemAnalysisGrid";
import { StudentPerformanceTable } from "@/components/reports/StudentPerformanceTable";
import { WritingMetrics } from "@/components/reports/WritingMetrics";
import { WritingPerformanceTable } from "@/components/reports/WritingPerformanceTable";
import { useReportData } from "@/hooks/useReportData";
import { BookOpen, PenTool, LayoutGrid, Download, FileSpreadsheet, Loader2, CheckCircle2 } from "lucide-react";

export default function DesempenhoPage() {
  const [exportState, setExportState] = useState<"idle" | "loading" | "ready">("idle");
  const [filters, setFilters] = useState({
    school: "EMEB BENTO ELOI GARCIA",
    year: "all",
    class: "all",
  });

  const [activeTab, setActiveTab] = useState<"objetivas" | "redacao">("objetivas");

  const handleExport = () => {
    setExportState("loading");
    // Simula o tempo de geração do relatório no backend (3 segundos)
    setTimeout(() => {
      setExportState("ready");
    }, 3000);
  };

  const handleDownload = () => {
    // Em um cenário real, isso faria o trigger do download do Blob retornado pela API
    // Resetando para o estado inicial para demonstrar o ciclo
    setTimeout(() => {
      setExportState("idle");
    }, 1000);
  };

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

      {/* Tabs / Segmented Control */}
      <div className="flex bg-gray-100/80 p-1.5 rounded-2xl mb-8 w-full max-w-2xl mx-auto shadow-inner border border-gray-200/60">
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
              />
              <ItemAnalysisGrid questions={data.questions} />
              <StudentPerformanceTable students={data.students} gabarito={data.gabarito} />
            </div>
          ) : (
            <div className="animate-fade-in">
              <WritingMetrics metrics={data.writingMetrics} />
              <WritingPerformanceTable students={data.students} gabarito={data.gabarito} />
            </div>
          )}

          {/* Seção de Exportação (Mock de Frontend) */}
          <div className="mt-12 bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-6 animate-fade-in">
            <div>
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                Exportar Relatório Analítico
              </h3>
              <p className="text-gray-500 mt-2 max-w-xl text-sm font-medium">
                Gere uma planilha Excel (.xlsx) completa com os microdados da turma, seguindo o padrão oficial. O arquivo será filtrado de acordo com a seleção atual ({filters.class === 'all' ? 'Todas as Turmas' : `Turma ${filters.class}`}).
              </p>
            </div>
            
            <div className="flex-shrink-0 w-full sm:w-auto">
              {exportState === "idle" && (
                <button
                  onClick={handleExport}
                  className="w-full sm:w-auto bg-kodar-600 hover:bg-kodar-700 text-white font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-105 hover:shadow-lg shadow-md"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  Gerar Planilha
                </button>
              )}

              {exportState === "loading" && (
                <button
                  disabled
                  className="w-full sm:w-auto bg-kodar-100 text-kodar-700 font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-3 cursor-not-allowed border border-kodar-200"
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="animate-pulse">Processando Dados...</span>
                </button>
              )}

              {exportState === "ready" && (
                <button
                  onClick={handleDownload}
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-105 hover:shadow-lg shadow-emerald-500/30 animate-fade-in"
                >
                  <Download className="w-5 h-5" />
                  Baixar Relatório.xlsx
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
