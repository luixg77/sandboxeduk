"use client";

import React, { useState } from "react";
import { FileSpreadsheet, Loader2, Download } from "lucide-react";

interface ExportReportSectionProps {
  filters: {
    school: string;
    year: string;
    class: string;
    subject: string;
  };
}

export const ExportReportSection: React.FC<ExportReportSectionProps> = ({ filters }) => {
  const [exportState, setExportState] = useState<"idle" | "loading" | "ready">("idle");

  const handleExport = () => {
    setExportState("loading");
    // Simula o tempo de geração do relatório no backend (3 segundos)
    setTimeout(() => {
      setExportState("ready");
    }, 3000);
  };

  const handleDownload = () => {
    // Em um cenário real, isso faria o trigger do download do Blob retornado pela API
    setTimeout(() => {
      setExportState("idle");
    }, 1000);
  };

  return (
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
            className="w-full sm:w-auto bg-kodar-600 hover:bg-kodar-700 text-white font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-105 hover:shadow-lg shadow-md outline-none"
          >
            <FileSpreadsheet className="w-5 h-5" />
            Gerar Planilha
          </button>
        )}

        {exportState === "loading" && (
          <button
            disabled
            className="w-full sm:w-auto bg-kodar-100 text-kodar-700 font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-3 cursor-not-allowed border border-kodar-200 outline-none"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="animate-pulse">Processando Dados...</span>
          </button>
        )}

        {exportState === "ready" && (
          <button
            onClick={handleDownload}
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-105 hover:shadow-lg shadow-emerald-500/30 animate-fade-in outline-none"
          >
            <Download className="w-5 h-5" />
            Baixar Relatório.xlsx
          </button>
        )}
      </div>
    </div>
  );
};
