"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { API_BASE_URL } from "@/lib/api";

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]{8,}$/;

const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "Ism kamida 2 ta belgi bo‘lishi kerak.")
      .max(60, "Ism 60 belgidan oshmasligi kerak."),
    lastName: z
      .string()
      .min(2, "Familiya kamida 2 ta belgi bo‘lishi kerak.")
      .max(60, "Familiya 60 belgidan oshmasligi kerak."),
    email: z.string().email("Yaroqli email manzilini kiriting."),
    phone: z
      .string()
      .min(1, "Telefon raqamingizni kiriting.")
      .regex(
        /^\+998\d{9}$/,
        "Telefon raqami +998XXXXXXXXX formatida bo‘lishi kerak."
      ),
    password: z
      .string()
      .regex(
        passwordRegex,
        "Parol kamida 8 ta belgi, bitta katta harf, bitta kichik harf va raqamdan iborat bo‘lishi kerak."
      ),
    passwordConfirm: z.string(),
    role: z.enum(["TARGETOLOG", "SOTUVCHI"], {
      required_error: "Rolni tanlang.",
    }),
    referralCode: z
      .string()
      .max(64, "Referral kod 64 belgidan oshmasligi kerak.")
      .optional()
      .or(z.literal(""))
      .transform((value) =>
        value && value.trim().length > 0 ? value.trim() : undefined
      ),
    termsAccepted: z
      .boolean()
      .refine((value) => value === true, {
        message: "Shartlar va maxfiylik siyosatini qabul qiling.",
      }),
    captcha: z
      .boolean()
      .refine((value) => value === true, {
        message: "Davom etish uchun “Men robot emasman” belgilang.",
      }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Parollar bir-biriga mos kelmadi.",
    path: ["passwordConfirm"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "+998",
      password: "",
      passwordConfirm: "",
      role: "TARGETOLOG",
      referralCode: "",
      termsAccepted: false,
      captcha: false,
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
          password: values.password,
          passwordConfirm: values.passwordConfirm,
          role: values.role,
          referralCode: values.referralCode,
          termsAccepted: values.termsAccepted,
          captcha: values.captcha,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message =
          typeof errorBody?.message === "string"
            ? errorBody.message
            : "Ro‘yxatdan o‘tish vaqtida xatolik yuz berdi.";
        setServerError(message);
        return;
      }

      setSuccessMessage(
        "Ro‘yxatdan o‘tish muvaffaqiyatli yakunlandi. Tasdiqlash bo‘yicha ko‘rsatmalar email manzilingizga yuboriladi."
      );
      form.reset({
        firstName: "",
        lastName: "",
        email: "",
        phone: "+998",
        password: "",
        passwordConfirm: "",
        role: "TARGETOLOG",
        referralCode: "",
        termsAccepted: false,
        captcha: false,
      });

      setTimeout(() => {
        router.push("/kirish");
      }, 1500);
    } catch (error) {
      console.error("Register error", error);
      setServerError("Serverga ulanib bo‘lmadi. Keyinroq urinib ko‘ring.");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-2xl border-neutral-200 bg-white shadow-lg">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl font-semibold text-neutral-900">
            Ro‘yxatdan o‘tish
          </CardTitle>
          <CardDescription className="text-base text-neutral-600">
            Ma’lumotlaringizni to‘ldiring va CPAMaRKeT.Uz platformasidan
            foydalanishni boshlang. Targetolog yoki Sotuvchi sifatida hisob
            yarating.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 px-6 pb-6"
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ism</FormLabel>
                    <FormControl>
                      <Input placeholder="Ismingiz" autoComplete="given-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Familiya</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Familiyangiz"
                        autoComplete="family-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email manzil</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="you@example.com"
                      type="email"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefon raqam</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+998901234567"
                      inputMode="tel"
                      autoComplete="tel"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parol</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Kamida 8 ta belgi"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-neutral-500">
                      Katta-kichik harf va raqamdan iborat bo‘lishi shart.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="passwordConfirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parolni tasdiqlash</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Parolni qayta kiriting"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rolni tanlang</FormLabel>
                  <FormControl>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        {
                          value: "TARGETOLOG" as const,
                          title: "Targetolog",
                          description:
                            "Leadlarni qabul qiling, kampaniyalarni boshqaring va statistika bilan ishlang.",
                        },
                        {
                          value: "SOTUVCHI" as const,
                          title: "Sotuvchi",
                          description:
                            "Mahsulotlaringizni joylashtiring, buyurtmalarni va balansni kuzating.",
                        },
                      ].map((roleOption) => {
                        const isActive = field.value === roleOption.value;
                        return (
                          <button
                            key={roleOption.value}
                            type="button"
                            onClick={() => field.onChange(roleOption.value)}
                            aria-pressed={isActive}
                            className={`rounded-xl border px-4 py-4 text-left transition ${
                              isActive
                                ? "border-emerald-500 bg-emerald-50"
                                : "border-neutral-200 hover:border-emerald-200"
                            }`}
                          >
                            <span className="text-sm font-semibold text-neutral-900">
                              {roleOption.title}
                            </span>
                            <p className="mt-2 text-sm text-neutral-600">
                              {roleOption.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="referralCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referral / Invite kod (ixtiyoriy)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Agar mavjud bo‘lsa kiriting"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="termsAccepted"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50/80 px-4 py-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) =>
                          field.onChange(checked === true)
                        }
                      />
                    </FormControl>
                    <div className="space-y-1 text-sm text-neutral-600">
                      <FormLabel className="text-sm font-medium text-neutral-900">
                        Shartlar bilan tanishdim
                      </FormLabel>
                      <p>
                        Men{" "}
                        <Link
                          href="/foydalanish-shartlari"
                          className="font-medium text-emerald-600 underline-offset-4 hover:underline"
                        >
                          Foydalanish shartlari
                        </Link>{" "}
                        va{" "}
                        <Link
                          href="/maxfiylik"
                          className="font-medium text-emerald-600 underline-offset-4 hover:underline"
                        >
                          Maxfiylik siyosati
                        </Link>
                        ga rozilik bildiraman.
                      </p>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="captcha"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-sm">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) =>
                          field.onChange(checked === true)
                        }
                      />
                    </FormControl>
                    <div>
                      <FormLabel className="text-sm font-medium">
                        Men robot emasman
                      </FormLabel>
                      <p className="text-sm text-neutral-600">
                        Davom etishdan oldin tasdiqlang.
                      </p>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            {serverError ? (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {serverError}
              </p>
            ) : null}
            {successMessage ? (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-600">
                {successMessage}
              </p>
            ) : null}
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Yuklanmoqda..." : "Ro‘yxatdan o‘tish"}
            </Button>
          </form>
        </Form>
        <CardFooter className="flex flex-col items-center gap-4 border-t border-neutral-200/80 px-6 pb-6 pt-6">
          <div className="text-center text-sm text-neutral-600">
            Allaqachon hisobingiz bormi?{" "}
            <Link
              href="/kirish"
              className="font-semibold text-neutral-900 underline-offset-4 hover:underline"
            >
              Kirish
            </Link>
          </div>
          <div className="flex w-full flex-col items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Yoki ijtimoiy tarmoqlar orqali
            </span>
            <div className="flex flex-wrap justify-center gap-3">
              {["Google", "Facebook", "Telegram"].map((provider) => (
                <Button
                  key={provider}
                  variant="outline"
                  type="button"
                  disabled
                  className="gap-2"
                  title="Tez orada qo‘shiladi"
                >
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  {provider}
                </Button>
              ))}
            </div>
            <p className="text-xs text-neutral-400">
              Tez orada integratsiya qo‘shiladi.
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
