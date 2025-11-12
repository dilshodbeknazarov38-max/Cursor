import type { Metadata } from "next";

import { ForgotPasswordForm } from "./reset-form";

export const metadata: Metadata = {
  title: "Parolni unutdingizmi? — CPAMaRKeT.Uz",
  description:
    "Telefon raqamingizni kiriting va 10 daqiqa amal qiluvchi tiklash havolasini oling.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
