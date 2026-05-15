"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { StudentPerformance, PerformanceCategory, Subject } from "@/types/report";
import { ProficiencyBadge } from "../ui/ProficiencyBadge";
import { Users, X, Search, GraduationCap } from "lucide-react";

interface ProficiencyListModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: PerformanceCategory | null;
  subject: Subject;
  students: StudentPerformance[];
}

export const ProficiencyListModal: React.FC<ProficiencyListModalProps> = ({
  isOpen,
  onClose,
  category,
  subject,
  students,
}) => {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !category || !mounted) return null;

  const filteredStudents = students.filter((s) => {
    const matchesCategory = 
      (subject === "Linguagens" && s.linguagensCategory === category) ||
      (subject === "Matemática" && s.matematicaCategory === category) ||
      (subject === "Redação" as any && s.writingCategory === category);
    
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-50 px-6 py-5 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl shadow-sm text-kodar-600 border border-gray-100">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Lista Nominal</h2>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{subject}</span>
                <span className="text-gray-300">•</span>
                <ProficiencyBadge category={category} />
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white border border-gray-200 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 bg-white border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Buscar aluno pelo nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-kodar-500 focus:border-kodar-500 outline-none transition-all font-medium"
            />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto bg-gray-50/30 flex-1">
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-4 px-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Users className="w-3.5 h-3.5" />
                {filteredStudents.length} {filteredStudents.length === 1 ? "Aluno encontrado" : "Alunos encontrados"}
              </h4>
            </div>

            {filteredStudents.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {filteredStudents.sort((a, b) => a.name.localeCompare(b.name)).map((student) => (
                  <div 
                    key={student.id} 
                    className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-kodar-200 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-kodar-50 flex items-center justify-center text-kodar-600 font-bold text-sm border border-kodar-100 group-hover:bg-kodar-600 group-hover:text-white transition-colors">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-base font-black text-gray-900 leading-tight">{student.name}</p>
                        <p className="text-[11px] text-gray-400 uppercase tracking-widest font-bold mt-0.5">Turma {student.class}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Proficiência</span>
                      <ProficiencyBadge category={category} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500 font-bold">Nenhum aluno encontrado.</p>
                <p className="text-gray-400 text-sm">Tente ajustar sua busca.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer info */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest">
            Relatório de Gestão Pedagógica • EduK Admin
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};
