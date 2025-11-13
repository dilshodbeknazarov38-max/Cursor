import Link from "next/link";

import { Button } from "@/components/ui/button";

export function CallToActionSection() {
  return (
    <section
      id="cta"
      className="bg-gradient-to-r from-emerald-600 to-sky-600 py-16 text-white"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-8 px-4 text-center sm:px-6 lg:flex-row lg:text-left">
        <div>
          <h2 className="text-3xl font-semibold sm:text-4xl">
            Hozir ro‘yxatdan o‘ting va ishlashni boshlang!
          </h2>
          <p className="mt-3 max-w-xl text-sm text-emerald-100">
            CPAMaRKeT.Uz yordamida leadlar, sotuvlar va to‘lovlarni bir joyda
            boshqaring. Barcha rollar uchun qulay va aniq boshqaruv paneli.
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="bg-white text-emerald-700 hover:bg-neutral-100"
          >
            <Link href="/royxatdan-otish">Ro‘yxatdan o‘tish</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white">
            <Link href="/kirish">Kirish</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
