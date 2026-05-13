'use client';

import { ReactNode, SelectHTMLAttributes, useState, useRef, useEffect, useCallback } from 'react';

/* ─────────────────────────────────────────
   Simple Select (single, native)
───────────────────────────────────────── */
interface FilterSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  icon?:        ReactNode;
  options:      { value: string; label: string }[];
  placeholder?: string;
  accentColor?: 'orange' | 'teal' | 'blue';
  className?:   string;
}

const accentMap: Record<string, { border: string; focus: string; text: string; icon: string }> = {
  orange: { border: 'border-orange-200 hover:border-orange-400 focus-within:border-orange-500', focus: 'ring-orange-100', text: 'text-orange-600', icon: 'text-orange-400' },
  teal:   { border: 'border-teal-200   hover:border-teal-400   focus-within:border-teal-500',   focus: 'ring-teal-100',   text: 'text-teal-600',   icon: 'text-teal-400' },
  blue:   { border: 'border-blue-200   hover:border-blue-400   focus-within:border-blue-500',   focus: 'ring-blue-100',   text: 'text-blue-600',   icon: 'text-blue-400' },
};

export function FilterSelect({
  icon,
  options,
  placeholder = 'Selecionar',
  accentColor = 'blue',
  className   = '',
  ...props
}: FilterSelectProps) {
  const ac = accentMap[accentColor];
  return (
    <div className={`relative flex items-center gap-2 bg-white rounded-2xl border px-3 h-12 transition-all duration-150 focus-within:ring-2 ${ac.border} ${ac.focus} ${className}`}>
      {icon && <span className={`w-5 h-5 shrink-0 ${ac.icon}`}>{icon}</span>}
      <select
        className={`appearance-none bg-transparent flex-1 text-sm font-semibold outline-none cursor-pointer pr-6 ${props.value ? ac.text : 'text-slate-400'}`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <svg className={`absolute right-3 w-4 h-4 pointer-events-none shrink-0 ${ac.icon}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────
   Multi-Select com busca
───────────────────────────────────────── */
export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  icon?:        ReactNode;
  options:      MultiSelectOption[];
  selected:     string[];
  onChange:     (values: string[]) => void;
  placeholder?: string;
  accentColor?: 'orange' | 'teal' | 'blue';
  maxVisible?:  number;
  className?:   string;
}

export function MultiSelect({
  icon,
  options,
  selected,
  onChange,
  placeholder = 'Selecionar',
  accentColor = 'blue',
  maxVisible  = 2,
  className   = '',
}: MultiSelectProps) {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  const ac      = accentMap[accentColor];

  /* fecha ao clicar fora */
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = useCallback((value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter(v => v !== value)
        : [...selected, value]
    );
  }, [selected, onChange]);

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  /* Labels dos selecionados */
  const selectedLabels = selected
    .map(v => options.find(o => o.value === v)?.label ?? v);

  const visibleTags  = selectedLabels.slice(0, maxVisible);
  const hiddenCount  = selectedLabels.length - visibleTags.length;

  return (
    <div ref={wrapRef} className={`relative ${className}`}>

      {/* ── Trigger ── */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`
          w-full flex items-center gap-2 bg-white rounded-2xl border px-3 min-h-[48px] py-2
          transition-all duration-150 text-left
          ${open ? `${ac.border.split(' ')[2]} ring-2 ${ac.focus}` : ac.border}
        `}
      >
        {icon && <span className={`w-5 h-5 shrink-0 ${ac.icon}`}>{icon}</span>}

        <div className="flex-1 flex flex-wrap gap-1 min-w-0">
          {selected.length === 0 ? (
            <span className="text-sm font-semibold text-slate-400 leading-none self-center">{placeholder}</span>
          ) : (
            <>
              {visibleTags.map(label => (
                <span key={label} className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 ${ac.text}`}>
                  {label}
                </span>
              ))}
              {hiddenCount > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                  +{hiddenCount}
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selected.length > 0 && (
            <span
              onClick={clearAll}
              className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" className="w-3 h-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          )}
          <svg className={`w-4 h-4 transition-transform duration-200 ${ac.icon} ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div className="absolute z-50 top-[calc(100%+6px)] left-0 right-0 bg-white rounded-2xl border border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden">

          {/* Search */}
          <div className="p-2 border-b border-slate-100">
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 h-9">
              <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Pesquisar..."
                className="flex-1 text-sm font-semibold bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
                  <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Options */}
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-slate-400 font-semibold text-center">
                Nenhum resultado
              </li>
            ) : (
              filtered.map(opt => {
                const isSelected = selected.includes(opt.value);
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onClick={() => toggle(opt.value)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-left transition-colors
                        ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}
                      `}
                    >
                      {/* Checkbox */}
                      <span className={`w-4 h-4 rounded-[5px] border-2 flex items-center justify-center shrink-0 transition-colors
                        ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}
                      `}>
                        {isSelected && (
                          <svg fill="none" stroke="white" strokeWidth={3} viewBox="0 0 24 24" className="w-2.5 h-2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </span>
                      {opt.label}
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          {/* Footer */}
          {selected.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">{selected.length} selecionado{selected.length > 1 ? 's' : ''}</span>
              <button onClick={clearAll} className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors">
                Limpar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   Search Input
───────────────────────────────────────── */
interface SearchInputProps {
  value:        string;
  onChange:     (v: string) => void;
  placeholder?: string;
  className?:   string;
}

export function SearchInput({ value, onChange, placeholder = 'Buscar...', className = '' }: SearchInputProps) {
  return (
    <div className={`relative flex items-center bg-white rounded-2xl border border-slate-200 hover:border-slate-300 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all h-12 px-4 gap-3 ${className}`}>
      <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 text-sm font-semibold text-slate-700 placeholder:text-slate-400 bg-transparent outline-none"
      />
      {value && (
        <button onClick={() => onChange('')} className="w-4 h-4 text-slate-400 hover:text-slate-600 shrink-0">
          <svg fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
