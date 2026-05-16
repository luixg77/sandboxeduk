"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { HelpCircle, Plus, X, Trash2, ArrowRight } from "lucide-react";
import { ComparisonEntity, ComparisonEntityType } from "@/types/report";
import allData from "../../data/allData.json";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

interface ComparativeAnalysisChartProps {
  subject: string;
}

export const ComparativeAnalysisChart: React.FC<ComparativeAnalysisChartProps> = ({ subject }) => {
  const [mounted, setMounted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Seletores
  const [baseType, setBaseType] = useState<ComparisonEntityType>("Turma");
  const [baseValue, setBaseValue] = useState<string>("");
  const [refType, setRefType] = useState<ComparisonEntityType>("Escola");
  const [refValue, setRefValue] = useState<string>("");
  
  const [metric, setMetric] = useState<"TRI" | "TCT" | "Percentage">("TRI");
  const [entities, setEntities] = useState<ComparisonEntity[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (showHelp) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showHelp]);

  // Derivações de Dados Globais
  const allClasses = useMemo(() => Array.from(new Set(allData.students.map(s => s.class))).sort(), []);
  const allStudents = useMemo(() => allData.students.map(s => ({ id: s.id, name: s.name, class: s.class })).sort((a,b) => a.name.localeCompare(b.name)), []);

  // Pre-set values
  useEffect(() => {
    if (baseType === "Turma" && !baseValue && allClasses.length > 0) setBaseValue(allClasses[0]);
    if (baseType === "Aluno" && !baseValue && allStudents.length > 0) setBaseValue(allStudents[0].id);
    if (refType === "Turma" && !refValue && allClasses.length > 0) setRefValue(allClasses[0]);
  }, [baseType, refType, allClasses, allStudents]);

  const generateLabel = (type: ComparisonEntityType, value: string) => {
    if (type === "Escola" || type === "Média Estadual") return type;
    if (type === "Turma") return `Turma ${value}`;
    if (type === "Aluno") {
      const student = allStudents.find(s => s.id === value);
      return student ? student.name : "Aluno";
    }
    return type;
  };

  const handleAddComparison = () => {
    const newEntities = [...entities];
    let added = false;

    // Add Base
    const baseLabel = generateLabel(baseType, baseValue);
    if (!newEntities.find(e => e.label === baseLabel)) {
      newEntities.push({
        id: `base-${Date.now()}`,
        type: baseType,
        value: baseValue,
        label: baseLabel,
        color: COLORS[newEntities.length % COLORS.length]
      });
      added = true;
    }

    // Add Reference
    const refLabel = generateLabel(refType, refValue);
    if (!newEntities.find(e => e.label === refLabel)) {
      newEntities.push({
        id: `ref-${Date.now()}`,
        type: refType,
        value: refValue,
        label: refLabel,
        color: COLORS[newEntities.length % COLORS.length]
      });
      added = true;
    }

    if (added) {
      setEntities(newEntities);
    }
  };

  const handleRemoveEntity = (labelToRemove: string) => {
    setEntities(entities.filter(e => e.label !== labelToRemove));
  };

  const handleClear = () => {
    setEntities([]);
  };

  // Calcular dados do gráfico baseado nas entidades selecionadas
  const chartData = useMemo(() => {
    return entities.map(entity => {
      let score = 0;
      let count = 0;

      const getMetricValue = (s: any) => {
        const val = subject === "Linguagens" 
          ? (metric === "TRI" ? s.linguagensTRI : s.linguagensTCT)
          : (metric === "TRI" ? s.matematicaTRI : s.matematicaTCT);
        
        if (metric === "Percentage") {
          const totalQuestions = subject === "Linguagens" ? 21 : 22;
          const acertos = subject === "Linguagens" ? s.linguagensTCT : s.matematicaTCT;
          return Number(((acertos / totalQuestions) * 100).toFixed(1));
        }
        return val;
      };

      if (entity.type === "Média Estadual") {
        if (metric === "Percentage") score = 65; // Mock
        else score = subject === "Linguagens" ? (metric === "TRI" ? 220 : 12) : (metric === "TRI" ? 230 : 13);
      } else if (entity.type === "Escola") {
        allData.students.forEach(s => {
          score += getMetricValue(s);
          count++;
        });
        score = count > 0 ? Number((score / count).toFixed(1)) : 0;
      } else if (entity.type === "Turma") {
        allData.students.filter(s => s.class === entity.value).forEach(s => {
          score += getMetricValue(s);
          count++;
        });
        score = count > 0 ? Number((score / count).toFixed(1)) : 0;
      } else if (entity.type === "Aluno") {
        const student = allData.students.find(s => s.id === entity.value);
        if (student) {
          score = getMetricValue(student);
        }
      }

      return {
        name: entity.label,
        score: score,
        color: entity.color
      };
    });
  }, [entities, metric, subject]);

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const suffix = metric === "Percentage" ? "%" : metric === "TCT" ? " acertos" : " pts";
      return (
        <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-100 max-w-sm">
          <p className="font-bold text-gray-800 mb-2 pb-2 border-b border-gray-100">{label}</p>
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: payload[0].payload.color }} />
              <span className="text-sm font-medium text-gray-600 truncate max-w-[150px]">{subject}</span>
            </div>
            <span className="text-sm font-black text-gray-800">
              {payload[0].value}{suffix}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-8 mb-8 animate-fade-in relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            Análise Comparativa de Indicadores
          </h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">Compare o desempenho entre alunos, turmas, escola e média estadual.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setMetric("TRI")}
              className={`px-3 py-1.5 text-[10px] font-black rounded-md transition-all outline-none ${metric === "TRI" ? "bg-white text-kodar-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              TRI
            </button>
            <button
              onClick={() => setMetric("TCT")}
              className={`px-3 py-1.5 text-[10px] font-black rounded-md transition-all outline-none ${metric === "TCT" ? "bg-white text-kodar-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              TCT
            </button>
            <button
              onClick={() => setMetric("Percentage")}
              className={`px-3 py-1.5 text-[10px] font-black rounded-md transition-all outline-none ${metric === "Percentage" ? "bg-white text-kodar-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              %
            </button>
          </div>
          <button 
            onClick={() => setShowHelp(true)}
            className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-kodar-50 hover:text-kodar-600 transition-colors outline-none focus:ring-2 focus:ring-kodar-500/50"
            title="Como ler este gráfico?"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Controles */}
      <div className="bg-gray-50/80 p-5 rounded-xl border border-gray-200/60 mb-6">
        <div className="flex flex-col lg:flex-row gap-6 items-end">
          
          {/* Base */}
          <div className="flex-[5] min-w-0 space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Base de Comparação</label>
            <div className="flex gap-2">
              <select 
                value={baseType}
                onChange={(e) => { setBaseType(e.target.value as any); setBaseValue(""); }}
                className="w-32 h-11 px-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 bg-white shadow-sm outline-none focus:ring-2 focus:ring-kodar-500/20 focus:border-kodar-500 transition-all cursor-pointer flex-shrink-0"
              >
                <option value="Escola">Escola</option>
                <option value="Turma">Turma</option>
                <option value="Aluno">Aluno</option>
              </select>
              <select 
                value={baseValue}
                onChange={(e) => setBaseValue(e.target.value)}
                disabled={baseType === "Escola"}
                className={`flex-1 min-w-0 h-11 px-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 bg-white shadow-sm outline-none focus:ring-2 focus:ring-kodar-500/20 focus:border-kodar-500 transition-all cursor-pointer truncate ${baseType === "Escola" ? "opacity-50 cursor-not-allowed bg-gray-100" : ""}`}
              >
                {baseType === "Escola" && <option value="">Toda a Escola</option>}
                {baseType === "Turma" && allClasses.map(c => <option key={c} value={c}>Turma {c}</option>)}
                {baseType === "Aluno" && allStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
              </select>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-center pb-3 text-gray-300 flex-shrink-0">
            <ArrowRight className="w-5 h-5" />
          </div>

          {/* Referência */}
          <div className="flex-[4] min-w-0 space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Indicador de Referência</label>
            <div className="flex gap-2">
              <select 
                value={refType}
                onChange={(e) => { setRefType(e.target.value as any); setRefValue(""); }}
                className="w-32 h-11 px-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 bg-white shadow-sm outline-none focus:ring-2 focus:ring-kodar-500/20 focus:border-kodar-500 transition-all cursor-pointer flex-shrink-0"
              >
                <option value="Escola">Escola</option>
                <option value="Turma">Turma</option>
                <option value="Média Estadual">Média Estadual</option>
              </select>
              <select 
                value={refValue}
                onChange={(e) => setRefValue(e.target.value)}
                disabled={refType === "Escola" || refType === "Média Estadual"}
                className={`flex-1 min-w-0 h-11 px-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 bg-white shadow-sm outline-none focus:ring-2 focus:ring-kodar-500/20 focus:border-kodar-500 transition-all cursor-pointer truncate ${(refType === "Escola" || refType === "Média Estadual") ? "opacity-50 cursor-not-allowed bg-gray-100" : ""}`}
              >
                {refType === "Escola" && <option value="">Toda a Escola</option>}
                {refType === "Média Estadual" && <option value="">Média do Estado</option>}
                {refType === "Turma" && allClasses.map(c => <option key={c} value={c}>Turma {c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex-[2] w-full lg:w-auto flex-shrink-0">
            <button
              onClick={handleAddComparison}
              className="h-11 w-full bg-kodar-600 hover:bg-kodar-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-kodar-200 transition-all flex items-center justify-center gap-2 active:scale-95 outline-none"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Entidades Adicionadas */}
      {entities.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-gray-50/50 rounded-lg border border-gray-100">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2">Comparando:</span>
          {entities.map(entity => (
            <div key={entity.label} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm text-sm font-medium text-gray-700">
              <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entity.color }} />
              {entity.label}
              <button 
                onClick={() => handleRemoveEntity(entity.label)}
                className="ml-1 text-gray-400 hover:text-red-500 transition-colors outline-none"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {entities.length > 1 && (
            <button 
              onClick={handleClear}
              className="ml-auto text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors outline-none"
            >
              <Trash2 className="w-3.5 h-3.5" /> Limpar
            </button>
          )}
        </div>
      )}

      {/* Gráfico */}
      {entities.length === 0 ? (
        <div className="h-[350px] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 text-gray-400">
          <BarChart className="w-12 h-12 mb-3 text-gray-300" />
          <p className="font-medium text-gray-500">Nenhum indicador selecionado.</p>
          <p className="text-sm">Selecione uma base e referência acima e clique em "Adicionar Comparação".</p>
        </div>
      ) : (
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                domain={metric === "TRI" ? [0, 500] : metric === "Percentage" ? [0, 100] : [0, 25]} 
              />
              <Tooltip 
                content={customTooltip} 
                cursor={{ fill: '#f8fafc', opacity: 0.6 }} 
              />
              <Bar 
                dataKey="score" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={60}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Help Modal com Portal */}
      {mounted && showHelp && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-[32px] shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-kodar-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <BarChart className="w-6 h-6 text-kodar-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Análise Comparativa</h3>
                    <p className="text-kodar-600 font-medium text-sm">Como usar esta ferramenta</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowHelp(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full outline-none focus:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-sm leading-relaxed text-gray-500">
                <p className="font-medium">
                  Este gráfico permite criar <strong>comparações personalizadas</strong> entre diferentes níveis da rede de ensino.
                </p>
                <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p><strong>1. Selecione os Indicadores:</strong> Escolha uma Base (ex: Aluno João) e uma Referência (ex: Turma 904).</p>
                  <p><strong>2. Adicione ao Gráfico:</strong> Clique no botão "Adicionar". Você pode empilhar quantas comparações quiser.</p>
                  <p><strong>3. Troque a Métrica:</strong> Use o botão TRI/TCT no canto superior para alternar a forma de cálculo a qualquer momento.</p>
                </div>
                <p>
                  <strong>Dica:</strong> Use isso para mostrar a pais ou alunos como o desempenho individual se comporta em relação à média da turma ou da escola.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 px-8 py-5 flex justify-end border-t border-gray-100">
              <button 
                onClick={() => setShowHelp(false)}
                className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-colors outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
