'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

export type ProfBtnVariant = 'primary' | 'secondary' | 'purple' | 'pink' | 'ghost' | 'white' | 'danger' | 'success';
export type ProfBtnSize    = 'xs' | 'sm' | 'md' | 'lg';

const variants: Record<ProfBtnVariant, string> = {
  primary:   'bg-gradient-to-r from-orange-500  to-orange-600  hover:from-orange-600  hover:to-orange-700  text-white shadow-lg shadow-orange-200/60',
  secondary: 'bg-gradient-to-r from-teal-500    to-teal-600    hover:from-teal-600    hover:to-teal-700    text-white shadow-lg shadow-teal-200/60',
  purple:    'bg-gradient-to-r from-purple-500  to-purple-600  hover:from-purple-600  hover:to-purple-700  text-white shadow-lg shadow-purple-200/60',
  pink:      'bg-gradient-to-r from-pink-500    to-pink-600    hover:from-pink-600    hover:to-pink-700    text-white shadow-lg shadow-pink-200/60',
  ghost:     'bg-white border-2 border-orange-400 text-orange-600 hover:bg-orange-50 hover:border-orange-500',
  white:     'bg-white text-orange-600 hover:bg-orange-50 shadow-md',
  danger:    'bg-gradient-to-r from-red-500     to-red-600     hover:from-red-600     hover:to-red-700     text-white shadow-lg shadow-red-200/60',
  success:   'bg-gradient-to-r from-green-500   to-green-600   hover:from-green-600   hover:to-green-700   text-white shadow-lg shadow-green-200/60',
};

const sizes: Record<ProfBtnSize, string> = {
  xs: 'px-3   py-1.5 text-xs  h-7  rounded-xl',
  sm: 'px-4   py-2   text-sm  h-9  rounded-xl',
  md: 'px-6   py-2.5 text-sm  h-11 rounded-2xl',
  lg: 'px-8   py-3   text-base h-13 rounded-2xl',
};

interface ProfessorButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  ProfBtnVariant;
  size?:     ProfBtnSize;
  children:  ReactNode;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  loading?:  boolean;
  fullWidth?: boolean;
}

export function ProfessorButton({
  variant  = 'primary',
  size     = 'md',
  children,
  iconLeft,
  iconRight,
  loading  = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ProfessorButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 font-bold
        transition-all duration-200 active:scale-[0.97]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${variants[variant]} ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        iconLeft && <span className="shrink-0 w-4 h-4 flex items-center">{iconLeft}</span>
      )}
      {children}
      {!loading && iconRight && <span className="shrink-0 w-4 h-4 flex items-center">{iconRight}</span>}
    </button>
  );
}
