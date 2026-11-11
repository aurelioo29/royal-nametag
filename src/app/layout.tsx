import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appName = "Royal Nametag";
const siteUrl = "https://nametag-rph.vercel.app";
const title = "Royal Nametag | Pembuat Nametag RSU Royal Prima";
const description =
  "Buat nametag pegawai dan peserta magang RSU Royal Prima. Pilih template, sesuaikan foto, lalu masukkan nama dan jabatan dengan mudah.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: appName,

  title: {
    default: title,
    template: `%s | ${appName}`,
  },

  description,

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteUrl,
    siteName: appName,
    title,
    description,
  },

  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
