"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, X, BarChart2, Check, Search, Filter, ChevronDown } from "lucide-react";
import { ComparisonEntity, ComparisonEntityType } from "@/types/report";
import allData from "../../data/allData.json";

// Cores para as linhas do gráfico
const COLORS = ["#ec4899", "#8b5cf6", "#10b981", "#3b82f6", "#f59e0b", "#14b8a6", "#f43f5e", "#6366f1"];

interface ComparativeAnalysisChartProps {
  subject: string;
}

interface ActiveIndicator {
  id: string;
  label: string;
  color: string;
  type: ComparisonEntityType;
  value: string;
  category: string;
  hidden?: boolean;
}

export const ComparativeAnalysisChart: React.FC<ComparativeAnalysisChartProps> = ({ subject }) => {
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Filtros Globais
  const [metric, setMetric] = useState<"TRI" | "TCT" | "Percentage">("TRI");
  const [filterTime, setFilterTime] = useState("Bimestre");

  // Busca e Filtro no modal
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("Todas");
  const [isStudentsExpanded, setIsStudentsExpanded] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");

  // Indicadores Ativos
  const [activeIndicators, setActiveIndicators] = useState<ActiveIndicator[]>([]);
  // Checkboxes temporários dentro do modal
  const [tempSelected, setTempSelected] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
      // Pre-select already active ones
      setTempSelected(activeIndicators.map(ind => ind.id));
      setSearchTerm("");
      setSelectedClassFilter("Todas");
      setIsStudentsExpanded(false);
      setStudentSearchTerm("");
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showModal, activeIndicators]);

  // Construir a lista de entidades disponíveis para o Modal
  const allClasses = useMemo(() => Array.from(new Set(allData.students.map(s => s.class))).sort(), []);
  const allStudents = useMemo(() => allData.students.map(s => ({ id: s.id, name: s.name, class: s.class })).sort((a,b) => a.name.localeCompare(b.name)), []);

  const modalCategories = useMemo(() => {
    return [
      {
        category: "Métricas Gerais",
        items: [
          { id: "escola-geral", label: "Média da Escola", type: "Escola" as ComparisonEntityType, value: "" },
          { id: "estado-geral", label: "Média Estadual", type: "Média Estadual" as ComparisonEntityType, value: "" },
        ]
      },
      {
        category: "Turmas",
        items: allClasses.map(c => ({
          id: `turma-${c}`, label: `Turma ${c}`, type: "Turma" as ComparisonEntityType, value: c
        }))
      },
      {
        category: "Alunos",
        items: allStudents.map(s => ({
          id: `aluno-${s.id}`, label: `${s.name} (${s.class})`, type: "Aluno" as ComparisonEntityType, value: s.id, class: s.class
        }))
      }
    ];
  }, [allClasses, allStudents]);

  const filteredCategories = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    
    return modalCategories.map(cat => {
      let filteredItems = cat.items;

      // Se for a categoria Alunos, aplica os filtros específicos (turma e nome)
      if (cat.category === "Alunos") {
        if (selectedClassFilter !== "Todas") {
          filteredItems = filteredItems.filter((item: any) => item.class === selectedClassFilter);
        }
        if (studentSearchTerm) {
          const lowerStudent = studentSearchTerm.toLowerCase();
          filteredItems = filteredItems.filter((item: any) => item.label.toLowerCase().includes(lowerStudent));
        }
      }

      // Aplica a busca por texto geral
      if (lowerSearch) {
        filteredItems = filteredItems.filter(item => item.label.toLowerCase().includes(lowerSearch));
      }

      return {
        ...cat,
        items: filteredItems
      };
    }).filter(cat => cat.items.length > 0);
  }, [modalCategories, searchTerm, selectedClassFilter, studentSearchTerm]);


  // --- CÁLCULO DE DADOS ---
  const chartData = useMemo(() => {
    if (activeIndicators.length === 0) return [];

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

    // Calcular as médias base do 3º Bimestre (dados reais)
    const baseScores: Record<string, number> = {};
    
    activeIndicators.forEach(ind => {
      let score = 0;
      let count = 0;

      if (ind.type === "Média Estadual") {
        if (metric === "Percentage") score = 65; 
        else score = subject === "Linguagens" ? (metric === "TRI" ? 220 : 12) : (metric === "TRI" ? 230 : 13);
      } 
      else if (ind.type === "Escola") {
        allData.students.forEach(s => { score += getMetricValue(s); count++; });
        score = count > 0 ? score / count : 0;
      } 
      else if (ind.type === "Turma") {
        allData.students.filter(s => s.class === ind.value).forEach(s => { score += getMetricValue(s); count++; });
        score = count > 0 ? score / count : 0;
      } 
      else if (ind.type === "Aluno") {
        const student = allData.students.find(s => s.id === ind.value);
        if (student) score = getMetricValue(student);
      }
      
      baseScores[ind.id] = score;
    });

    const periods = ["1º Bim/25", "2º Bim/25", "3º Bim/25"];
    
    return periods.map((period, idx) => {
      const factor = idx === 0 ? 0.85 : idx === 1 ? 0.92 : 1.0;
      const dataPoint: any = { period };

      activeIndicators.forEach(ind => {
        dataPoint[ind.id] = Number((baseScores[ind.id] * factor).toFixed(1));
      });

      return dataPoint;
    });
  }, [activeIndicators, metric, subject]);

  const toggleTempSelection = (id: string) => {
    setTempSelected(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleApplyIndicators = () => {
    const newIndicators: ActiveIndicator[] = [];
    let colorIndex = 0;

    modalCategories.forEach(category => {
      category.items.forEach(item => {
        if (tempSelected.includes(item.id)) {
          const existing = activeIndicators.find(ind => ind.id === item.id);
          newIndicators.push({
            id: item.id,
            label: item.label,
            type: item.type,
            value: item.value,
            category: category.category,
            hidden: existing?.hidden || false,
            color: existing?.color || COLORS[colorIndex % COLORS.length]
          });
          if (!existing) colorIndex++;
        }
      });
    });

    setActiveIndicators(newIndicators);
    setShowModal(false);
  };

  const handleRemoveIndicator = (id: string) => {
    setActiveIndicators(prev => prev.filter(ind => ind.id !== id));
  };

  const toggleIndicatorVisibility = (id: string) => {
    setActiveIndicators(prev => prev.map(ind => 
      ind.id === id ? { ...ind, hidden: !ind.hidden } : ind
    ));
  };

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const suffix = metric === "Percentage" ? "%" : metric === "TCT" ? " acertos" : " pts";

      const visiblePayload = payload.filter((entry: any) => {
        const indicatorDef = activeIndicators.find(ind => ind.id === entry.dataKey);
        return indicatorDef && !indicatorDef.hidden;
      });

      if (visiblePayload.length === 0) return null;

      return (
        <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-100 min-w-[200px]">
          <p className="font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">{label}</p>
          <div className="space-y-2">
            {visiblePayload.map((entry: any, index: number) => {
              const indicatorDef = activeIndicators.find(ind => ind.id === entry.dataKey);
              return (
                <div key={`tooltip-${index}`} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm font-medium text-gray-600 truncate max-w-[180px]">
                      {indicatorDef?.label || entry.name}
                    </span>
                  </div>
                  <span className="text-sm font-black text-gray-800 whitespace-nowrap" style={{ color: entry.color }}>
                    {entry.value}{suffix}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // Separar indicadores ativos por categoria para a legenda lateral
  const indicatorsByCategory = useMemo(() => {
    const grouped: Record<string, ActiveIndicator[]> = {};
    activeIndicators.forEach(ind => {
      if (!grouped[ind.category]) grouped[ind.category] = [];
      grouped[ind.category].push(ind);
    });
    return grouped;
  }, [activeIndicators]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-8 mb-8 animate-fade-in relative flex flex-col">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b border-gray-50 pb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            Evolução de Indicadores Chave
          </h2>
          <p className="text-sm text-gray-500 mt-1 font-medium">Compare a evolução temporal entre alunos, turmas, escola e média estadual.</p>
        </div>
        <div className="flex items-center gap-4 self-start sm:self-auto">
          
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
            onClick={() => setShowModal(true)}
            className="h-10 px-4 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 outline-none active:scale-95"
          >
            <Plus className="w-4 h-4 text-kodar-500" />
            Adicionar Entidades
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Gráfico Principal */}
        <div className="flex-1 min-w-0">
          {activeIndicators.length === 0 ? (
            <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 text-gray-400">
              <BarChart2 className="w-12 h-12 mb-3 text-gray-300" />
              <p className="font-medium text-gray-500">Nenhum indicador selecionado no momento.</p>
              <p className="text-sm mt-1">Clique em "Adicionar Entidades" para comparar alunos, turmas ou a escola.</p>
            </div>
          ) : (
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="period" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                    domain={metric === "TRI" ? [0, 500] : metric === "Percentage" ? [0, 100] : [0, 25]} 
                  />
                  <Tooltip content={customTooltip} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  
                  {activeIndicators
                    .filter(ind => !ind.hidden)
                    .map(ind => (
                    <Line 
                      key={ind.id}
                      type="monotone" 
                      dataKey={ind.id} 
                      stroke={ind.color} 
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 0, fill: ind.color }}
                      animationDuration={1000}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Legenda Lateral */}
        {activeIndicators.length > 0 && (
          <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-6 pl-0 lg:pl-6 border-t lg:border-t-0 lg:border-l border-gray-100 pt-6 lg:pt-0">
            {Object.keys(indicatorsByCategory).map(category => (
              <div key={category} className="space-y-3">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{category}</h4>
                <div className="space-y-2">
                  {indicatorsByCategory[category].map(ind => (
                    <div key={ind.id} className="flex items-center justify-between group p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div 
                        className="flex items-center gap-3 overflow-hidden cursor-pointer w-full pr-2"
                        onClick={() => toggleIndicatorVisibility(ind.id)}
                        title={ind.hidden ? "Clique para exibir no gráfico" : "Clique para ocultar do gráfico"}
                      >
                        <div 
                          className={`w-3 h-3 rounded-full flex-shrink-0 shadow-sm transition-all duration-300 ${ind.hidden ? 'opacity-30 scale-75' : 'opacity-100'}`} 
                          style={{ backgroundColor: ind.color }}
                        />
                        <span className={`text-sm font-medium truncate transition-all duration-300 ${ind.hidden ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                          {ind.label}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleRemoveIndicator(ind.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all outline-none p-1 rounded hover:bg-red-50"
                        title="Remover indicador"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Seleção de Indicadores */}
      {mounted && showModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                  <BarChart2 className="w-5 h-5 text-kodar-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Adicionar Entidades</h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-200 rounded-full outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-white custom-scrollbar">
              
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar aluno, turma ou escola..." 
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-kodar-500/20 focus:border-kodar-500 transition-all"
                />
              </div>

              {filteredCategories.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Nenhum resultado encontrado.
                </div>
              ) : (
                filteredCategories.map(category => (
                  <div key={category.category} className="space-y-4">
                    <div className="flex items-center justify-between pl-1">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">{category.category}</h4>
                      
                      {category.category === "Alunos" && (
                        <div className="relative flex items-center gap-2">
                          <Filter className="w-3.5 h-3.5 text-gray-400" />
                          <select
                            value={selectedClassFilter}
                            onChange={(e) => setSelectedClassFilter(e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-gray-600 text-xs font-bold rounded-lg py-1 px-2 pr-6 outline-none focus:ring-1 focus:ring-kodar-500 cursor-pointer appearance-none"
                          >
                            <option value="Todas">Todas as Turmas</option>
                            {allClasses.map(c => (
                              <option key={c} value={c}>Turma {c}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-gray-400">
                            <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>

                    {category.category === "Alunos" ? (
                      <div className="space-y-3">
                        <button 
                          onClick={() => setIsStudentsExpanded(!isStudentsExpanded)}
                          className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors outline-none"
                        >
                          <span className="text-sm font-bold text-gray-700">
                            Ver alunos filtrados ({category.items.length})
                          </span>
                          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isStudentsExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isStudentsExpanded && (
                          <div className="space-y-4 mt-3 pl-2 border-l-2 border-gray-100 pr-2">
                            <div className="relative">
                              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input 
                                type="text"
                                placeholder="Buscar aluno pelo nome..."
                                value={studentSearchTerm}
                                onChange={(e) => setStudentSearchTerm(e.target.value)}
                                className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-gray-50 outline-none focus:border-kodar-500 focus:ring-2 focus:ring-kodar-500/20 focus:bg-white transition-all"
                              />
                            </div>
                            
                            <div className="space-y-1 max-h-[480px] overflow-y-auto custom-scrollbar pr-2">
                              {category.items.length === 0 ? (
                                <div className="text-center py-6 text-sm text-gray-400 font-medium">Nenhum aluno encontrado</div>
                              ) : (
                                category.items.map(item => {
                                  const isSelected = tempSelected.includes(item.id);
                                  return (
                                    <div 
                                      key={item.id} 
                                      onClick={() => toggleTempSelection(item.id)}
                                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
                                        isSelected 
                                          ? 'bg-kodar-50/50 border-kodar-200' 
                                          : 'bg-white border-transparent hover:bg-gray-50'
                                      }`}
                                    >
                                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all flex-shrink-0 ${
                                        isSelected 
                                          ? 'bg-kodar-500 border-kodar-500' 
                                          : 'bg-white border-gray-300'
                                      }`}>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                      </div>
                                      <span className={`text-sm font-medium transition-colors ${isSelected ? 'text-kodar-800' : 'text-gray-700'}`}>
                                        {item.label}
                                      </span>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {category.items.map(item => {
                          const isSelected = tempSelected.includes(item.id);
                          return (
                            <div 
                              key={item.id} 
                              onClick={() => toggleTempSelection(item.id)}
                              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
                                isSelected 
                                  ? 'bg-kodar-50/50 border-kodar-200' 
                                  : 'bg-white border-transparent hover:bg-gray-50'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all flex-shrink-0 ${
                                isSelected 
                                  ? 'bg-kodar-500 border-kodar-500' 
                                  : 'bg-white border-gray-300'
                              }`}>
                                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                              </div>
                              <span className={`text-sm font-medium transition-colors ${isSelected ? 'text-kodar-800' : 'text-gray-700'}`}>
                                {item.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-100">
              <span className="text-sm font-bold text-gray-500">
                {tempSelected.length} selecionado(s)
              </span>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-gray-600 font-bold text-sm hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleApplyIndicators}
                  className="px-6 py-2.5 bg-kodar-600 hover:bg-kodar-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-kodar-200 transition-all active:scale-95 flex items-center gap-2"
                >
                  Adicionar Selecionados
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Global styles for custom scrollbar within this component scope */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
        }
      `}} />
    </div>
  );
};


