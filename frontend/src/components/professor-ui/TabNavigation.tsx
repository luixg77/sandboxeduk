'use client';

import { ReactNode } from 'react';

interface TabItem {
  id:       string;
  label:    string;
  badge?:   string | number;
  icon?:    ReactNode;
}

interface TabNavigationProps {
  tabs:       TabItem[];
  active:     string;
  onChange:   (id: string) => void;
  accentColor?: 'orange' | 'teal' | 'purple' | 'blue';
  className?: string;
}

const accentMap: Record<string, { text: string; border: string; bg: string; badge: string }> = {
  orange: { text: 'text-orange-600', border: 'border-orange-500', bg: 'bg-orange-50',  badge: 'bg-orange-100 text-orange-700' },
  teal:   { text: 'text-teal-600',   border: 'border-teal-500',   bg: 'bg-teal-50',    badge: 'bg-teal-100   text-teal-700' },
  purple: { text: 'text-purple-600', border: 'border-purple-500', bg: 'bg-purple-50',  badge: 'bg-purple-100 text-purple-700' },
  blue:   { text: 'text-blue-600',   border: 'border-blue-500',   bg: 'bg-blue-50',    badge: 'bg-blue-100   text-blue-700' },
};

export function TabNavigation({
  tabs,
  active,
  onChange,
  accentColor = 'orange',
  className   = '',
}: TabNavigationProps) {
  const ac = accentMap[accentColor];

  return (
    <div className={`border-b border-slate-200 ${className}`}>
      <div className="flex items-end gap-1 overflow-x-auto scrollbar-hide px-1">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                relative flex items-center gap-2 px-4 py-3 text-sm font-bold whitespace-nowrap
                border-b-2 transition-all duration-200 shrink-0
                ${isActive
                  ? `${ac.text} ${ac.border}`
                  : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-200'}
              `}
            >
              {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
              {tab.label}
              {tab.badge !== undefined && (
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${isActive ? ac.badge : 'bg-slate-100 text-slate-500'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
