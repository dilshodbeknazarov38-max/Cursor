import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CPAMaRKeT.Uz — CPA Platformasi",
  description:
    "CPAMaRKeT.Uz — reklamachilar va targetologlar uchun CPA boshqaruv platformasi.",
  metadataBase:
    process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL !== ""
      ? new URL(process.env.NEXT_PUBLIC_APP_URL)
      : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    return (
      <html lang="uz">
        <body
          className={`${inter.variable} ${geistMono.variable} min-h-screen bg-neutral-50 font-sans antialiased`}
        >
          {children}
          <Toaster />
        </body>
      </html>
    );
}
