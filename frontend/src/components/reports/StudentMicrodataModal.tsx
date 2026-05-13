import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { StudentPerformance } from "@/types/report";
import { X, CheckCircle2, XCircle, Award, Target, FileText, LayoutGrid } from "lucide-react";
import { ProficiencyBadge } from "@/components/ui/ProficiencyBadge";

interface StudentMicrodataModalProps {
  student: StudentPerformance;
  gabarito: {
    linguagens: string[];
    matematica: string[];
  };
  onClose: () => void;
}

export const StudentMicrodataModal: React.FC<StudentMicrodataModalProps> = ({ student, gabarito, onClose }) => {
  const renderAnswersGrid = (title: string, answers: string[], correctAnswers: string[], icon: React.ReactNode) => {
    if (!answers || !answers.length) return null;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          {icon}
          <h4 className="font-bold text-gray-800">{title}</h4>
        </div>
        <div className="p-4 grid grid-cols-5 sm:grid-cols-7 md:grid-cols-11 gap-2">
          {answers.map((ans, idx) => {
            const correct = correctAnswers[idx];
            const isRight = ans === correct;
            const isMissing = ans === "-" || !ans;

            return (
              <div 
                key={idx} 
                className={`relative flex flex-col items-center justify-center p-2 rounded-lg border ${
                  isRight ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                }`}
              >
                <span className="text-[10px] font-bold text-gray-500 mb-1">Q{idx + 1}</span>
                <span className={`text-lg font-black leading-none ${isRight ? "text-green-700" : "text-red-700"}`}>
                  {isMissing ? "?" : ans}
                </span>
                
                {!isRight && !isMissing && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-white border border-red-200 rounded-full flex items-center justify-center shadow-sm z-10" title={`Correta: ${correct}`}>
                    <span className="text-[9px] font-black text-red-600">{correct}</span>
                  </div>
                )}
                {isMissing && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm z-10" title={`Correta: ${correct}`}>
                    <span className="text-[9px] font-black text-gray-600">{correct}</span>
                  </div>
                )}
                {isRight && (
                  <CheckCircle2 className="w-4 h-4 text-green-500 absolute -top-1.5 -right-1.5 bg-white rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWritingScore = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
      <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-500" />
          <h4 className="font-bold text-gray-800">Produção Textual</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Nota Final:</span>
          <span className="font-black text-kodar-600 text-lg">{student.writingFinalScore.toFixed(2)}</span>
          <ProficiencyBadge category={student.writingCategory} />
        </div>
      </div>
      <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Adequação", value: student.writingAdequation },
          { label: "Coerência", value: student.writingCoherence },
          { label: "Estrutura", value: student.writingStructure },
          { label: "Ortografia", value: student.writingOrthography },
        ].map((item, idx) => (
          <div key={idx} className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
            <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">{item.label}</span>
            <span className="text-xl font-bold text-gray-800">{item.value}<span className="text-sm text-gray-400 font-medium">/4</span></span>
          </div>
        ))}
      </div>
    </div>
  );

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Prevent scrolling on body when modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()} // Evita fechar ao clicar dentro do modal
      >
        
        {/* Header */}
        <div className="bg-gray-50 px-6 py-5 border-b border-gray-200 flex justify-between items-start sticky top-0 z-10">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
              <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-md">Turma {student.class}</span>
            </div>
            <p className="text-sm text-gray-500 flex items-center gap-1.5"><Target className="w-4 h-4"/> Raio-X de Desempenho Individual</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white border border-gray-200 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto bg-gray-50/50">
          
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Linguagens</h4>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-black text-gray-800">{student.linguagensTRI}</span>
                  <span className="text-sm font-medium text-gray-500">TRI</span>
                  <span className="text-xs font-bold text-gray-400 px-2 border-l border-gray-200">{student.linguagensTCT} Acertos</span>
                </div>
                <ProficiencyBadge category={student.linguagensCategory} />
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                <Award className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Matemática</h4>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-black text-gray-800">{student.matematicaTRI}</span>
                  <span className="text-sm font-medium text-gray-500">TRI</span>
                  <span className="text-xs font-bold text-gray-400 px-2 border-l border-gray-200">{student.matematicaTCT} Acertos</span>
                </div>
                <ProficiencyBadge category={student.matematicaCategory} />
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Microdados */}
          {renderWritingScore()}
          
          {student.linguagensAnswers && gabarito.linguagens && 
            renderAnswersGrid("Respostas - Linguagens", student.linguagensAnswers, gabarito.linguagens, <LayoutGrid className="w-4 h-4 text-gray-500"/>)
          }
          
          {student.matematicaAnswers && gabarito.matematica && 
            renderAnswersGrid("Respostas - Matemática", student.matematicaAnswers, gabarito.matematica, <LayoutGrid className="w-4 h-4 text-gray-500"/>)
          }

        </div>

      </div>
    </div>,
    document.body
  );
};
