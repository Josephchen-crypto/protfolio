import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import type { Metadata } from "next";

import { siteUrl } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-heading" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return {
    alternates: {
      canonical: `${siteUrl}/${lang}`,
      languages: {
        en: `${siteUrl}/en`,
        zh: `${siteUrl}/zh`,
        "x-default": `${siteUrl}/en`,
      },
    },
    openGraph: {
      locale: lang === "zh" ? "zh_CN" : "en_US",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  await params;
  return (
    <div
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      {children}
    </div>
  );
}
