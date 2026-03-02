import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import SidebarLayout from "@/components/SidebarLayout";
import ThemeProvider from "@/components/ThemeProvider";
import { AudioPlayerProvider } from "@/hooks/useAudioPlayer";
import AudioPlayer from "@/components/AudioPlayer";
import GenerationBanner from "@/components/GenerationBanner";
import BottomTabs from "@/components/BottomTabs";
import Footer from "@/components/Footer";
import SessionProvider from "@/components/SessionProvider";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-dm-sans",
});

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
      <body className={`${dmSans.variable} font-[var(--font)] bg-[var(--bg)] text-[var(--text-1)] min-h-screen`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[var(--primary)] focus:text-[var(--primary-text)] focus:rounded-[var(--radius)] focus:border-[var(--border-w)] focus:border-[var(--border-color)]"
        >
          Skip to content
        </a>
        <ThemeProvider>
          <SessionProvider>
            <AudioPlayerProvider>
              <Sidebar />
              <SidebarLayout>
                <GenerationBanner />
                <main id="main-content" className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-36 md:pb-24">
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
