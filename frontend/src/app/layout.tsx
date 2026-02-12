import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AudioPlayerProvider } from "@/hooks/useAudioPlayer";
import AudioPlayer from "@/components/AudioPlayer";

export const metadata: Metadata = {
  title: "Tech Blog Catchup",
  description: "Listen to tech engineering blogs as conversational podcasts",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-950 text-gray-100 min-h-screen flex flex-col">
        <AudioPlayerProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-24">
            {children}
          </main>
          <AudioPlayer />
        </AudioPlayerProvider>
      </body>
    </html>
  );
}
