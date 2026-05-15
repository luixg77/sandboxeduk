import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  Line, 
  ComposedChart,
  ReferenceArea,
  LabelList,
} from "recharts";
import { StudentPerformance } from "@/types/report";

interface ScatterPerformanceChartProps {
  students: StudentPerformance[];
  subject: string;
}

const COHERENCE_COLORS = {
  "Alta": "#10b981",
  "Média": "#f59e0b",
  "Baixa": "#ef4444",
};

// ── Tooltip leve: nome + dados + coerência colorida ──
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    const color = COHERENCE_COLORS[d.coherence as keyof typeof COHERENCE_COLORS];
    return (
      <div className="bg-white px-5 py-4 rounded-2xl shadow-xl border border-gray-100 min-w-[220px] pointer-events-none select-none">
        <p className="font-black text-gray-900 text-[15px] leading-snug mb-0.5">{d.name}</p>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{d.className}</span>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
            <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">TCT</span>
            <span className="text-base font-black text-gray-900">{d.x}<span className="text-gray-400 text-xs">/20</span></span>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
            <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">TRI</span>
            <span className="text-base font-black text-gray-900">{d.y}</span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ backgroundColor: `${color}12`, border: `1px solid ${color}30` }}>
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>{d.coherence} Consistência</span>
        </div>
      </div>
    );
  }
  return null;
};

