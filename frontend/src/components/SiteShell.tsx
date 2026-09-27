"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Sidebar from "./Sidebar";
import SidebarLayout from "./SidebarLayout";
import BottomTabs from "./BottomTabs";
import Footer from "./Footer";
import GenerationBanner from "./GenerationBanner";
export default function SiteShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const site = [
    "/",
    "/login",
    "/member",
    "/about",
    "/sources",
    "/terms",
    "/privacy",
  ].includes(path);
  if (!site)
    return (
      <>
        <Sidebar />
        <SidebarLayout>
          <GenerationBanner />
          <main
            id="main-content"
            className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-36"
          >
            {children}
          </main>
          <Footer />
        </SidebarLayout>
        <BottomTabs />
      </>
    );
  return (
    <div className="site">
      <header className="site-header">
        <Link href="/" className="site-brand" aria-label="Blog2Podcast home">
          <span aria-hidden="true" className="brand-sound">
            ▂▆▃▇▂
          </span>{" "}
          Blog2Podcast
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/listen">Library</Link>
          <Link href="/sources">Sources</Link>
          <Link href="/login" className="site-login">
            Member sign-in
          </Link>
        </nav>
      </header>
      <main id="main-content">{children}</main>
      <footer className="site-footer">
        <p>
          Made for curious people.
          <br />
          An educational project in private beta.
        </p>
        <nav aria-label="Footer">
          <Link href="/about">About</Link>
          <Link href="/sources">Sources & methodology</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
      </footer>
    </div>
  );
}
