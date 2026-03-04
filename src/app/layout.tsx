import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "../components/BottomNav";
import OfflineBanner from "../components/OfflineBanner";
import ConvexClientProvider from "./ConvexClientProvider";
import { RegisterSW } from "./RegisterSW";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f1117",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Italian Tutor — Marco",
  description: "AI-powered Italian language learning",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Marco",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
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
