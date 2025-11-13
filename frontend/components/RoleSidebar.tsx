import Link from 'next/link';

type RoleSidebarItem = {
  label: string;
  href: string;
  description?: string;
};

type RoleSidebarProps = {
  roleName?: string;
  items?: RoleSidebarItem[];
};

const RoleSidebar = ({ roleName = 'Dashboard', items = [] }: RoleSidebarProps) => {
  const hasItems = items.length > 0;

  return (
    <aside className="w-full border-b border-slate-200 bg-white lg:w-64 lg:border-b-0 lg:border-r">
      <div className="px-6 py-5">
        <p className="text-xs font-medium uppercase tracking-widest text-slate-500">Rol</p>
        <h2 className="text-lg font-semibold text-slate-900">{roleName}</h2>
      </div>
      <nav className="space-y-1 px-2 pb-6">
        {hasItems ? (
          items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col rounded-md px-4 py-3 transition hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
            >
              <span className="text-sm font-medium text-slate-800">{item.label}</span>
              {item.description ? (
                <span className="text-xs text-slate-500">{item.description}</span>
              ) : null}
            </Link>
          ))
        ) : (
          <div className="rounded-md border border-dashed border-slate-200 px-4 py-3 text-xs text-slate-500">
            Hozircha menyu elementlari mavjud emas.
          </div>
        )}
      </nav>
    </aside>
  );
};

export type { RoleSidebarItem };
export default RoleSidebar;
