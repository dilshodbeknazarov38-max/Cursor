import Link from "next/link";

export default function PanelPage() {
  return (
    <main className="flex min-h-[calc(100vh-120px)] flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <h1 className="text-3xl font-semibold text-neutral-900">
        CPAMaRKeT.Uz boshqaruv paneli
      </h1>
      <p className="max-w-xl text-neutral-600">
        Sizning rolingiz uchun mos boshqaruv paneli quyidagi tugma orqali
        ochiladi. Agar sahifa avtomatik yo‘naltirilmagan bo‘lsa, qo‘lda
        tanlang.
      </p>
      <Link
        href="/dashboard/targetolog"
        className="rounded-lg bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
      >
        Dashboardga o‘tish
      </Link>
    </main>
  );
}
