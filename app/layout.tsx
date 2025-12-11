import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/context";
import { CurrencyProvider } from "@/lib/currency/context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Monthly Tracker - Income & Outcome",
  description: "Aplikasi untuk mencatat pemasukan dan pengeluaran bulanan",
  icons: {
    icon: '/images/accept2.png',
    shortcut: '/images/accept2.png',
    apple: '/images/accept2.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider>
          <CurrencyProvider>
            {children}
          </CurrencyProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
