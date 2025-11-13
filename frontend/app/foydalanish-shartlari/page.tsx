import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Foydalanish shartlari — CPAMaRKeT.Uz",
  description:
    "CPAMaRKeT.Uz platformasidan foydalanish qoidalari va foydalanuvchi majburiyatlari.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-16 sm:px-6">
      <header className="space-y-3">
        <span className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
          Foydalanish shartlari
        </span>
        <h1 className="text-3xl font-semibold text-neutral-900 sm:text-4xl">
          CPAMaRKeT.Uz platformasidan foydalanish qoidalari
        </h1>
        <p className="text-sm text-neutral-500">
          Oxirgi yangilanish: {new Date().toLocaleDateString("uz-UZ")}
        </p>
      </header>
      <section className="space-y-4 text-neutral-700">
        <p>
          Ushbu sahifa CPAMaRKeT.Uz platformasidan foydalanish shartlari va
          foydalanuvchi majburiyatlarini ochib beradi. Platformadan ro‘yxatdan
          o‘tish va foydalanish orqali siz quyidagi bandlarga rozilik
          bildirgan hisoblanasiz.
        </p>
        <ol className="space-y-3 pl-5 text-sm marker:text-emerald-500">
          <li>
            <strong>Hisob ma’lumotlari:</strong> Siz kiritgan ma’lumotlarning
            to‘g‘riligi va yangiligini ta’minlashingiz lozim. Foydalanuvchi
            hisoblari o‘zaro almashib bo‘lmaydi.
          </li>
          <li>
            <strong>Xavfsizlik:</strong> Parolni himoyalash va uchinchi
            shaxslar bilan bo‘lishmaslik — foydalanuvchining mas’uliyati.
          </li>
          <li>
            <strong>Platforma ma’lumotlari:</strong> CPAMaRKeT.Uz dagi barcha
            kontent va statistikalar xizmat ko‘rsatish maqsadida taqdim
            etiladi. Ularni ruxsatsiz ko‘paytirish taqiqlanadi.
          </li>
          <li>
            <strong>Qoidalarni buzish:</strong> Qoidalar buzilganda
            administratorlar hisobni vaqtincha bloklash yoki to‘liq
            o‘chirib tashlash huquqiga ega.
          </li>
        </ol>
        <p className="text-sm text-neutral-500">
          Qo‘shimcha savollar yuzasidan{" "}
          <a
            href="mailto:support@cpamarket.uz"
            className="font-semibold text-emerald-600 underline-offset-4 hover:underline"
          >
            support@cpamarket.uz
          </a>{" "}
          manzili orqali bog‘lanishingiz mumkin.
        </p>
      </section>
    </div>
  );
}
