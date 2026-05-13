import { createClient } from '@/lib/supabase/client';
import { AuthUser, LoginCredentials, UserRole } from '@/types/auth.types';

function isValidRole(value: unknown): value is UserRole {
  return ['admin', 'coordenador', 'gestor', 'professor'].includes(value as string);
}

/**
 * Signs in the user with email and password via Supabase Auth.
 * Returns the authenticated user with their role.
 *
 * Role is read from user_metadata.role (set during user provisioning).
 */
export async function signIn(credentials: LoginCredentials): Promise<AuthUser> {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error || !data.user) {
    throw new Error('Credenciais inválidas. Verifique seu e-mail e senha.');
  }

  const role = data.user.user_metadata?.role as unknown;

  if (!isValidRole(role)) {
    await supabase.auth.signOut();
    throw new Error('Usuário não autorizado. Perfil de acesso não configurado.');
  }

  return {
    id: data.user.id,
    email: data.user.email ?? '',
    role,
  };
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function getSession() {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}
