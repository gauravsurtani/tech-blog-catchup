import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import ThemeProvider from "@/components/ThemeProvider";
import { AudioPlayerProvider } from "@/hooks/useAudioPlayer";
import AudioPlayer from "@/components/AudioPlayer";
import SessionProvider from "@/components/SessionProvider";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-dm-sans",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FF6B6B",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://blog2podcast.com"),
  title: {
    default: "Blog2Podcast",
    template: "%s | Blog2Podcast",
  },
  description: "Listen to tech engineering blogs as conversational podcasts",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Blog2Podcast",
  },
  openGraph: {
    type: "website",
    siteName: "Blog2Podcast",
    title: "Blog2Podcast",
    description: "Listen to tech engineering blogs as conversational podcasts",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog2Podcast",
    description: "Listen to tech engineering blogs as conversational podcasts",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon-192.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} font-[var(--font)] bg-[var(--bg)] text-[var(--text-1)] min-h-dvh`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[var(--primary)] focus:text-[var(--primary-text)] focus:rounded-[var(--radius)] focus:border-[var(--border-w)] focus:border-[var(--border-color)]"
        >
          Skip to content
        </a>
        <ThemeProvider>
          <SessionProvider>
            <AudioPlayerProvider>
              <SiteShell>{children}</SiteShell>
              <AudioPlayer />
              <ServiceWorkerRegistration />
            </AudioPlayerProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
