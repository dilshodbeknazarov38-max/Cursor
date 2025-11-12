import type { Metadata } from "next";

import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Ro‘yxatdan o‘tish — CPAMaRKeT.Uz",
  description:
    "Ma’lumotlaringizni to‘ldiring va CPAMaRKeT.Uz platformasidan foydalanishni boshlang.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
