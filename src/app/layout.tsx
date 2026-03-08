import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "../components/BottomNav";
import OfflineBanner from "../components/OfflineBanner";
import ConvexClientProvider from "./ConvexClientProvider";
import { RegisterSW } from "./RegisterSW";

export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f1117",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Italian Tutor \u2014 Marco",
  description: "AI-powered Italian language learning",
  manifest: "/tutor/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Marco",
  },
  icons: {
    icon: "/tutor/icons/icon-192.png",
    apple: "/tutor/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg text-white min-h-screen pt-[env(safe-area-inset-top)]">
        <OfflineBanner />
        <ConvexClientProvider>
          {children}
          <BottomNav />
        </ConvexClientProvider>
        <RegisterSW />
      </body>
    </html>
  );
}
