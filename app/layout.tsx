import type { Metadata } from "next";
import "./globals.css";
import { siteUrl, siteName, siteDescription, fbAppId } from "@/lib/site";
import { AnalyticsScripts } from "@/components/AnalyticsScripts";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription.en,
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName,
    title: siteName,
    description: siteDescription.en,
    url: siteUrl,
    images: [{ url: `${siteUrl}/og-default.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription.en,
    images: [`${siteUrl}/og-default.png`],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {fbAppId && <meta property="fb:app_id" content={fbAppId} />}
      </head>
      <body>
        {children}
        <AnalyticsScripts />
      </body>
    </html>
  );
}
