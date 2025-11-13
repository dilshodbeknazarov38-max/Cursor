import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Maxfiylik siyosati — CPAMaRKeT.Uz",
  description:
    "CPAMaRKeT.Uz foydalanuvchi ma’lumotlarini qanday himoya qilishini va ishlatishini bilib oling.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-16 sm:px-6">
      <header className="space-y-3">
        <span className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
          Maxfiylik siyosati
        </span>
        <h1 className="text-3xl font-semibold text-neutral-900 sm:text-4xl">
          Shaxsiy ma’lumotlaringizni himoya qilamiz
        </h1>
        <p className="text-sm text-neutral-500">
          Oxirgi yangilanish: {new Date().toLocaleDateString("uz-UZ")}
        </p>
      </header>
      <section className="space-y-4 text-neutral-700">
        <p>
          CPAMaRKeT.Uz foydalanuvchilarning shaxsiy ma’lumotlarini
          himoyalashga sodiqdir. Ushbu siyosat registratsiya jarayonida
          to‘plangan ma’lumotlar qanday ishlatilishini tushuntiradi.
        </p>
        <ul className="space-y-3 pl-5 text-sm marker:text-emerald-500">
          <li>
            <strong>To‘plangan ma’lumotlar:</strong> ism, familiya, email,
            telefon raqami, tanlangan rol va ixtiyoriy referral kodi.
          </li>
          <li>
            <strong>Ma’lumotlardan foydalanish:</strong> tizimga kirish,
            xabarnomalar yuborish, statistik tahlil va xavfsizlikni ta’minlash
            uchun.
          </li>
          <li>
            <strong>Saqlash muddati:</strong> foydalanuvchi hisobi faol bo‘lishi
            davomida yoki qonunchilik talab qilgan muddatgacha.
          </li>
          <li>
            <strong>Uchinchi tomonlar bilan bo‘lishish:</strong> faqat
            xizmatlarni taqdim etish uchun zarur bo‘lgan hollarda va tegishli
            shartnoma asosida.
          </li>
        </ul>
        <p className="text-sm text-neutral-500">
          Agar ma’lumotlaringizni o‘zgartirmoqchi yoki o‘chirmoqchi bo‘lsangiz,
          <a
            href="mailto:privacy@cpamarket.uz"
            className="ml-1 font-semibold text-emerald-600 underline-offset-4 hover:underline"
          >
            privacy@cpamarket.uz
          </a>{" "}
          manziliga yozishingiz mumkin.
        </p>
      </section>
    </div>
  );
}
