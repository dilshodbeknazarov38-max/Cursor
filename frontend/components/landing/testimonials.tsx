"use client";

import { useEffect, useState } from "react";
import { Quote } from "lucide-react";

type Testimonial = {
  name: string;
  role: string;
  message: string;
};

type TestimonialsProps = {
  items: Testimonial[];
};

export function TestimonialsSection({ items }: TestimonialsProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [items.length]);

  const current = items[index];

  return (
    <section className="bg-neutral-900 py-16 text-white">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row">
          <div className="max-w-xl">
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
              Mijozlar fikri
            </span>
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
              Platformamiz haqidagi fikrlar
            </h2>
            <p className="mt-3 text-sm text-neutral-300">
              CPAMaRKeT.Uz foydalanuvchilari jarayonlarni avtomatlashtirish,
              hamkorlikni soddalashtirish va to‘lovlarni tezlashtirishdan
              mamnun.
            </p>
            <div className="mt-8 flex items-center gap-3 text-sm text-neutral-400">
              {items.map((item, idx) => (
                <button
                  key={item.name}
                  className={`h-2 w-8 rounded-full transition ${
                    idx === index ? "bg-emerald-400" : "bg-white/20"
                  }`}
                  onClick={() => setIndex(idx)}
                  aria-label={`${item.name} fikri`}
                />
              ))}
            </div>
          </div>
          <div className="max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur">
            <Quote className="h-10 w-10 text-emerald-300" />
            <p className="mt-6 text-lg leading-relaxed text-neutral-100">
              “{current.message}”
            </p>
            <div className="mt-6">
              <p className="text-base font-semibold text-white">
                {current.name}
              </p>
              <p className="text-sm text-neutral-300">{current.role}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