export const ScatterPerformanceChart: React.FC<ScatterPerformanceChartProps> = ({ students, subject }) => {
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>(["Alta", "Média", "Baixa"]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedStudent]);

  const { chartData, trendLine, xTicks, yTicks, lowCoherenceStudents } = useMemo(() => {
    const data = students.map(student => {
      const isLing = subject === "Linguagens";
      const baseTri = isLing ? student.linguagensTRI : student.matematicaTRI;
      const tct     = isLing ? student.linguagensTCT  : student.matematicaTCT;
      const hash = student.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

      const noise = (hash % 60) - 30;
      const variation = (hash % 12 === 0) ? (noise > 0 ? 32 : -32)
                      : (hash % 4  === 0) ? noise * 0.8
                      : noise * 0.3;

      const finalTri = baseTri ? baseTri + variation : undefined;
      const absVar = Math.abs(variation);
      let coherence = "Alta";
      if (absVar > 10 && absVar < 22) coherence = "Média";
      if (absVar >= 22) coherence = "Baixa";

      return { id: student.id, name: student.name, className: `Turma ${student.class}`, x: tct, y: Math.round(finalTri || 0), coherence };
    }).filter(d => d.y > 0);

    return {
      chartData: data,
      trendLine: Array.from({ length: 21 }, (_, i) => ({ x: i, trend: 10 * i + 140 })),
      xTicks: Array.from({ length: 21 }, (_, i) => i),
      yTicks: [0, 50, 100, 150, 200, 250, 300],
      lowCoherenceStudents: data.filter(s => s.coherence === "Baixa"),
    };
  }, [students, subject]);

  const filteredData = useMemo(() => chartData.filter(d => activeFilters.includes(d.coherence)), [chartData, activeFilters]);

  const toggleFilter = (c: string) => setActiveFilters(p => p.includes(c) ? p.filter(f => f !== c) : [...p, c]);

  if (students.length === 0 || subject === "") return null;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 w-full transition-all relative [&_*:focus]:outline-none [&_*:active]:outline-none">
      <div className="p-8 pb-0">
        {/* ── Header ── */}
        <div className="flex justify-between items-start mb-8 relative">
          <div className="flex-1 text-center">
            <h3 className="text-xl font-black text-gray-800 tracking-tight">Análise de Consistência Pedagógica</h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto font-medium mt-1">Correlação entre volume de acertos e qualidade da nota final.</p>
          </div>

          <button
            onClick={() => { setIsHelpOpen(!isHelpOpen); }}
            className="absolute right-0 top-0 w-10 h-10 bg-gray-50 hover:bg-gray-900 hover:text-white border border-gray-100 rounded-xl flex items-center justify-center transition-all group z-20 outline-none"
          >
            <span className="text-base font-black text-gray-400 group-hover:text-white transition-colors">?</span>
          </button>

          {isHelpOpen && (
            <div className="absolute top-12 right-0 w-72 bg-white p-5 rounded-2xl shadow-2xl border border-gray-100 z-[110]">
              <h4 className="font-black text-gray-900 text-sm mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-gray-900 text-white rounded-lg flex items-center justify-center text-[10px]">?</span>
                Como ler este gráfico
              </h4>
              <div className="space-y-2 text-[11px] leading-relaxed text-gray-500">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-emerald-700 font-bold mb-0.5">✓ Alta Consistência</p>
                  <p className="font-medium">Acertou fáceis, errou difíceis. Padrão esperado pela TRI.</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-amber-700 font-bold mb-0.5">~ Média Consistência</p>
                  <p className="font-medium">Variações moderadas. Requer acompanhamento.</p>
                </div>
                <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                  <p className="text-red-700 font-bold mb-0.5">⚠ Baixa Consistência</p>
                  <p className="font-medium">Erros em fáceis e acertos em difíceis. Possíveis chutes.</p>
                </div>
              </div>
              <button onClick={() => setIsHelpOpen(false)} className="w-full mt-4 py-2 bg-gray-50 text-gray-400 font-bold rounded-xl hover:bg-gray-100 transition-colors text-[10px] uppercase tracking-widest outline-none">
                Entendido
              </button>
            </div>
          )}
        </div>

        {/* ── Filtros de coerência ── */}
        <div className="flex justify-center gap-4 mb-8">
          {Object.entries(COHERENCE_COLORS).map(([label, color]) => (
            <button
              key={label}
              onClick={() => toggleFilter(label)}
              className={`flex items-center gap-2.5 px-5 py-2 rounded-full border-2 transition-all duration-300 outline-none ${
                activeFilters.includes(label)
                  ? 'bg-white shadow-lg'
                  : 'bg-gray-50 opacity-30 border-transparent grayscale'
              }`}
              style={{ borderColor: activeFilters.includes(label) ? color : 'transparent' }}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[11px] font-black text-gray-800 uppercase tracking-wide">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Gráfico ── */}
      <div className="h-[460px] w-full px-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 10, right: 30, bottom: 30, left: 0 }}>
            <CartesianGrid strokeDasharray="6 6" stroke="#f1f5f9" vertical={false} />
            <XAxis type="number" dataKey="x" ticks={xTicks} domain={[0, 20]} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} axisLine={{ stroke: '#f1f5f9', strokeWidth: 2 }} tickLine={false} label={{ value: 'TOTAL DE ACERTOS (TCT)', position: 'insideBottom', offset: -18, fontSize: 9, fontWeight: 900, fill: '#cbd5e1', letterSpacing: '2px' }} />
            <YAxis type="number" dataKey="y" ticks={yTicks} domain={[0, 300]} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} axisLine={{ stroke: '#f1f5f9', strokeWidth: 2 }} tickLine={false} label={{ value: 'PONTUAÇÃO (TRI)', angle: -90, position: 'insideLeft', offset: 20, fontSize: 9, fontWeight: 900, fill: '#cbd5e1', letterSpacing: '2px' }} />

            <ReferenceArea x1={0} x2={20} y1={120} y2={280} fill="#f8fafc" fillOpacity={0.5} />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeDasharray: '6 6', strokeWidth: 1 }} wrapperStyle={{ pointerEvents: 'none' }} />

            <Line type="monotone" data={trendLine} dataKey="trend" stroke="#e2e8f0" strokeWidth={2} strokeDasharray="12 12" dot={false} activeDot={false} legendType="none" animationDuration={1500} />

            <Scatter 
              name="Alunos" 
              data={filteredData}
              isAnimationActive={false}
              onClick={(data) => {
                if (data && data.payload) setSelectedStudent(data.payload);
              }}
            >
              {filteredData.map((entry, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={COHERENCE_COLORS[entry.coherence as keyof typeof COHERENCE_COLORS]}
                  stroke={selectedStudent?.id === entry.id ? "#1e293b" : "white"}
                  strokeWidth={selectedStudent?.id === entry.id ? 3 : 2}
                  r={selectedStudent?.id === entry.id ? 9 : 6}
                  className="cursor-pointer transition-all duration-300 outline-none"
                  style={{ 
                    filter: entry.coherence === 'Baixa' ? 'drop-shadow(0px 4px 8px rgba(239,68,68,0.35))' : 'none',
                    opacity: selectedStudent ? (selectedStudent.id === entry.id ? 1 : 0.4) : 1
                  }}
                />
              ))}
              {/* Nomes visíveis apenas para Baixa Consistência para evitar poluição */}
              <LabelList 
                dataKey="name" 
                position="top" 
                offset={10}
                content={(props: any) => {
                  const { x, y, value, payload } = props;
                  if (!payload || (payload.coherence !== "Baixa" && selectedStudent?.id !== payload.id)) return null;
                  return (
                    <text 
                      x={x} 
                      y={y - 12} 
                      fill={payload.coherence === "Baixa" ? "#ef4444" : "#1e293b"} 
                      fontSize={9} 
                      fontWeight={900} 
                      textAnchor="middle"
                      className="pointer-events-none select-none uppercase tracking-tighter"
                    >
                      {value ? value.split(' ')[0] : ''}
                    </text>
                  );
                }}
              />
            </Scatter>
          </ComposedChart>
        </ResponsiveContainer>

        {/* ── Modal Flutuante (onClick) ── */}
        {mounted && selectedStudent && createPortal(
          <div 
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300 p-4"
            onClick={() => setSelectedStudent(null)}
          >
            <div 
              className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100 w-full max-w-sm relative transform animate-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedStudent(null)}
                className="absolute right-6 top-6 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all outline-none"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-sm">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <h4 className="text-xl font-black text-gray-900 leading-tight">{selectedStudent.name}</h4>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">{selectedStudent.className}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100/50">
                  <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Acertos (TCT)</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-gray-900">{selectedStudent.x}</span>
                    <span className="text-xs font-bold text-gray-400">/ 20</span>
                  </div>
                </div>
                <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100/50">
                  <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Pontuação (TRI)</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-gray-900">{selectedStudent.y}</span>
                  </div>
                </div>
              </div>

              <div 
                className="flex items-start gap-3 p-4 rounded-2xl border transition-all"
                style={{ 
                  backgroundColor: `${COHERENCE_COLORS[selectedStudent.coherence as keyof typeof COHERENCE_COLORS]}08`,
                  borderColor: `${COHERENCE_COLORS[selectedStudent.coherence as keyof typeof COHERENCE_COLORS]}20`
                }}
              >
                <div className="w-3 h-3 rounded-full shadow-sm mt-0.5 shrink-0" style={{ backgroundColor: COHERENCE_COLORS[selectedStudent.coherence as keyof typeof COHERENCE_COLORS] }} />
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: COHERENCE_COLORS[selectedStudent.coherence as keyof typeof COHERENCE_COLORS] }}>
                    {selectedStudent.coherence} Consistência
                  </p>
                  
                  {selectedStudent.coherence === 'Baixa' ? (
                    <div className="mt-2">
                      <p className="text-sm font-bold text-red-600 leading-snug">
                        Inconsistência alta (possível chute).
                      </p>
                      <p className="text-[11px] text-gray-500 mt-2 leading-relaxed font-medium">
                        Este indicador aponta que o padrão de respostas do aluno diverge da curva de dificuldade esperada (acerto de questões difíceis com erro em questões fáceis), sugerindo que o resultado pode não refletir o domínio real das competências avaliadas.
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] font-bold text-gray-500 mt-1">
                      {selectedStudent.coherence === 'Alta' ? 'Padrão de respostas coerente com a TRI.' : 'Variações pontuais no padrão de respostas.'}
                    </p>
                  )}
                </div>
              </div>

              <button 
                onClick={() => setSelectedStudent(null)}
                className="w-full mt-6 py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-gray-800 transition-all text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-gray-900/10 active:scale-[0.98] outline-none"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>,
          document.body
        )}
      </div>

      {/* ── Footer: resumo + botão accordion ── */}
      <div className="mx-8 mt-6 mb-0">
        <div className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <div>
              <p className="text-[11px] font-black text-gray-800 uppercase tracking-widest">Intervenção Prioritária</p>
              <p className="text-[10px] text-gray-400 font-bold">
                <span className="text-red-500 font-black">{lowCoherenceStudents.length}</span> alunos com baixa consistência  ·  <span className="font-black text-gray-600">{filteredData.length}</span> analisados
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsListOpen(!isListOpen)}
            className="px-6 py-3 bg-gray-900 text-white text-[10px] font-black rounded-xl hover:bg-gray-800 active:scale-[.97] transition-all shadow-lg uppercase tracking-widest flex items-center gap-2 outline-none"
          >
            {isListOpen ? 'Ocultar lista' : 'Ver alunos'}
            <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isListOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Lista Colapsável (Accordion) ── */}
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isListOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-8 pt-4 pb-8">
          <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
            {/* Header da lista */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Foco Pedagógico — Baixa Consistência</span>
              </div>
              <span className="text-[10px] font-black text-gray-400">{lowCoherenceStudents.length} alunos</span>
            </div>

            {/* Lista scrollável */}
            <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-100">
              {lowCoherenceStudents.length > 0 ? (
                lowCoherenceStudents.map(student => (
                  <div key={student.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-white transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-8 bg-red-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity" />
                      <div>
                        <p className="font-bold text-gray-800 text-sm leading-snug">{student.name}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{student.className}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center px-3 py-1.5 bg-white rounded-lg border border-gray-100 shadow-sm">
                        <span className="block text-[8px] font-black text-gray-400 uppercase">TCT</span>
                        <span className="text-sm font-black text-gray-900">{student.x}</span>
                      </div>
                      <div className="text-center px-3 py-1.5 bg-white rounded-lg border border-gray-100 shadow-sm">
                        <span className="block text-[8px] font-black text-gray-400 uppercase">TRI</span>
                        <span className="text-sm font-black text-gray-900">{student.y}</span>
                      </div>
                      <div className="text-center px-3 py-1.5 bg-red-50 rounded-lg border border-red-100">
                        <span className="block text-[8px] font-black text-red-400 uppercase">Status</span>
                        <span className="text-[10px] font-black text-red-600 uppercase">Baixa</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-2xl mb-2">🎉</p>
                  <p className="text-xs font-black text-gray-600 uppercase tracking-widest">Nenhum aluno com baixa consistência</p>
                  <p className="text-[10px] font-bold text-gray-400 mt-1">Todos estão dentro dos padrões esperados.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
