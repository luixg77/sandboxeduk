import React, { forwardRef } from 'react';

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col w-full space-y-1.5">
        {label && (
          <label className="text-sm font-semibold text-slate-700">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`
              w-full h-11 px-4 appearance-none bg-slate-50 border rounded-xl text-slate-800 text-sm outline-none transition-all duration-200
              ${error 
                ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100' 
                : 'border-slate-200 hover:border-slate-300 focus:border-kodar-500 focus:bg-white focus:ring-4 focus:ring-kodar-500/10'
              }
              ${className}
            `}
            {...props}
          >
            <option value="" disabled>Selecione uma opção</option>
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          
          {/* Custom Chevron for select */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
        
        {error && (
          <span className="text-xs font-medium text-red-500 mt-1">{error}</span>
        )}
      </div>
    );
  }
);

SelectField.displayName = 'SelectField';
