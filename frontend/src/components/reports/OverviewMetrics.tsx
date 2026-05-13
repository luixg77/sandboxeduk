"use client";

import React from "react";
import { OverviewMetrics as OverviewMetricsType } from "@/types/report";
import { Users, UserCheck, UserX, UserMinus } from "lucide-react";

interface OverviewMetricsProps {
  metrics: OverviewMetricsType;
}

export const OverviewMetrics: React.FC<OverviewMetricsProps> = ({ metrics }) => {
  const cards = [
    {
      title: "Matriculados",
      value: metrics.enrolled,
      icon: <Users className="w-6 h-6 text-kodar-500" />,
      bgColor: "bg-kodar-50",
      textColor: "text-kodar-600",
    },
    {
      title: "Presentes",
      value: metrics.present,
      icon: <UserCheck className="w-6 h-6 text-green-500" />,
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      title: "Ausentes",
      value: metrics.absent,
      icon: <UserX className="w-6 h-6 text-red-500" />,
      bgColor: "bg-red-50",
      textColor: "text-red-600",
    },
    {
      title: "ACD (Deficiência)",
      value: metrics.acd,
      icon: <UserMinus className="w-6 h-6 text-orange-500" />,
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{card.title}</p>
            <h3 className={`text-3xl font-bold ${card.textColor}`}>{card.value}</h3>
          </div>
          <div className={`p-4 rounded-full ${card.bgColor}`}>
            {card.icon}
          </div>
        </div>
      ))}
    </div>
  );
};
