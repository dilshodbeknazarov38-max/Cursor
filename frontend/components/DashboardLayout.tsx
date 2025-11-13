import RoleSidebar from '@/components/RoleSidebar';

type DashboardLayoutProps = {
  role: string;
  children: React.ReactNode;
};

function titleCase(value: string): string {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const DashboardLayout = ({ role, children }: DashboardLayoutProps) => {
  const displayRole = titleCase(role);

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <RoleSidebar role={role} />
      <div className="flex-1">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Dashboard</p>
              <h1 className="text-xl font-semibold text-slate-900">{displayRole} paneli</h1>
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
