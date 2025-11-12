import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Kirish — CPAMaRKeT.Uz",
  description:
    "Telefon raqam va parol orqali CPAMaRKeT.Uz platformasiga kiring.",
};

export default function LoginPage() {
  return <LoginForm />;
}
