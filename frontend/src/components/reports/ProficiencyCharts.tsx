"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { PerformanceCategory } from "@/types/report";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface ProficiencyChartsProps {
  linguagens: Record<PerformanceCategory, number>;
  matematica: Record<PerformanceCategory, number>;
  subject: string;
  onCategoryClick: (category: PerformanceCategory, subject: "Linguagens" | "Matemática") => void;
}

const COLORS = {
  "Abaixo do Básico": "#ef4444", // red-500
  Básico: "#f59e0b", // amber-500
  Adequado: "#10b981", // emerald-500
  Avançado: "#3b82f6", // blue-500
};

export const ProficiencyCharts: React.FC<ProficiencyChartsProps> = ({ linguagens, matematica, subject, onCategoryClick }) => {
  const [openHelpId, setOpenHelpId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (openHelpId) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [openHelpId]);

  const formatData = (data: Record<PerformanceCategory, number>) => {
    return Object.entries(data).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const dataLinguagens = formatData(linguagens);
  const dataMatematica = formatData(matematica);
  const isSingleSubject = subject !== "Todos";

  const renderChart = (title: string, data: { name: string; value: number }[], sub: "Linguagens" | "Matemática") => {
    const order = ["Abaixo do Básico", "Básico", "Adequado", "Avançado"];
    const orderedData = [...data].sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));

    if (isSingleSubject) {
      return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex-1 transition-all relative [&_*:focus]:outline-none [&_*:active]:outline-none [&_*]:outline-none">
          <div className="text-center mb-8 relative">
            <h3 className="text-xl font-black text-gray-800 tracking-tight">{title}</h3>
            
            <button
              onClick={() => setOpenHelpId(openHelpId === title ? null : title)}
              className="absolute right-0 top-0 w-10 h-10 bg-gray-50 hover:bg-gray-900 hover:text-white border border-gray-100 rounded-xl flex items-center justify-center transition-all group z-20 outline-none"
            >
              <span className="text-base font-black text-gray-400 group-hover:text-white transition-colors">?</span>
            </button>

            {mounted && openHelpId === title && createPortal(
              <div 
                className="fixed inset-0 z-[10000] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300 p-4"
                onClick={() => setOpenHelpId(null)}
              >
                <div 
                  className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100 w-full max-w-sm relative transform animate-in zoom-in-95 duration-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button 
                    onClick={() => setOpenHelpId(null)}
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
                      O gráfico apresenta a <strong>distribuição absoluta</strong> de alunos nos níveis de proficiência baseados na Teoria de Resposta ao Item (TRI).
                    </p>
                    <ul className="list-disc pl-4 space-y-2">
                      <li>Clique nas colunas ou legenda para filtrar e ver a lista de alunos de cada nível.</li>
                      <li>Níveis <strong>Abaixo do Básico</strong> indicam extrema urgência pedagógica.</li>
                    </ul>
                  </div>
                  <button onClick={() => setOpenHelpId(null)} className="w-full mt-8 py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-gray-800 transition-all text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-gray-900/10 active:scale-[0.98] outline-none">
                    Entendido
                  </button>
                </div>
              </div>,
              document.body
            )}
          </div>
          
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Legenda Lateral - Robusta */}
            <div className="flex flex-col gap-4 w-full lg:w-1/3 max-w-[280px]">
              {orderedData.map((entry, index) => (
                <div 
                  key={index} 
                  onClick={() => onCategoryClick(entry.name as PerformanceCategory, sub)}
                  className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-kodar-50 hover:border-kodar-200 transition-all group shadow-sm hover:shadow-md"
                  title="Clique para filtrar alunos"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-5 h-5 rounded-full shadow-inner" style={{ backgroundColor: COLORS[entry.name as keyof typeof COLORS] }}></div>
                    <span className="text-base font-black text-gray-700 group-hover:text-kodar-700">{entry.name}</span>
                  </div>
                  <span className="text-lg font-black text-gray-400 group-hover:text-kodar-600">{entry.value}</span>
                </div>
              ))}
            </div>

            {/* Gráfico de Colunas */}
            <div className="h-80 w-full lg:w-2/3 outline-none focus:outline-none">
              <ResponsiveContainer width="100%" height="100%" className="focus:outline-none">
                <ReBarChart data={orderedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} className="focus:outline-none outline-none">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 13, fontWeight: 800, fill: '#94a3b8' }}
                    dy={10}
                    hide={true} // Escondido pois a legenda lateral já é bem clara
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc', radius: 10 }}
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontWeight: 900, padding: '16px' }}
                    formatter={(value: any) => [`${value} Alunos`, "Quantidade"]}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[12, 12, 0, 0]} 
                    barSize={70}
                    onClick={(entry) => onCategoryClick(entry.name as PerformanceCategory, sub)}
                  >
                    {orderedData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[entry.name as keyof typeof COLORS]} 
                        className="hover:opacity-80 transition-opacity cursor-pointer shadow-lg"
                      />
                    ))}
                  </Bar>
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex-1 transition-all relative [&_*:focus]:outline-none [&_*:active]:outline-none [&_*]:outline-none">
        <div className="text-center mb-6 relative">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          
          <button
            onClick={() => setOpenHelpId(openHelpId === title ? null : title)}
            className="absolute right-0 -top-2 w-8 h-8 bg-gray-50 hover:bg-gray-900 hover:text-white border border-gray-100 rounded-lg flex items-center justify-center transition-all group z-20 outline-none"
          >
            <span className="text-sm font-black text-gray-400 group-hover:text-white transition-colors">?</span>
          </button>

          {mounted && openHelpId === title && createPortal(
            <div 
              className="fixed inset-0 z-[10000] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300 p-4"
              onClick={() => setOpenHelpId(null)}
            >
              <div 
                className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100 w-full max-w-sm relative transform animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => setOpenHelpId(null)}
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
                    Distribuição <strong>absoluta</strong> de proficiência baseada na TRI.
                  </p>
                  <ul className="list-disc pl-4 space-y-2">
                    <li>Clique na legenda ou gráfico para ver a lista de alunos correspondente.</li>
                  </ul>
                </div>
                <button onClick={() => setOpenHelpId(null)} className="w-full mt-8 py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-gray-800 transition-all text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-gray-900/10 active:scale-[0.98] outline-none">
                  Entendido
                </button>
              </div>
            </div>,
            document.body
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 h-64 sm:h-72">
          
          {/* Legenda Customizada na Esquerda - Aumentada */}
          <div className="flex flex-col gap-4 w-full sm:w-1/2 max-w-[220px] order-2 sm:order-1">
            {orderedData.map((entry, index) => (
              <div 
                key={index} 
                onClick={() => onCategoryClick(entry.name as PerformanceCategory, sub)}
                className="flex items-center justify-between border-b border-gray-50 pb-2.5 last:border-0 last:pb-0 cursor-pointer hover:bg-gray-50 transition-colors rounded-lg px-3 group"
                title="Clique para ver os alunos"
              >
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: COLORS[entry.name as keyof typeof COLORS] }}></div>
                  <span className="text-[15px] font-black text-gray-700 group-hover:text-kodar-600">{entry.name}</span>
                </div>
                <span className="text-base font-black text-gray-400">{entry.value}</span>
              </div>
            ))}
          </div>

          {/* Gráfico */}
          <div className="w-full sm:w-1/2 h-full order-1 sm:order-2 outline-none focus:outline-none">
            <ResponsiveContainer width="100%" height="100%" className="focus:outline-none">
              <PieChart className="focus:outline-none outline-none">
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  onClick={(entry) => onCategoryClick(entry.name as PerformanceCategory, sub)}
                >
                  {data.map((entry, index) => (
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
                  contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)", fontWeight: 800 }}
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
      {(subject === "Todos" || subject === "Linguagens") && renderChart("Padrão de Desempenho - Linguagens", dataLinguagens, "Linguagens")}
      {(subject === "Todos" || subject === "Matemática") && renderChart("Padrão de Desempenho - Matemática", dataMatematica, "Matemática")}
    </div>
  );
};
