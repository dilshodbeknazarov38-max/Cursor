"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";

const menuItems = [
  { label: "Bosh sahifa", href: "#hero" },
  { label: "Xizmatlar", href: "#features" },
  { label: "Qanday ishlaydi", href: "#how-it-works" },
  { label: "Statistika", href: "#stats" },
  { label: "Kontakt", href: "#contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/80 backdrop-blur">
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
          <Button
            asChild
            variant="ghost"
            className="text-sm font-semibold text-neutral-700 hover:text-neutral-900"
          >
            <Link href="/kirish">Kirish</Link>
          </Button>
          <Button
            asChild
            className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-sky-600 text-white shadow-lg shadow-emerald-500/30 hover:from-emerald-600 hover:via-emerald-700 hover:to-sky-700"
          >
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
              <Button
                asChild
                variant="ghost"
                className="justify-center text-neutral-700 hover:text-neutral-900"
              >
                <Link href="/kirish">Kirish</Link>
              </Button>
              <Button
                asChild
                className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-sky-600 text-white shadow-lg shadow-emerald-500/30 hover:from-emerald-600 hover:via-emerald-700 hover:to-sky-700"
              >
                <Link href="/royxatdan-otish">Ro‘yxatdan o‘tish</Link>
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
