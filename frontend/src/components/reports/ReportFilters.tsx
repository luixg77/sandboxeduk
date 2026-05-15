"use client";

import React, { useMemo } from "react";
import { filterOptions } from "@/hooks/useReportData";

interface ReportFiltersProps {
  filters: {
    school: string;
    year: string;
    class: string;
    subject: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    school: string;
    year: string;
    class: string;
    subject: string;
  }>>;
}

// ── Select customizado com design premium ──
const FilterSelect = ({
  label,
  icon,
  value,
  onChange,
  options,
  disabled = false,
  highlight = false,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  highlight?: boolean;
}) => (
  <div className="flex flex-col gap-2.5 h-full justify-between">
    <div className="space-y-2.5">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-1.5 h-4">
        {icon}
        {label}
      </label>
      <div className="relative group">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`
            w-full appearance-none px-4 py-3.5 pr-10 
            rounded-2xl text-sm font-bold transition-all duration-300 cursor-pointer
            outline-none
            ${disabled
              ? 'bg-gray-50 text-gray-300 border-2 border-gray-100 cursor-not-allowed opacity-50'
              : highlight
                ? 'bg-kodar-50 text-kodar-800 border-2 border-kodar-200 hover:border-kodar-400 focus:border-kodar-500 focus:ring-4 focus:ring-kodar-100 shadow-sm hover:shadow-md'
                : 'bg-white text-gray-800 border-2 border-gray-200 hover:border-gray-300 focus:border-kodar-400 focus:ring-4 focus:ring-kodar-50 shadow-sm hover:shadow-md'
            }
          `}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {/* Chevron customizado */}
        <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 transition-colors ${disabled ? 'text-gray-200' : 'text-gray-400 group-hover:text-kodar-500'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
    <div className="h-4 flex items-center">
      {disabled && (
        <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest flex items-center gap-1 animate-pulse">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          Bloqueado
        </p>
      )}
    </div>
  </div>
);

export const ReportFilters: React.FC<ReportFiltersProps> = ({ filters, setFilters }) => {
  const hasSubject = filters.subject !== "";

  // Ao mudar disciplina, resetar escola para default e manter cascata
  const handleSubjectChange = (value: string) => {
    setFilters({
      subject: value,
      school: value ? "EMEB BENTO ELOI GARCIA" : "",
      year: "all",
      class: "all",
    });
  };

  const handleSchoolChange = (value: string) => {
    setFilters(prev => ({ ...prev, school: value, year: "all", class: "all" }));
  };

  const handleYearChange = (value: string) => {
    setFilters(prev => ({ ...prev, year: value, class: "all" }));
  };

  const handleClassChange = (value: string) => {
    setFilters(prev => ({ ...prev, class: value }));
  };

  // Ícones inline
  const iconSubject = (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
  );
  const iconSchool = (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
  );
  const iconYear = (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
  );
  const iconClass = (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  );

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      {/* Linha de status da cascata */}
      <div className="flex items-center gap-2 mb-5">
        <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${filters.subject ? 'bg-kodar-500' : 'bg-gray-100'}`} />
        <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${hasSubject ? 'bg-kodar-400' : 'bg-gray-100'}`} />
        <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${hasSubject && filters.year !== '' ? 'bg-kodar-300' : 'bg-gray-100'}`} />
        <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${hasSubject && filters.class !== '' ? 'bg-kodar-200' : 'bg-gray-100'}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-start">
        <FilterSelect
          label="Componente Curricular"
          icon={iconSubject}
          value={filters.subject}
          onChange={handleSubjectChange}
          options={filterOptions.subjects}
          highlight={true}
        />

        <FilterSelect
          label="Unidade de Ensino"
          icon={iconSchool}
          value={filters.school}
          onChange={handleSchoolChange}
          options={filterOptions.schools}
          disabled={!hasSubject}
        />

        <FilterSelect
          label="Ano"
          icon={iconYear}
          value={filters.year}
          onChange={handleYearChange}
          options={filterOptions.years}
          disabled={!hasSubject}
        />

        <FilterSelect
          label="Turma"
          icon={iconClass}
          value={filters.class}
          onChange={handleClassChange}
          options={filterOptions.classes}
          disabled={!hasSubject}
        />
      </div>
    </div>
  );
};
