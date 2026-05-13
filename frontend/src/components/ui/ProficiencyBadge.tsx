import React from "react";

interface ProficiencyBadgeProps {
  category: string;
}

export const ProficiencyBadge: React.FC<ProficiencyBadgeProps> = ({ category }) => {
  const styles: Record<string, string> = {
    "Avançado": "bg-[#3b82f6] text-white border-transparent",
    "Adequado": "bg-[#10b981] text-white border-transparent",
    "Básico": "bg-[#f59e0b] text-white border-transparent",
    "Abaixo do Básico": "bg-[#ef4444] text-white border-transparent",
  };

  // Normalizar a string para remover espaços em branco extras caso ocorram no JSON
  const normalizedCategory = category?.trim() || "";
  const currentStyle = styles[normalizedCategory] || "bg-gray-100 text-gray-800 ring-1 ring-gray-500/20";

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase shadow-sm ${currentStyle}`}>
      {normalizedCategory || "Não Informado"}
    </span>
  );
};
