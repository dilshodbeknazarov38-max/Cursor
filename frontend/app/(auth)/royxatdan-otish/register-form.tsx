"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
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

const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "Ism kamida 2 ta belgi bo‘lishi kerak.")
      .max(60, "Ism 60 belgidan oshmasligi kerak."),
    nickname: z
      .string()
      .min(3, "Nickname kamida 3 ta belgi bo‘lishi kerak.")
      .max(40, "Nickname 40 belgidan oshmasligi kerak."),
    phone: z
      .string()
      .min(1, "Telefon raqamingizni kiriting.")
      .regex(
        /^\+998\d{9}$/,
        "Telefon raqami +998XXXXXXXXX formatida bo‘lishi kerak."
      ),
    password: z
      .string()
      .min(8, "Parol kamida 8 ta belgi bo‘lishi kerak."),
    passwordConfirm: z.string(),
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
      nickname: "",
      phone: "+998",
      password: "",
      passwordConfirm: "",
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
          nickname: values.nickname,
          phone: values.phone,
          password: values.password,
          passwordConfirm: values.passwordConfirm,
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
        "Ro‘yxatdan o‘tish muvaffaqiyatli yakunlandi. Endi telefon raqamingiz orqali tizimga kiring."
      );
      form.reset({
        firstName: "",
        nickname: "",
        phone: "+998",
        password: "",
        passwordConfirm: "",
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
      <Card className="w-full max-w-xl border-neutral-200 bg-white shadow-lg">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl font-semibold text-neutral-900">
            Ro‘yxatdan o‘tish
          </CardTitle>
          <CardDescription className="text-base text-neutral-600">
            Oddiy formani to‘ldiring va Targetolog sifatida hisob yarating.
            Telefon raqamingiz login sifatida ishlatiladi.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 px-6 pb-6"
          >
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ism</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ismingiz"
                      autoComplete="given-name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nickname</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Sayt ichidagi ko‘rinadigan nom"
                      autoComplete="nickname"
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
        <CardFooter className="flex items-center justify-center border-t border-neutral-200/80 px-6 py-4">
          <p className="text-sm text-neutral-600">
            Allaqachon hisobingiz bormi?{" "}
            <Link
              href="/kirish"
              className="font-semibold text-neutral-900 underline-offset-4 hover:underline"
            >
              Kirish
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
