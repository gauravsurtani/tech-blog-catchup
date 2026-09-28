"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
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
          <Logo variant="full" className="site-wordmark" />
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/listen">Library</Link>
          <Link href="/sources">Sources</Link>
          <Link href="/login" className="site-login">
            Member sign-in
          </Link>
          <ThemeToggle />
        </nav>
      </header>
      <main id="main-content">{children}</main>
      <footer className="site-footer" data-home-footer={path === "/" ? "" : undefined}>
        {path === "/" && (
          <div className="footer-signoff">
            <svg viewBox="0 0 1000 100" fill="none" aria-hidden="true">
              <path pathLength="1" d="M0 50H200C240 50 240 15 280 15S320 85 360 85S400 5 440 5S480 95 520 95S560 25 600 25S640 65 680 65S720 50 760 50H1000" />
            </svg>
            <h2>Take a good idea<br />with you.</h2>
            <Link href="/listen" className="site-button">Find your next listen <span aria-hidden="true">↗</span></Link>
            <p>Public listening. Thoughtful creation.</p>
          </div>
        )}
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
