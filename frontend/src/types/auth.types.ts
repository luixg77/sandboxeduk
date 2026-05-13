export type UserRole = 'admin' | 'coordenador' | 'gestor' | 'professor';

export const ROLE_ROUTES: Record<UserRole, string> = {
  admin:       '/admin',
  coordenador: '/coordenador',
  gestor:      '/gestor',
  professor:   '/professor',
};

export const PROTECTED_ROUTES: Record<string, UserRole> = {
  '/admin':       'admin',
  '/coordenador': 'coordenador',
  '/gestor':      'gestor',
  '/professor':   'professor',
};

export interface AuthUser {
  id:           string;
  email:        string;
  role:         UserRole;
  schoolName?:  string;
  schoolId?:    string;
  tenantName?:    string;
  tenantId?:      string;
  tenantLogoUrl?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthError {
  message: string;
}
