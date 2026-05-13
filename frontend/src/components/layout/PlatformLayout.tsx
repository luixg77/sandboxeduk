import { createClient } from '@/lib/supabase/server';
import PlatformLayoutClient from './PlatformLayoutClient';
import { AuthUser, UserRole } from '@/types/auth.types';

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let authUser: AuthUser | null = null;

  if (user) {
    authUser = {
      id:    user.id,
      email: user.email || '',
      role:  (user.user_metadata?.role as UserRole) || 'gestor',
    };

    const { data: profile } = await supabase
      .from('users')
      .select('school_id, schools(name), tenants(id, name, logo_url)')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      const school  = profile.schools as any;
      const tenant  = profile.tenants as any;
      authUser.schoolId      = profile.school_id ?? undefined;
      authUser.schoolName    = school?.name      ?? undefined;
      authUser.tenantId      = tenant?.id        ?? undefined;
      authUser.tenantName    = tenant?.name      ?? undefined;
      authUser.tenantLogoUrl = tenant?.logo_url  ?? undefined;
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <PlatformLayoutClient user={authUser}>
        {children}
      </PlatformLayoutClient>
    </div>
  );
}
