"use client";

import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from "recharts";
import { PerformanceCategory, StudentPerformance } from "@/types/report";

interface ClassDistributionChartProps {
  students: StudentPerformance[];
  subject: string;
}

const COLORS = {
  "Abaixo do Básico": "#ef4444", // red-500
  "Básico": "#f59e0b", // amber-500
  "Adequado": "#10b981", // emerald-500
  "Avançado": "#3b82f6", // blue-500
};

export const ClassDistributionChart: React.FC<ClassDistributionChartProps> = ({ students, subject }) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isHelpOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isHelpOpen]);
  const chartData = useMemo(() => {
    const classGroups: Record<string, Record<PerformanceCategory, number>> = {};
    
    students.forEach(student => {
      if (!classGroups[student.class]) {
        classGroups[student.class] = {
          "Abaixo do Básico": 0,
          "Básico": 0,
          "Adequado": 0,
          "Avançado": 0
        };
      }
      
      const category = subject === "Linguagens" 
        ? student.linguagensCategory 
        : student.matematicaCategory;
        
      if (category) {
        classGroups[student.class][category as PerformanceCategory]++;
      }
    });

    // Converter para porcentagem
    const processedData = Object.entries(classGroups)
      .map(([className, categories]) => {
        const total = categories["Abaixo do Básico"] + categories["Básico"] + categories["Adequado"] + categories["Avançado"];
        const year = className.substring(0, 1); // Extrai o ano (ex: 5 de 501)
        
        return {
          name: className,
          year: `Ano ${year}`,
          total,
          "Abaixo do Básico": total > 0 ? Math.round((categories["Abaixo do Básico"] / total) * 100) : 0,
          "Básico": total > 0 ? Math.round((categories["Básico"] / total) * 100) : 0,
          "Adequado": total > 0 ? Math.round((categories["Adequado"] / total) * 100) : 0,
          "Avançado": total > 0 ? Math.round((categories["Avançado"] / total) * 100) : 0,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return processedData;
  }, [students, subject]);

  if (students.length === 0 || chartData.length <= 1 || subject === "") {
    return null;
  }

  // Custom Tick para o Eixo X
  const renderCustomAxisTick = ({ x, y, payload }: any) => {
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="middle" fill="#64748b" fontSize={13} fontWeight={700}>
          {payload.value}
        </text>
      </g>
    );
  };

  const renderTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-5 rounded-xl shadow-xl border border-gray-100 min-w-[240px]">
          <p className="font-black text-gray-800 mb-3 border-b border-gray-100 pb-2">Turma {label}</p>
          <div className="flex flex-col gap-1.5">
            {[...payload].reverse().map((entry: any) => (
              <div key={entry.name} className="flex justify-between items-center py-1 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-sm font-bold text-gray-600">{entry.name}</span>
                </div>
                <span className="text-sm font-black text-gray-900">{entry.value}%</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 w-full transition-all relative [&_*:focus]:outline-none [&_*:active]:outline-none [&_*]:outline-none">
      <div className="p-8 pb-0 relative">
        <div className="text-center mb-8 relative">
          <h3 className="text-xl font-black text-gray-800 tracking-tight">Distribuição por Turmas (100%)</h3>
          <p className="text-sm text-gray-400 font-medium mt-1">Comparativo proporcional de proficiência (Stacked 100%)</p>
          
          <button
            onClick={() => setIsHelpOpen(!isHelpOpen)}
            className="absolute right-0 top-0 w-10 h-10 bg-gray-50 hover:bg-gray-900 hover:text-white border border-gray-100 rounded-xl flex items-center justify-center transition-all group z-20 outline-none"
          >
            <span className="text-base font-black text-gray-400 group-hover:text-white transition-colors">?</span>
          </button>

          {mounted && isHelpOpen && createPortal(
            <div 
              className="fixed inset-0 z-[10000] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300 p-4"
              onClick={() => setIsHelpOpen(false)}
            >
              <div 
                className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100 w-full max-w-sm relative transform animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => setIsHelpOpen(false)}
                  className="absolute right-6 top-6 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all outline-none"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <h4 className="font-black text-gray-900 text-lg mb-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center text-sm shadow-lg">?</div>
                  Como ler este gráfico
                </h4>
                <div className="space-y-4 text-sm leading-relaxed text-gray-500">
                  <p className="font-medium">
                    Este gráfico de barras empilhadas em 100% permite comparar a <strong>proporção de alunos em cada nível de proficiência</strong> entre diferentes turmas.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-xs font-bold text-gray-700">Abaixo do Básico:</span>
                      <span className="text-xs">Intervenção imediata.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="text-xs font-bold text-gray-700">Básico:</span>
                      <span className="text-xs">Limite mínimo esperado.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-xs font-bold text-gray-700">Adequado / Avançado:</span>
                      <span className="text-xs">Domínio das competências.</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsHelpOpen(false)} className="w-full mt-8 py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-gray-800 transition-all text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-gray-900/10 active:scale-[0.98] outline-none">
                  Entendido
                </button>
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>
      
      <div className="px-8 pb-8">
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%" className="focus:outline-none">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              barSize={65} // Barras redimensionadas para aproveitar a largura total
              barCategoryGap="15%"
              className="focus:outline-none outline-none"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={renderCustomAxisTick}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false}
              tickFormatter={(tick) => `${tick}%`}
              domain={[0, 100]}
              tick={{ fontSize: 13, fontWeight: 700, fill: '#94a3b8' }}
            />
            <Tooltip content={renderTooltip} cursor={{ fill: '#f8fafc' }} />
            
            {/* Ordem da Legenda fixada para bater com a ordem semântica */}
            <Legend 
              payload={[
                { value: 'Abaixo do Básico', type: 'circle', id: 'Abaixo do Básico', color: COLORS['Abaixo do Básico'] },
                { value: 'Básico', type: 'circle', id: 'Básico', color: COLORS['Básico'] },
                { value: 'Adequado', type: 'circle', id: 'Adequado', color: COLORS['Adequado'] },
                { value: 'Avançado', type: 'circle', id: 'Avançado', color: COLORS['Avançado'] },
              ]}
              wrapperStyle={{ paddingTop: '20px', fontWeight: 700, fontSize: '13px' }} 
            />

            {/* As barras são empilhadas de baixo para cima */}
            <Bar dataKey="Abaixo do Básico" stackId="a" fill={COLORS["Abaixo do Básico"]} radius={[0, 0, 4, 4]}>
              <LabelList dataKey="Abaixo do Básico" position="center" formatter={(v: number) => v > 5 ? `${v}%` : ''} fill="#fff" fontSize={11} fontWeight="bold" />
            </Bar>
            <Bar dataKey="Básico" stackId="a" fill={COLORS["Básico"]}>
              <LabelList dataKey="Básico" position="center" formatter={(v: number) => v > 5 ? `${v}%` : ''} fill="#fff" fontSize={11} fontWeight="bold" />
            </Bar>
            <Bar dataKey="Adequado" stackId="a" fill={COLORS["Adequado"]}>
              <LabelList dataKey="Adequado" position="center" formatter={(v: number) => v > 5 ? `${v}%` : ''} fill="#fff" fontSize={11} fontWeight="bold" />
            </Bar>
            <Bar dataKey="Avançado" stackId="a" fill={COLORS["Avançado"]} radius={[4, 4, 0, 0]}>
              <LabelList dataKey="Avançado" position="center" formatter={(v: number) => v > 5 ? `${v}%` : ''} fill="#fff" fontSize={11} fontWeight="bold" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
