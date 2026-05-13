"use client";

import React from "react";
import { filterOptions } from "@/hooks/useReportData";

interface ReportFiltersProps {
  filters: {
    school: string;
    year: string;
    class: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    school: string;
    year: string;
    class: string;
  }>>;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({ filters, setFilters }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-xl shadow-sm mb-6 border border-gray-100">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700">Unidade de Ensino</label>
        <div className="relative">
          <select
            value={filters.school}
            onChange={(e) => setFilters({ ...filters, school: e.target.value })}
            className="w-full appearance-none p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-kodar-500 text-gray-800 transition-colors cursor-pointer"
          >
            {filterOptions.schools.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700">Ano</label>
        <div className="relative">
          <select
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            className="w-full appearance-none p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-kodar-500 text-gray-800 transition-colors cursor-pointer"
          >
            {filterOptions.years.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-700">Turma</label>
        <div className="relative">
          <select
            value={filters.class}
            onChange={(e) => setFilters({ ...filters, class: e.target.value })}
            className="w-full appearance-none p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-kodar-500 text-gray-800 transition-colors cursor-pointer"
          >
            {filterOptions.classes.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>
    </div>
  );
};
