import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import "@fontsource-variable/plus-jakarta-sans";
import "highlight.js/styles/github-dark-dimmed.css";
import "katex/dist/katex.min.css";
import "./globals.css";

const SITE = process.env.NEXT_PUBLIC_APP_URL || "https://keew-ia.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Keew IA",
  description: "Keew IA — your own intelligence. Chats, files and ideas, saved to your account.",
  applicationName: "Keew IA",
  authors: [{ name: "Veexdevs" }],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/app-icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "Keew IA",
    description: "Your own intelligence.",
    url: SITE,
    siteName: "Keew IA",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Keew IA" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Keew IA",
    description: "Your own intelligence.",
    images: ["/og.png"],
  },
  appleWebApp: { capable: true, title: "Keew IA", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistMono.variable} style={{ colorScheme: "dark" }}>
      <body className="min-h-screen bg-bg text-fg antialiased">
        {/* applies the saved theme before the first paint, so nothing flashes */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=JSON.parse(localStorage.getItem("keew-ia-prefs-v1")||"{}");var r=document.documentElement;r.dataset.theme=p.theme||"dark";r.dataset.density=p.density||"comfortable";r.dataset.motion=p.motion||"full";if(p.textScale)r.style.fontSize=(16*p.textScale)+"px";}catch(e){}})();`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
