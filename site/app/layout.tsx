import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";

import "./globals.css";

export const metadata: Metadata = {
  title: "Baixar a Keen — Android, iPhone, Windows, macOS e Linux",
  description:
    "Baixe a Keen para Android, iPhone, Windows, macOS e Linux.",
  applicationName: "Keen",
  metadataBase: new URL("https://keew-get.vercel.app"),
  openGraph: {
    title: "Baixar a Keen",
    description: "Android · iPhone · Windows · macOS · Linux.",
    type: "website",
    locale: "pt_BR",
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#050506",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
