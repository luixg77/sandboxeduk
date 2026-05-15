"use client";

import React from "react";
import { WritingMetricsData, PerformanceCategory } from "@/types/report";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

interface WritingMetricsProps {
  metrics: WritingMetricsData;
  onCategoryClick: (category: PerformanceCategory) => void;
}

const COLORS = {
  "Abaixo do Básico": "#ef4444",
  Básico: "#f59e0b",
  Adequado: "#10b981",
  Avançado: "#3b82f6",
};

export const WritingMetrics: React.FC<WritingMetricsProps> = ({ metrics, onCategoryClick }) => {
  const radarData = [
    {
      subject: "Adequação",
      A: metrics.averageAdequation,
      fullMark: 4,
    },
    {
      subject: "Coerência",
      A: metrics.averageCoherence,
      fullMark: 4,
    },
    {
      subject: "Estrutura",
      A: metrics.averageStructure,
      fullMark: 4,
    },
    {
      subject: "Ortografia",
      A: metrics.averageOrthography,
      fullMark: 4,
    },
  ];

  const pieData = Object.entries(metrics.proficiencyDistribution).map(([name, value]) => ({
    name,
    value,
  }));

  // Ordenar dados do PieChart na ordem lógica
  const order = ["Abaixo do Básico", "Básico", "Adequado", "Avançado"];
  const orderedPieData = [...pieData].sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));

  return (
    <div className="flex flex-col lg:flex-row gap-6 mb-6">
      {/* Gráfico de Radar para Critérios */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex-1">
        <h3 className="text-lg font-bold text-gray-800 mb-4 text-center tracking-tight">Médias por Competência (0-4)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12, fontWeight: 700 }} />
              <PolarRadiusAxis angle={30} domain={[0, 4]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Radar name="Média da Turma" dataKey="A" stroke="#14b8a6" strokeWidth={3} fill="#2dd4bf" fillOpacity={0.6} />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", fontWeight: 700 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de Rosca para Proficiência Final */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex-1">
        <h3 className="text-lg font-bold text-gray-800 mb-6 text-center tracking-tight">Distribuição de Proficiência - Redação</h3>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 h-64 sm:h-72">
          
          {/* Legenda Customizada na Esquerda */}
          <div className="flex flex-col gap-3.5 w-full sm:w-1/2 max-w-[200px] order-2 sm:order-1">
            {orderedPieData.map((entry, index) => (
              <div 
                key={index} 
                onClick={() => onCategoryClick(entry.name as PerformanceCategory)}
                className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0 last:pb-0 cursor-pointer hover:bg-gray-50 transition-colors rounded px-2"
                title="Clique para ver os alunos"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[entry.name as keyof typeof COLORS] }}></div>
                  <span className="text-sm font-bold text-gray-700">{entry.name}</span>
                </div>
                <span className="text-sm font-black text-gray-500">{entry.value}</span>
              </div>
            ))}
          </div>

          {/* Gráfico */}
          <div className="w-full sm:w-1/2 h-full order-1 sm:order-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  onClick={(entry) => onCategoryClick(entry.name as PerformanceCategory)}
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[entry.name as keyof typeof COLORS]} 
                      stroke="#ffffff"
                      strokeWidth={3}
                      className="hover:opacity-80 transition-opacity duration-200 outline-none cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${value} Alunos`, "Quantidade"]}
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", fontWeight: 700 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
