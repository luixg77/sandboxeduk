'use client';

import { useState } from 'react';
import SidebarCollapsed from './SidebarCollapsed';
import HeaderPlatform from './HeaderPlatform';
import { GlobalLoadingOverlay } from '@/components/professor-ui';
import { AuthUser } from '@/types/auth.types';

interface Props {
  user:     AuthUser | null;
  children: React.ReactNode;
}

export default function PlatformLayoutClient({ user, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <GlobalLoadingOverlay />

      {/* Overlay escuro no mobile quando sidebar aberta */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <SidebarCollapsed
        tenantLogoUrl={user?.tenantLogoUrl}
        tenantName={user?.tenantName}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-col flex-1 overflow-hidden ml-0 md:ml-[88px]">
        <HeaderPlatform
          user={user}
          onMenuToggle={() => setMobileOpen(v => !v)}
        />
        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </>
  );
}
