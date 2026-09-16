import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { getUsdRate } from "@/lib/fx";
import type { Lang } from "@/lib/spots";
import { MoneyProvider } from "./money";
import { SocialFabs } from "./social-fabs";
import "@/app/globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export async function RootShell({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const usdRate = await getUsdRate();
  return (
    <html lang={lang} className={`${geist.variable} ${geistMono.variable}`}>
      <body className="min-h-dvh">
        <MoneyProvider lang={lang} usdRate={usdRate}>
          {children}
        </MoneyProvider>
        <SocialFabs />
        <Toaster position="bottom-center" toastOptions={{ className: "!rounded-2xl !text-[14px]" }} />
        <Analytics />
      </body>
    </html>
  );
}
