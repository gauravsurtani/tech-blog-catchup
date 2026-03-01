import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import SidebarLayout from "@/components/SidebarLayout";
import ThemeProvider from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import { AudioPlayerProvider } from "@/hooks/useAudioPlayer";
import AudioPlayer from "@/components/AudioPlayer";
import GenerationBanner from "@/components/GenerationBanner";
import BottomTabs from "@/components/BottomTabs";
import Footer from "@/components/Footer";
import SessionProvider from "@/components/SessionProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Tech Blog Catchup",
    template: "%s | Tech Blog Catchup",
  },
  description: "Listen to tech engineering blogs as conversational podcasts",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    siteName: "Tech Blog Catchup",
    title: "Tech Blog Catchup",
    description: "Listen to tech engineering blogs as conversational podcasts",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tech Blog Catchup",
    description: "Listen to tech engineering blogs as conversational podcasts",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] min-h-screen`}>
        <ThemeProvider>
          <SessionProvider>
            <AudioPlayerProvider>
              <Sidebar />
              <SidebarLayout>
                <GenerationBanner />
                <div className="fixed top-4 right-4 z-50">
                  <ThemeToggle />
                </div>
                <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-24">
                  {children}
                </main>
                <Footer />
              </SidebarLayout>
              <BottomTabs />
              <AudioPlayer />
            </AudioPlayerProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
