"use client";

import React, { useState, useMemo, useEffect } from "react";
import { StudentPerformance } from "@/types/report";
import { Table } from "@/components/ui/Table";
import { Search, Eye, Filter, ChevronDown } from "lucide-react";
import { ProficiencyBadge } from "@/components/ui/ProficiencyBadge";
import { StudentMicrodataModal } from "@/components/reports/StudentMicrodataModal";

// Hook simples de debounce para evitar lag na digitação
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

interface StudentPerformanceTableProps {
  students: StudentPerformance[];
  gabarito?: {
    linguagens: string[];
    matematica: string[];
  };
}

export const StudentPerformanceTable: React.FC<StudentPerformanceTableProps> = ({ students, gabarito }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<string>("name_asc");
  const [selectedStudent, setSelectedStudent] = useState<StudentPerformance | null>(null);
  
  const itemsPerPage = 10;
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredStudents = useMemo(() => {
    let result = students;
    
    if (debouncedSearchTerm) {
      const lowerTerm = debouncedSearchTerm.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(lowerTerm));
    }

    // Ordenação (criando uma cópia para não mutar o array original)
    return [...result].sort((a, b) => {
      switch (sortOption) {
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "linguagensTRI_desc":
          return b.linguagensTRI - a.linguagensTRI;
        case "linguagensTRI_asc":
          return a.linguagensTRI - b.linguagensTRI;
        case "linguagensTCT_desc":
          return b.linguagensTCT - a.linguagensTCT;
        case "linguagensTCT_asc":
          return a.linguagensTCT - b.linguagensTCT;
        case "matematicaTRI_desc":
          return b.matematicaTRI - a.matematicaTRI;
        case "matematicaTRI_asc":
          return a.matematicaTRI - b.matematicaTRI;
        case "matematicaTCT_desc":
          return b.matematicaTCT - a.matematicaTCT;
        case "matematicaTCT_asc":
          return a.matematicaTCT - b.matematicaTCT;
        default:
          return 0;
      }
    });
  }, [students, debouncedSearchTerm, sortOption]);
  
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const paginatedStudents = useMemo(() => {
    return filteredStudents.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredStudents, currentPage, itemsPerPage]);

  const columns = [
    {
      header: "Nome do Aluno",
      accessor: "name" as keyof StudentPerformance,
      className: "font-semibold text-gray-900 w-[25%]",
    },
    {
      header: "Turma",
      accessor: "class" as keyof StudentPerformance,
    },
    {
      header: "Linguagens (TCT)",
      accessor: (row: StudentPerformance) => <span className="font-medium text-gray-600">{row.linguagensTCT}</span>,
    },
    {
      header: "Linguagens (TRI)",
      accessor: (row: StudentPerformance) => <span className="font-bold text-gray-800">{row.linguagensTRI}</span>,
    },
    {
      header: "Proficiência (Linguagens)",
      accessor: (row: StudentPerformance) => <ProficiencyBadge category={row.linguagensCategory} />,
    },
    {
      header: "Matemática (TCT)",
      accessor: (row: StudentPerformance) => <span className="font-medium text-gray-600">{row.matematicaTCT}</span>,
    },
    {
      header: "Matemática (TRI)",
      accessor: (row: StudentPerformance) => <span className="font-bold text-gray-800">{row.matematicaTRI}</span>,
    },
    {
      header: "Proficiência (Matemática)",
      accessor: (row: StudentPerformance) => <ProficiencyBadge category={row.matematicaCategory} />,
    },
    {
      header: "Ações",
      accessor: (row: StudentPerformance) => (
        <div className="flex justify-center">
          <button 
            onClick={() => setSelectedStudent(row)}
            title="Ver Raio-X"
            className="p-2 text-gray-400 hover:text-kodar-600 hover:bg-kodar-50 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-kodar-500/20"
          >
            <Eye className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Desempenho Individual dos Alunos</h3>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-[40%]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kodar-500 transition-colors bg-gray-50 focus:bg-white"
              placeholder="Buscar por nome do aluno..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // reset to page 1 on search
              }}
            />
          </div>

          <div className="w-full sm:w-auto relative group">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-2 py-1.5 focus-within:ring-2 focus-within:ring-kodar-500 focus-within:border-kodar-500 transition-all hover:bg-gray-100/50">
              <Filter className="w-4 h-4 text-kodar-600 flex-shrink-0" />
              <span className="text-sm font-bold text-gray-700 whitespace-nowrap hidden sm:inline">Filtros:</span>
              <div className="relative flex-1">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="w-full py-1 pl-1 pr-6 bg-transparent border-none focus:outline-none text-sm font-semibold text-gray-800 appearance-none cursor-pointer outline-none ring-0"
                >
                  <option value="name_asc">Ordem Alfabética</option>
                  <option value="linguagensTRI_desc">Linguagens (TRI) - Maior Nota</option>
                  <option value="linguagensTRI_asc">Linguagens (TRI) - Menor Nota</option>
                  <option value="linguagensTCT_desc">Linguagens (TCT) - Mais Acertos</option>
                  <option value="linguagensTCT_asc">Linguagens (TCT) - Menos Acertos</option>
                  <option value="matematicaTRI_desc">Matemática (TRI) - Maior Nota</option>
                  <option value="matematicaTRI_asc">Matemática (TRI) - Menor Nota</option>
                  <option value="matematicaTCT_desc">Matemática (TCT) - Mais Acertos</option>
                  <option value="matematicaTCT_asc">Matemática (TCT) - Menos Acertos</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Table
        data={paginatedStudents}
        columns={columns}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        emptyMessage="Nenhum aluno encontrado."
      />

      {selectedStudent && gabarito && (
        <StudentMicrodataModal 
          student={selectedStudent} 
          gabarito={gabarito}
          onClose={() => setSelectedStudent(null)} 
        />
      )}
    </div>
  );
};
