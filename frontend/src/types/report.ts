export type PerformanceCategory = "Abaixo do Básico" | "Básico" | "Adequado" | "Avançado";
export type Subject = "Linguagens" | "Matemática" | "Todos";

export interface StudentPerformance {
  id: string;
  name: string;
  class: string;
  // Objetivas (Simulados)
  linguagensTCT: number; // Acertos (ex: 12)
  linguagensTRI: number; // Pontuação Calculada (ex: 270)
  linguagensCategory: PerformanceCategory;
  matematicaTCT: number;
  matematicaTRI: number;
  matematicaCategory: PerformanceCategory;
  
  // Respostas Individuais (Microdados)
  linguagensAnswers?: string[];
  matematicaAnswers?: string[];
  
  // Produção Textual (Redação)
  writingAdequation: number; // Adequação ao Gênero e ao Tema (ex: 3)
  writingCoherence: number; // Coerência e Coesão (ex: 2)
  writingStructure: number; // Estrutura e Organização (ex: 2)
  writingOrthography: number; // Ortografia e Pontuação (ex: 2)
  writingFinalScore: number; // Pontuação Final (ex: 56.25)
  writingCategory: PerformanceCategory;
}

export interface QuestionStat {
  id: string;
  number: number;
  subject: "Linguagens" | "Matemática";
  correctPercentage: number;
  colorCategory: "green" | "yellow" | "red";
}

export interface OverviewMetrics {
  enrolled: number;
  present: number;
  absent: number;
  acd: number; // Alunos com Deficiência
}

export interface WritingMetricsData {
  averageAdequation: number;
  averageCoherence: number;
  averageStructure: number;
  averageOrthography: number;
  proficiencyDistribution: Record<PerformanceCategory, number>;
}

export interface ReportData {
  metrics: OverviewMetrics;
  proficiencyLinguagens: Record<PerformanceCategory, number>;
  proficiencyMatematica: Record<PerformanceCategory, number>;
  questions: QuestionStat[];
  students: StudentPerformance[];
  writingMetrics: WritingMetricsData;
  gabarito?: {
    linguagens: string[];
    matematica: string[];
  };
}

export type ComparisonEntityType = "Escola" | "Turma" | "Aluno" | "Média Estadual";

export interface ComparisonEntity {
  id: string;
  type: ComparisonEntityType;
  value: string; // The selected class or student ID, empty for Escola/Média Estadual
  label: string; // Display name in legend
  color: string; // Hex color
}
