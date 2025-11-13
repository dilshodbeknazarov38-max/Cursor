"use client";

import CountUp from "react-countup";

type CounterProps = {
  counts: {
    users: number;
    leads: number;
    sales: number;
    topTargetologs: number;
  };
};

const LABELS: { key: keyof CounterProps["counts"]; label: string }[] = [
  { key: "users", label: "Ro‘yxatdan o‘tgan foydalanuvchilar" },
  { key: "leads", label: "Yaratilgan leadlar" },
  { key: "sales", label: "Muvaffaqiyatli sotuvlar" },
  { key: "topTargetologs", label: "Top targetologlar" },
];

export function StatsCounters({ counts }: CounterProps) {
  return (
    <section id="stats" className="bg-white py-16">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-neutral-900 sm:text-4xl">
            Natijalar real vaqt rejimida
          </h2>
          <p className="mt-3 text-base text-neutral-600">
            Hech qanday panelni yangilashsiz, eng muhim ko‘rsatkichlar doimo ko‘z
            o‘ngingizda.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {LABELS.map((item) => (
            <div
              key={item.key}
              className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 text-center shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:bg-white hover:shadow-lg"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                {item.label}
              </p>
              <p className="mt-3 text-3xl font-bold text-neutral-900">
                <CountUp end={counts[item.key]} duration={2} separator=" " />
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
