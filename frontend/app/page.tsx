import {
  CallToActionSection,
} from "@/components/landing/cta";
import { FeaturesSection } from "@/components/landing/features";
import { HeroSection } from "@/components/landing/hero";
import { HowItWorksSection } from "@/components/landing/how-it-works";
import { SiteFooter } from "@/components/landing/footer";
import { SiteHeader } from "@/components/landing/site-header";
import { StatsCounters } from "@/components/landing/stats-counters";
import { TestimonialsSection } from "@/components/landing/testimonials";

async function getLandingStats() {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
    "http://localhost:3001/api";

  try {
    const response = await fetch(`${baseUrl}/stats/landing`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) {
      throw new Error("Statistika topilmadi");
    }
    return (await response.json()) as {
      counts: {
        users: number;
        leads: number;
        sales: number;
        topTargetologs: number;
      };
      testimonials: {
        name: string;
        role: string;
        message: string;
      }[];
    };
  } catch {
    return {
      counts: {
        users: 1284,
        leads: 1284 * 12,
        sales: Math.round(1284 * 7.8),
        topTargetologs: 22,
      },
      testimonials: [
        {
          name: "Gulnora X.",
          role: "Super Admin",
          message:
            "CPAMaRKeT.Uz orqali biz targetologlar va sotuvchilar ishini tezlashtirdik hamda yakuniy natijani aniq ko‘ryapmiz.",
        },
        {
          name: "Murodjon A.",
          role: "Targetolog",
          message:
            "Lidlarni boshqarish va to‘lovlar nazorati uchun eng qulay yechim. Platforma juda tez ishlaydi.",
        },
        {
          name: "Sabina R.",
          role: "Operator",
          message:
            "Buyurtmalar oqimi aniq ko‘rinadi, mijozlar bilan ishlash sezilarli darajada yengillashdi.",
        },
      ],
    };
  }
}

export default async function Home() {
  const stats = await getLandingStats();

  return (
    <>
      <SiteHeader />
      <main className="flex flex-col">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <StatsCounters counts={stats.counts} />
        <TestimonialsSection items={stats.testimonials} />
        <CallToActionSection />
      </main>
      <SiteFooter />
    </>
  );
}
