import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Joseph Chen - Android Engineer",
  description: "Personal portfolio and resume website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="__variable_f367f3 __variable_dd5b2f __variable_3c557b">
        {children}
      </body>
    </html>
  );
}
