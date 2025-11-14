'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import RoleSidebar from '@/components/RoleSidebar';
import { useAuth } from '@/hooks/use-auth';
import { getDashboardPathFromRole } from '@/lib/roles';

type DashboardLayoutProps = {
  role: string;
  children: ReactNode;
};

const DashboardLayout = ({ role, children }: DashboardLayoutProps) => {
  const router = useRouter();
  const { user, permissions, loading, error, refetch } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user) {
      const redirectUrl = `/kirish?redirect=/dashboard/${role}`;
      router.replace(redirectUrl);
      return;
    }

    const expectedRoute = getDashboardPathFromRole(user.role);
    if (expectedRoute !== role) {
      router.replace(`/dashboard/${expectedRoute}`);
    }
  }, [loading, user, role, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <p className="text-sm text-slate-500">Profil ma’lumotlari yuklanmoqda...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={refetch}
          className="mt-4 inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
        >
          Qayta urinib ko‘rish
        </button>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <RoleSidebar roleName={user.roleName} items={permissions} />
      <div className="flex-1">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Dashboard
              </p>
              <h1 className="text-xl font-semibold text-slate-900">
                {user.roleName} paneli
              </h1>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 py-8">
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 shadow-sm">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
