import Link from "next/link";

const LINKS = [
  { label: "Telegram", href: "https://t.me/cpamarket" },
  { label: "Instagram", href: "https://instagram.com/cpamarket" },
  { label: "Facebook", href: "https://facebook.com/cpamarket" },
];

export function SiteFooter() {
  return (
    <footer id="contact" className="border-t border-neutral-200 bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-semibold text-neutral-900">
              CPAMaRKeT.<span className="text-emerald-600">Uz</span>
            </p>
            <p className="mt-2 text-sm text-neutral-600">
              CPA kampaniyalarini boshqarish uchun zamonaviy platforma.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Kontaktlar
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-neutral-600">
              <li>
                <a href="mailto:support@cpamarket.uz">
                  support@cpamarket.uz
                </a>
              </li>
              <li>
                <a href="https://t.me/cpamarket_support" target="_blank">
                  Telegram: @cpamarket_support
                </a>
              </li>
              <li>
                <a href="tel:+998781234567">+998 (78) 123-45-67</a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Ijtimoiy tarmoqlar
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-neutral-600">
              {LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    className="transition hover:text-neutral-900"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Huquqiy
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-neutral-600">
              <li>
                <Link href="/maxfiylik">Maxfiylik siyosati</Link>
              </li>
              <li>
                <Link href="/foydalanish-shartlari">Foydalanish shartlari</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-neutral-200 pt-6 text-center text-xs text-neutral-500">
          © {new Date().getFullYear()} CPAMaRKeT.Uz. Barcha huquqlar
          himoyalangan.
        </div>
      </div>
    </footer>
  );
}
