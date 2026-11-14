import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "highlight.js/styles/github-dark-dimmed.css";
import "katex/dist/katex.min.css";
import "./globals.css";

const SITE = process.env.NEXT_PUBLIC_APP_URL || "https://keew-ia.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Keew IA",
  description: "Keew IA — inteligência artificial própria da Veexdevs.",
  applicationName: "Keew IA",
  authors: [{ name: "Veexdevs" }],
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "Keew IA",
    description: "Inteligência artificial própria da Veexdevs.",
    url: SITE,
    siteName: "Keew IA",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Keew IA" }],
    locale: "pt_BR",
    type: "website",
  },
  appleWebApp: { capable: true, title: "Keew IA", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#141413",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${GeistSans.variable} ${GeistMono.variable}`} style={{ colorScheme: "dark" }}>
      <body className="min-h-screen bg-bg text-fg antialiased">{children}</body>
    </html>
  );
}
