"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";

const menuItems = [
  { label: "Bosh sahifa", href: "#" },
  { label: "Mahsulotlar", href: "#products" },
  { label: "Targetologlar", href: "#targetologists" },
  { label: "To‘lovlar", href: "#payments" },
  { label: "Kontakt", href: "#contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="w-full border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-neutral-900"
        >
          CPAMaRKeT.<span className="text-emerald-600">Uz</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-neutral-600 md:flex">
          {menuItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="transition hover:text-neutral-900"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Button asChild variant="default">
            <Link href="/kirish">Kirish</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/royxatdan-otish">Ro‘yxatdan o‘tish</Link>
          </Button>
        </div>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900 md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Navigatsiyani ochish"
        >
          <span className="h-4 w-4">≡</span>
        </button>
      </div>
      {open ? (
        <div className="md:hidden">
          <nav className="space-y-1 border-t border-neutral-200 bg-white px-4 py-4 text-sm text-neutral-600">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="block rounded-lg px-3 py-2 transition hover:bg-neutral-100 hover:text-neutral-900"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-3">
              <Button asChild variant="default">
                <Link href="/kirish">Kirish</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/royxatdan-otish">Ro‘yxatdan o‘tish</Link>
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
