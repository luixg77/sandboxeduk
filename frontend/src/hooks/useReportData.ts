"use client";

import { useState, useEffect } from "react";
import { ReportData, PerformanceCategory, QuestionStat } from "../types/report";
import allData from "../data/allData.json";

export const filterOptions = {
  schools: [
    { value: "EMEB BENTO ELOI GARCIA", label: "EMEB BENTO ELOI GARCIA" }
  ],
  years: [
    { value: "all", label: "Todos os Anos" },
    { value: "5º Ano", label: "5º Ano" },
    { value: "9º Ano", label: "9º Ano" },
  ],
  classes: [
    { value: "all", label: "Todas as Turmas" },
    ...Array.from(new Set(allData.students.map(s => s.class))).sort().map(c => ({
      value: c,
      label: `Turma ${c}`
    }))
  ],
};

export const useReportData = (filters: { school: string; year: string; class: string }) => {
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    
    // Simula rede, mas calcula dados reais on the fly
    const timer = setTimeout(() => {
      let filteredStudents = allData.students;
      
      // Filtrando pela turma
      if (filters.class !== "all") {
        filteredStudents = filteredStudents.filter(s => s.class === filters.class);
      }
      
      // Overview Metrics
      const metrics = {
        enrolled: filteredStudents.length,
        present: filteredStudents.length, // Na planilha já limpamos ausentes para notas
        absent: 0, 
        acd: 0 // Mock simples
      };

      // Calculando Proficiência de Linguagens e Matemática
      const profLing: Record<PerformanceCategory, number> = { "Abaixo do Básico": 0, "Básico": 0, "Adequado": 0, "Avançado": 0 };
      const profMat: Record<PerformanceCategory, number> = { "Abaixo do Básico": 0, "Básico": 0, "Adequado": 0, "Avançado": 0 };
      
      let writeAdeq = 0, writeCoh = 0, writeStr = 0, writeOrt = 0;
      const profWrite: Record<PerformanceCategory, number> = { "Abaixo do Básico": 0, "Básico": 0, "Adequado": 0, "Avançado": 0 };

      // Contagem de acertos por questão (Linguagens = 21, Mat = 22)
      const qLinCount = Array(21).fill(0);
      const qMatCount = Array(22).fill(0);

      filteredStudents.forEach(s => {
        if (profLing[s.linguagensCategory] !== undefined) profLing[s.linguagensCategory]++;
        if (profMat[s.matematicaCategory] !== undefined) profMat[s.matematicaCategory]++;
        if (profWrite[s.writingCategory] !== undefined) profWrite[s.writingCategory]++;
        
        writeAdeq += s.writingAdequation;
        writeCoh += s.writingCoherence;
        writeStr += s.writingStructure;
        writeOrt += s.writingOrthography;

        s.linguagensAnswers?.forEach((ans, i) => {
          if (ans === allData.gabarito.linguagens[i]) qLinCount[i]++;
        });
        s.matematicaAnswers?.forEach((ans, i) => {
          if (ans === allData.gabarito.matematica[i]) qMatCount[i]++;
        });
      });

      const totalStudents = filteredStudents.length || 1;

      const questions: QuestionStat[] = [];
      qLinCount.forEach((c, i) => {
        const pct = Math.round((c / totalStudents) * 100);
        questions.push({
          id: `lin-${i+1}`,
          number: i+1,
          subject: "Linguagens",
          correctPercentage: pct,
          colorCategory: pct >= 70 ? "green" : pct >= 50 ? "yellow" : "red"
        });
      });
      qMatCount.forEach((c, i) => {
        const pct = Math.round((c / totalStudents) * 100);
        questions.push({
          id: `mat-${i+1}`,
          number: i+1,
          subject: "Matemática",
          correctPercentage: pct,
          colorCategory: pct >= 70 ? "green" : pct >= 50 ? "yellow" : "red"
        });
      });

      const writingMetrics = {
        averageAdequation: Number((writeAdeq / totalStudents).toFixed(1)),
        averageCoherence: Number((writeCoh / totalStudents).toFixed(1)),
        averageStructure: Number((writeStr / totalStudents).toFixed(1)),
        averageOrthography: Number((writeOrt / totalStudents).toFixed(1)),
        proficiencyDistribution: profWrite
      };

      const computedData: ReportData = {
        metrics,
        proficiencyLinguagens: profLing,
        proficiencyMatematica: profMat,
        questions,
        students: filteredStudents,
        writingMetrics,
        gabarito: allData.gabarito
      };

      setData(computedData);
      setIsLoading(false);
    }, 400); 

    return () => clearTimeout(timer);
  }, [filters]);

  return { data, isLoading };
};
