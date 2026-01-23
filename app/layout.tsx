// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ClawBack - Track Your Credit Card Credits",
  description: "Never leave money on the table. Track credit card credits, get reminders before they expire, and maximize your rewards.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ClawBack",
  },
  openGraph: {
    title: "ClawBack - Track Your Credit Card Credits",
    description: "Never leave money on the table. Track credit card credits, get reminders before they expire.",
    url: "https://claw-back.com",
    siteName: "ClawBack",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClawBack - Track Your Credit Card Credits",
    description: "Never leave money on the table. Track credit card credits, get reminders before they expire.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#8B5CF6",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* PWA Meta Tags */}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ClawBack" />
        
        {/* Splash Screens for iOS */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-1170x2532.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-1284x2778.png"
          media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)"
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
