'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Sidebar, MobileNav } from '@/components/sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = api.getToken();
    if (!token) {
      window.location.href = '/login';
    } else {
      setAuthenticated(true);
    }
  }, []);

  if (authenticated === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <main className="flex-1 md:ml-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 pb-20 md:pb-6">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
