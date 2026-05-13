'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { AuthUser } from '@/types/auth.types';

export default function AdminClientShell({ user, children }: { user: AuthUser, children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar isCollapsed={isCollapsed} toggleCollapse={() => setIsCollapsed(!isCollapsed)} />
      <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'ml-[80px]' : 'ml-64'}`}>
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
