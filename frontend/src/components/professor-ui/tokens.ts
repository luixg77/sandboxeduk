export const profColors = {
  // Hero
  heroBg:    '#E8760A',
  heroTeal:  '#0A6470',
  heroTeal2: '#0D9488',

  // Brand
  orange:   '#F97316',
  teal:     '#0D9488',
  purple:   '#8B5CF6',
  pink:     '#EC4899',
  green:    '#22C55E',
  amber:    '#F59E0B',

  // Subjects
  subjects: {
    matematica: { light: '#DBEAFE', text: '#1D4ED8',  icon: '#3B82F6' },
    portugues:  { light: '#FCE7F3', text: '#BE185D',  icon: '#EC4899' },
    ciencias:   { light: '#DCFCE7', text: '#15803D',  icon: '#22C55E' },
    historia:   { light: '#FEF3C7', text: '#92400E',  icon: '#F59E0B' },
    geografia:  { light: '#F0FDF4', text: '#166534',  icon: '#16A34A' },
    artes:      { light: '#F5F3FF', text: '#5B21B6',  icon: '#8B5CF6' },
    ed_fisica:  { light: '#FFF1F2', text: '#9F1239',  icon: '#F43F5E' },
  },

  // Status
  status: {
    concluido:   { light: '#DCFCE7', text: '#15803D' },
    em_progresso:{ light: '#FEF3C7', text: '#92400E' },
    pendente:    { light: '#F1F5F9', text: '#475569' },
    novo:        { light: '#EDE9FE', text: '#5B21B6' },
  },
} as const;

export const profRadius = {
  sm:   'rounded-xl',
  md:   'rounded-2xl',
  lg:   'rounded-3xl',
  full: 'rounded-full',
} as const;

export const profShadow = {
  sm:  'shadow-[0_2px_8px_rgba(0,0,0,0.08)]',
  md:  'shadow-[0_4px_16px_rgba(0,0,0,0.10)]',
  lg:  'shadow-[0_8px_32px_rgba(0,0,0,0.12)]',
  xl:  'shadow-[0_16px_48px_rgba(0,0,0,0.15)]',
} as const;
