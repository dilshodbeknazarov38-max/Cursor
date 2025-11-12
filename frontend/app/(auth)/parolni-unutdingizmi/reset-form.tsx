"use client";

import { useState } from "react";
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

const resetSchema = z.object({
  telefon: z
    .string()
    .min(1, "Telefon raqamingizni kiriting.")
    .regex(/^\+998\d{9}$/, "Telefon raqami +998XXXXXXXXX formatida bo‘lishi kerak."),
});

type ResetFormValues = z.infer<typeof resetSchema>;

export function ForgotPasswordForm() {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      telefon: "+998",
    },
  });

  const onSubmit = async (values: ResetFormValues) => {
    setFeedback(null);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
            telefon: values.telefon,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const message =
          typeof errorBody?.message === "string"
            ? errorBody.message
            : "So‘rovni bajarishda muammo yuzaga keldi.";
        setError(message);
        return;
      }

      setFeedback(
        "Tiklash havolasi telefon raqamingizga yuborildi. Havola 10 daqiqa davomida amal qiladi."
      );
        form.reset({ telefon: "+998" });
    } catch (fetchError) {
      console.error("Forgot password error", fetchError);
      setError("Serverga ulanib bo‘lmadi. Keyinroq urinib ko‘ring.");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-xl border-neutral-200 bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-neutral-900">
            Parolni unutdingizmi?
          </CardTitle>
          <CardDescription className="text-base text-neutral-600">
            Telefon raqamingizni kiriting. Biz sizga 10 daqiqa amal qiluvchi parolni
            tiklash havolasini yuboramiz.
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
            {error ? (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            {feedback ? (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-600">
                {feedback}
              </p>
            ) : null}
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Jo‘natilmoqda..." : "Havola yuborish"}
            </Button>
          </form>
        </Form>
        <CardFooter className="border-t border-neutral-200/80 px-6 py-4 text-sm text-neutral-600">
          Havolani qabul qilmaguningizcha, iltimos, spam papkangizni ham tekshiring.
        </CardFooter>
      </Card>
    </div>
  );
}
