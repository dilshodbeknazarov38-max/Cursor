import { Card, CardContent } from "@/components/ui/card";
import {
  Target,
  ShoppingBag,
  Users,
} from "lucide-react";

const FEATURES = [
  {
    title: "Targetologlar uchun",
    description:
      "Kampaniyalar samaradorligini real vaqtda kuzatish, lidlarni filtrlash va tezkor to‘lovlarni boshqarish imkoniyati.",
    icon: Target,
    id: "targetologists",
  },
  {
    title: "Sotuvchilar uchun",
    description:
      "Mahsulotlar va buyurtmalarni yagona joyda ko‘rib chiqish, konversiyalarni oshirish uchun statistik tavsiyalar.",
    icon: ShoppingBag,
    id: "products",
  },
  {
    title: "Operatorlar va Adminlar uchun",
    description:
      "Lead jarayonlarini nazorat qilish, rollar va ruxsatlarni boshqarish, jarayonlarni avtomatlashtirish.",
    icon: Users,
    id: "payments",
  },
];

export function FeaturesSection() {
  return (
    <section
      id="about"
      className="bg-white py-16"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold text-neutral-900 sm:text-4xl">
            Turli rollar uchun moslashuvchan platforma
          </h2>
          <p className="mt-3 text-base text-neutral-600">
            CPAMaRKeT.Uz barcha ishtirokchilar — targetolog, sotuvchi, operator
            va administratorlar uchun qulay boshqaruv muhitini taqdim etadi.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                id={feature.id}
                className="group border-neutral-200 transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
              >
                <CardContent className="space-y-4 p-6 text-left">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-neutral-600">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
