import { ArrowRight } from "lucide-react";

const STEPS = [
  { label: "Ro‘yxatdan o‘tish", description: "Platformaga kirib, rolni tanlang." },
  { label: "Mahsulot", description: "Mahsulotlaringizni joylashtiring yoki tanlang." },
  { label: "Lead", description: "Lidlarni qabul qiling va tekshiring." },
  { label: "Balans", description: "Hisob-kitob va balansni nazorat qiling." },
  { label: "To‘lov", description: "Ko‘rsatilgan xizmatlar uchun to‘lovni oling." },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-neutral-50 py-16">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-neutral-900 sm:text-4xl">
            Qanday ishlaydi?
          </h2>
          <p className="mt-3 text-base text-neutral-600">
            Jarayonni soddalashtirganimiz uchun har bir qadam aniq va
            boshqariladigan ko‘rinishda.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-5">
          {STEPS.map((step, index) => (
            <div
              key={step.label}
              className="relative rounded-2xl border border-neutral-200 bg-white p-5 text-center shadow-sm"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-lg font-semibold text-white">
                {index + 1}
              </div>
              <h3 className="mt-4 text-base font-semibold text-neutral-900">
                {step.label}
              </h3>
              <p className="mt-2 text-sm text-neutral-600">{step.description}</p>
              {index < STEPS.length - 1 ? (
                <ArrowRight className="absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-emerald-500 sm:block" />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
