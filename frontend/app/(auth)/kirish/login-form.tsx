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
import { invalidateAuthCache } from "@/hooks/use-auth";
import { API_BASE_URL } from "@/lib/api";
import { setSession } from "@/lib/session";
import { getDashboardPathFromRole, normalizeRoleSlug } from "@/lib/roles";

const loginSchema = z.object({
  telefon: z
    .string()
    .min(1, "Telefon raqamingizni kiriting.")
    .regex(
      /^\+998\d{9}$/,
      "Telefon raqami +998XXXXXXXXX formatida bo‘lishi kerak."
    ),
  parol: z
    .string()
    .min(8, "Parol kamida 8 ta belgi bo‘lishi kerak."),
  captcha: z
    .boolean()
    .refine((value) => value === true, {
      message: "Davom etish uchun “Men robot emasman” belgilang.",
    }),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      telefon: "+998",
      parol: "",
      captcha: false,
      rememberMe: false,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          telefon: values.telefon,
          parol: values.parol,
          rememberMe: values.rememberMe,
          captcha: values.captcha,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message =
          typeof errorBody?.message === "string"
            ? errorBody.message
            : "Kirish vaqtida xatolik kuzatildi.";
        setServerError(message);
        return;
      }

      const data = await response.json();

      const roleSlug = normalizeRoleSlug(data.user?.role);
      const redirectRoute =
        typeof data.user?.roleRoute === "string"
          ? data.user.roleRoute
          : getDashboardPathFromRole(roleSlug);

      setSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        role: roleSlug,
        userId: data.user?.id ?? "",
        rememberMe: values.rememberMe,
      });

      invalidateAuthCache();

      router.replace(`/dashboard/${redirectRoute}`);
    } catch (error) {
      console.error("Login error", error);
      setServerError("Serverga ulanib bo‘lmadi. Keyinroq urinib ko‘ring.");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-xl border-neutral-200 bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-neutral-900">
            Kirish
          </CardTitle>
          <CardDescription className="text-base text-neutral-600">
            CPAMaRKeT.Uz hisobingizga telefon raqam va parol orqali kiring.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 px-6 pb-6"
          >
              <FormField
                control={form.control}
                name="telefon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefon raqam</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+998901234567"
                      inputMode="tel"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
              <FormField
                control={form.control}
                name="parol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parol</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="captcha"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50/70 px-4 py-3">
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
                        Platformaga kirishdan avval tasdiqlang.
                      </p>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) =>
                          field.onChange(checked === true)
                        }
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-medium">
                      Esda saqlash (30 kun)
                    </FormLabel>
                  </FormItem>
                )}
              />
              <Link
                href="/parolni-unutdingizmi"
                className="text-sm font-semibold text-neutral-900 underline-offset-4 hover:underline"
              >
                Parolni unutdingizmi?
              </Link>
            </div>
            {serverError ? (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {serverError}
              </p>
            ) : null}
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Yuklanmoqda..." : "Kirish"}
            </Button>
          </form>
        </Form>
        <CardFooter className="flex flex-col items-center gap-2 border-t border-neutral-200/80 pt-6">
          <p className="text-sm text-neutral-600">
            Yangi foydalanuvchi?{" "}
            <Link
              href="/royxatdan-otish"
              className="font-semibold text-neutral-900 underline-offset-4 hover:underline"
            >
              Ro‘yxatdan o‘tish
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
