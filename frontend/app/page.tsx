export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 px-6 py-16">
      <div className="flex max-w-2xl flex-col items-center gap-6 text-center">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          CPAMaRKeT.Uz
        </span>
        <h1 className="text-pretty text-4xl font-semibold text-neutral-900 sm:text-5xl">
          O‘zbekiston uchun zamonaviy CPA boshqaruv platformasi
        </h1>
        <p className="text-balance text-lg text-neutral-600">
          Reklamalarni samarali boshqarish, targetologlar va hamkorlar bilan
          ishlashni avtomatlashtirish hamda real vaqt statistikalarini kuzatish
          uchun yagona echim.
        </p>
      </div>
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <a
          className="inline-flex h-12 items-center justify-center rounded-lg bg-neutral-900 px-6 text-sm font-semibold text-white shadow-lg transition hover:bg-neutral-800"
          href="/kirish"
        >
          Kirish
        </a>
        <a
          className="inline-flex h-12 items-center justify-center rounded-lg border border-neutral-300 bg-white px-6 text-sm font-semibold text-neutral-900 shadow-sm transition hover:border-neutral-500 hover:text-neutral-950"
          href="/royxatdan-otish"
        >
          Ro‘yxatdan o‘tish
        </a>
      </div>
      <div className="max-w-3xl rounded-2xl border border-neutral-200 bg-white/80 p-8 text-left shadow-sm backdrop-blur">
        <h2 className="text-xl font-semibold text-neutral-900">
          Nega CPAMaRKeT.Uz?
        </h2>
        <ul className="mt-4 space-y-3 text-neutral-600">
          <li>
            • Targetologlar uchun soddalashtirilgan topshiriqlar va kampaniya
            boshqaruvi.
          </li>
          <li>• Reklamachilar uchun real vaqt statistikasi va hisobotlar.</li>
          <li>• Hamkorlar bilan xavfsiz va tezkor integratsiya.</li>
        </ul>
      </div>
    </main>
  );
}
