"use client";

import React from "react";
import { PerformanceCategory } from "@/types/report";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface ProficiencyChartsProps {
  linguagens: Record<PerformanceCategory, number>;
  matematica: Record<PerformanceCategory, number>;
}

const COLORS = {
  "Abaixo do Básico": "#ef4444", // red-500
  Básico: "#f59e0b", // amber-500
  Adequado: "#10b981", // emerald-500
  Avançado: "#3b82f6", // blue-500 (Destacado do adequado)
};

export const ProficiencyCharts: React.FC<ProficiencyChartsProps> = ({ linguagens, matematica }) => {
  const formatData = (data: Record<PerformanceCategory, number>) => {
    return Object.entries(data).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const dataLinguagens = formatData(linguagens);
  const dataMatematica = formatData(matematica);

  const renderChart = (title: string, data: { name: string; value: number }[]) => {
    // Ordenar dados se necessário ou manter a ordem (abaixo do basico, basico, adequado, avancado)
    const order = ["Abaixo do Básico", "Básico", "Adequado", "Avançado"];
    const orderedData = [...data].sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));

    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex-1">
        <h3 className="text-lg font-bold text-gray-800 mb-6 text-center">{title}</h3>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 h-64 sm:h-72">
          
          {/* Legenda Customizada na Esquerda */}
          <div className="flex flex-col gap-3.5 w-full sm:w-1/2 max-w-[200px] order-2 sm:order-1">
            {orderedData.map((entry, index) => (
              <div key={index} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0 last:pb-0">
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
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[entry.name as keyof typeof COLORS]} 
                      stroke="#ffffff"
                      strokeWidth={3}
                      className="hover:opacity-80 transition-opacity duration-200 outline-none"
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value} Alunos`, "Quantidade"]}
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", fontWeight: 700 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 mb-6">
      {renderChart("Padrão de Desempenho - Linguagens", dataLinguagens)}
      {renderChart("Padrão de Desempenho - Matemática", dataMatematica)}
    </div>
  );
};
