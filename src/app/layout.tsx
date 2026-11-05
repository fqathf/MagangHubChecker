import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MagangHub Checker - Inspektor Lamaran & Lowongan Kemnaker",
  description:
    "Utilitas pribadi untuk memeriksa status lamaran SIAPkerja MagangHub Kemnaker RI (selected_at, jadwal wawancara, SK penetapan) dan analisis rasio persaingan lowongan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased selection:bg-[var(--brand-soft)] selection:text-[var(--brand-primary)]">
        {children}
      </body>
    </html>
  );
}
