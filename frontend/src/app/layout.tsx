import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ThemeProvider from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import { AudioPlayerProvider } from "@/hooks/useAudioPlayer";
import AudioPlayer from "@/components/AudioPlayer";
import GenerationBanner from "@/components/GenerationBanner";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Tech Blog Catchup",
  description: "Listen to tech engineering blogs as conversational podcasts",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] min-h-screen flex flex-col">
        <ThemeProvider>
          <AudioPlayerProvider>
            <Navbar />
            <GenerationBanner />
            <div className="fixed top-4 right-4 z-50">
              <ThemeToggle />
            </div>
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-24">
              {children}
            </main>
            <Footer />
            <AudioPlayer />
          </AudioPlayerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
