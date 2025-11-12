"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Gauge,
  Home,
  LineChart,
  Menu,
  PackageSearch,
  ShieldCheck,
  ShoppingCart,
  Target,
  UserCheck,
  Users,
  Warehouse,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  DashboardIconKey,
  DashboardNavGroup,
} from "@/lib/dashboard-config";
import { cn } from "@/lib/utils";

type DashboardSidebarProps = {
  roleLabel: string;
  nav: DashboardNavGroup[];
};

const ICON_MAP: Record<DashboardIconKey, LucideIcon> = {
  home: Home,
  users: Users,
  cart: ShoppingCart,
  chart: LineChart,
  gauge: Gauge,
  bell: Bell,
  package: PackageSearch,
  target: Target,
  "user-check": UserCheck,
  clipboard: ClipboardList,
  shield: ShieldCheck,
  money: CircleDollarSign,
  warehouse: Warehouse,
};

export function DashboardSidebar({ roleLabel, nav }: DashboardSidebarProps) {
  const [openGroups, setOpenGroups] = useState<string[]>(
    nav.length > 0 ? [nav[0].id] : [],
  );

  const toggleGroup = (id: string) => {
    setOpenGroups((current) =>
      current.includes(id)
        ? current.filter((groupId) => groupId !== id)
        : [...current, id],
    );
  };

  return (
    <aside className="hidden w-72 flex-col border-r border-neutral-200 bg-white lg:flex">
      <div className="flex items-center gap-3 border-b border-neutral-200 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
          <Menu className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Rol
          </p>
          <p className="text-lg font-semibold text-neutral-900">{roleLabel}</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        {nav.map((group) => {
          const Icon = ICON_MAP[group.icon] ?? Menu;
          const isOpen = openGroups.includes(group.id);

          return (
            <div key={group.id} className="mb-4">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-700">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1">{group.title}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform text-neutral-500",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
              <div
                className={cn(
                  "space-y-1 overflow-hidden pl-12 pr-3 pt-2 text-sm text-neutral-600",
                  isOpen ? "max-h-96" : "max-h-0",
                )}
              >
                {group.items.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
                  >
                    <span>{item.label}</span>
                    {item.badge ? (
                      <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-xs font-medium text-white">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-neutral-200 px-6 py-4 text-xs text-neutral-500">
        CPAMaRKeT.Uz © {new Date().getFullYear()}
      </div>
    </aside>
  );
}
