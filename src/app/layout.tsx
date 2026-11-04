import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
});

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
    <html
      lang="id"
      className={`${plusJakarta.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased selection:bg-[var(--brand-soft)] selection:text-[var(--brand-primary)]">
        {children}
      </body>
    </html>
  );
}
