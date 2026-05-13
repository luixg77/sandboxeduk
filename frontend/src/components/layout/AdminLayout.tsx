import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AuthUser, UserRole } from '@/types/auth.types';
import AdminClientShell from './AdminClientShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // BYPASS DE AUTH NO SANDBOX: Forçando usuário logado
  const authUser: AuthUser = {
    id: "sandbox-id-123",
    email: "sandbox@admin.com",
    role: "admin",
  };

  return <AdminClientShell user={authUser}>{children}</AdminClientShell>;
}
