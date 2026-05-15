"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { StudentPerformance, QuestionStat } from "@/types/report";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { CheckCircle2, XCircle, Info, X, Users, ChevronDown, ChevronUp } from "lucide-react";

interface ItemAuditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: QuestionStat | null;
  students: StudentPerformance[];
  gabarito: string | null;
}

export const ItemAuditorModal: React.FC<ItemAuditorModalProps> = ({
  isOpen,
  onClose,
  question,
  students,
  gabarito,
}) => {
  const [mounted, setMounted] = useState(false);
  const [expandedAlt, setExpandedAlt] = useState<string | null>(gabarito);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setExpandedAlt(gabarito);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, gabarito]);

  if (!isOpen || !question || !mounted) return null;

  // Calcular estatísticas e agrupar alunos
  const alternatives = ["A", "B", "C", "D", "E"];
  const altGroups = alternatives.map((alt) => {
    const studentsWhoPicked = students.filter((s) => {
      const answers = question.subject === "Linguagens" ? s.linguagensAnswers : s.matematicaAnswers;
      return answers?.[question.number - 1] === alt;
    });
    return { name: alt, value: studentsWhoPicked.length, students: studentsWhoPicked };
  });

  const totalRespostas = altGroups.reduce((acc, curr) => acc + curr.value, 0);
  const correctGroup = altGroups.find(g => g.name === gabarito);
  const acertos = correctGroup ? correctGroup.value : 0;
  const erros = totalRespostas - acertos;

  const stats = altGroups.map(g => ({ name: g.name, value: g.value }));

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-50 px-6 py-5 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-kodar-100 p-2 rounded-lg text-kodar-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Auditoria da Questão {question.number}</h2>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{question.subject}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white border border-gray-200 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto bg-gray-50/30">
          <div className="space-y-6">
            {/* Resumo Rápido */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-emerald-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
                <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">Acertos da Turma</p>
                  <p className="text-3xl font-black text-emerald-700">{acertos} <span className="text-sm font-medium opacity-60">alunos</span></p>
                </div>
              </div>
              <div className="bg-white border border-red-100 p-5 rounded-2xl shadow-sm flex items-center gap-4">
                <div className="bg-red-50 p-3 rounded-xl text-red-600">
                  <XCircle className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1">Erros da Turma</p>
                  <p className="text-3xl font-black text-red-700">{erros} <span className="text-sm font-medium opacity-60">alunos</span></p>
                </div>
              </div>
            </div>

            {/* Gráfico de Distribuição */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 uppercase tracking-wide">
                  Frequência de Escolha por Alternativa
                </h4>
                <div className="px-4 py-1.5 bg-kodar-600 text-white text-xs font-black rounded-full shadow-lg shadow-kodar-200">
                  Gabarito: {gabarito}
                </div>
              </div>
              
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 14, fontWeight: 800, fill: '#64748b' }}
                    />
                    <YAxis axisLine={false} tickLine={false} hide />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 800 }}
                      formatter={(value: any) => [`${value} alunos`, "Escolhas"]}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={48}>
                      {stats.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.name === gabarito ? "#10b981" : "#e2e8f0"} 
                          className="hover:opacity-80 transition-opacity cursor-pointer"
                          onClick={() => setExpandedAlt(expandedAlt === entry.name ? null : entry.name)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Listagem de Alunos por Alternativa */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                Detalhamento Nominal
              </h4>
              {altGroups.map((group) => (
                <div 
                  key={group.name}
                  className={`bg-white rounded-xl border transition-all ${
                    expandedAlt === group.name ? "ring-2 ring-kodar-500 border-kodar-200" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <button 
                    onClick={() => setExpandedAlt(expandedAlt === group.name ? null : group.name)}
                    className="w-full px-5 py-4 flex items-center justify-between focus:outline-none"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${
                        group.name === gabarito ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600"
                      }`}>
                        {group.name}
                      </div>
                      <span className="text-base font-black text-gray-800 tracking-tight">
                        {group.value} {group.value === 1 ? "aluno selecionou" : "alunos selecionaram"}
                      </span>
                    </div>
                    {expandedAlt === group.name ? <ChevronUp className="w-5 h-5 text-gray-400"/> : <ChevronDown className="w-5 h-5 text-gray-400"/>}
                  </button>
                  
                  {expandedAlt === group.name && (
                    <div className="px-5 pb-5 pt-2 border-t border-gray-50 max-h-60 overflow-y-auto">
                      {group.students.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {group.students.sort((a, b) => a.name.localeCompare(b.name)).map(s => (
                            <div key={s.id} className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl text-[13px] sm:text-sm font-black text-gray-700 border border-gray-100 hover:border-kodar-200 hover:bg-white transition-all shadow-sm">
                              <div className="w-2 h-2 rounded-full bg-kodar-500 shadow-sm"></div>
                              {s.name}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic text-center py-2">Nenhum aluno escolheu esta alternativa.</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Insights Pedagógicos */}
            <div className="bg-kodar-50 border border-kodar-200 p-5 rounded-2xl flex gap-4 shadow-sm">
              <div className="bg-white p-2 rounded-xl text-kodar-600 h-fit shadow-sm">
                <Info className="w-6 h-6" />
              </div>
              <div className="text-sm text-kodar-900 leading-relaxed">
                <p className="font-bold text-base mb-1">Análise Pedagógica</p>
                {erros > acertos ? (
                  <p>Esta questão apresenta um desafio significativo para a turma. O alto índice de erro sugere que os distratores capturaram lacunas importantes de aprendizagem. Recomenda-se revisar o conceito base com o grupo.</p>
                ) : (
                  <p>Desempenho satisfatório. A maioria da turma compreendeu o item. Os alunos que erraram podem ser acompanhados individualmente para sanar dúvidas específicas.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
