import Link from "next/link";

import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-gradient-to-b from-white via-neutral-50 to-neutral-100"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-4 py-16 text-center sm:px-6 lg:flex-row lg:items-center lg:gap-16 lg:text-left">
        <div className="flex-1 space-y-6">
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            CPA kampaniyalarini boshqarish
          </span>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-5xl">
            Oson va tez lead va sotuvlarni kuzatish tizimi
          </h1>
          <p className="text-base text-neutral-600 sm:text-lg">
            CPAMaRKeT.Uz bilan targetologlar, sotuvchilar va operatorlar
            o‘rtasidagi hamkorlikni tezlashtiring, real vaqtda statistika va
            to‘lovlarni boshqaring.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              className="bg-emerald-600 hover:bg-emerald-700"
              size="lg"
            >
              <Link href="/royxatdan-otish">Ro‘yxatdan o‘tish</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-neutral-300 bg-white hover:bg-neutral-100"
            >
                <Link href="#features">Ko‘proq ma’lumot</Link>
            </Button>
          </div>
        </div>
        <div className="relative flex-1">
          <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="relative rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-neutral-100 bg-emerald-50 p-4 text-left">
                <p className="text-sm font-semibold text-emerald-800">
                  Targetologlar nazorati
                </p>
                <p className="mt-2 text-2xl font-bold text-neutral-900">126</p>
                <p className="text-xs text-neutral-600">
                  Faol kampaniyalar soni
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4 text-left">
                <p className="text-sm font-semibold text-neutral-700">
                  Sotuvlar
                </p>
                <p className="mt-2 text-2xl font-bold text-neutral-900">
                  248 ta
                </p>
                <p className="text-xs text-neutral-600">Bugungi natijalar</p>
              </div>
              <div className="col-span-2 rounded-2xl border border-neutral-100 bg-white p-4 text-left shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-neutral-700">
                      Operatorlar
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      Buyurtmalar oqimi real vaqtda
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    +18%
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2 text-xs text-neutral-500">
                  {["Du", "Se", "Chor", "Pay"].map((label) => (
                    <div key={label} className="space-y-2">
                      <div className="h-14 rounded-full bg-gradient-to-b from-emerald-500 to-emerald-300" />
                      <p className="text-center">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
