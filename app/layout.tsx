import type { Metadata } from "next";
import "./globals.css";
import { siteUrl, siteName, siteDescription } from "@/lib/site";
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
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <AnalyticsScripts />
      </body>
    </html>
  );
}
