export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-extrabold text-[var(--text-1)] mb-2">
        About Catchup
      </h1>
      <p className="text-sm text-[var(--text-3)] mb-8">
        Last updated: February 2026
      </p>

      <div className="bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius-xl)] shadow-[var(--shadow)] p-8 prose dark:prose-invert max-w-none space-y-6 text-[var(--text-2)]">
        <section>
          <h2 className="text-xl font-bold text-[var(--text-1)]">
            What is Catchup?
          </h2>
          <p>
            Catchup scrapes 15 of the top tech engineering blogs,
            extracts their articles, and converts them into NotebookLM-style
            conversational podcasts featuring two AI hosts. The result is a
            Spotify-like web player where you can browse, filter, and listen to
            the latest thinking from companies like Meta, Uber, Airbnb,
            Cloudflare, Netflix, and more.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text-1)]">
            Why?
          </h2>
          <p>
            Engineering blogs are some of the best sources of real-world
            technical knowledge, but keeping up with all of them is
            time-consuming. Catchup turns long-form posts into
            bite-sized audio you can listen to during a commute, workout, or
            coffee break — so you never fall behind on what top engineering
            teams are building.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text-1)]">
            How it works
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-[var(--text-2)]">
            <li>
              <strong className="text-[var(--text-1)]">Discover & Crawl</strong>{" "}
              — Sitemaps, RSS feeds, and blog page scraping find new posts
              across all sources.
            </li>
            <li>
              <strong className="text-[var(--text-1)]">Extract & Tag</strong>{" "}
              — Content is extracted with quality scoring, then auto-tagged into
              12 categories (infrastructure, AI/ML, security, and more).
            </li>
            <li>
              <strong className="text-[var(--text-1)]">Generate Podcasts</strong>{" "}
              — An LLM writes a two-host conversational script, then
              text-to-speech produces the final audio.
            </li>
            <li>
              <strong className="text-[var(--text-1)]">Listen</strong>{" "}
              — Browse the web player, filter by source or tag, build playlists,
              and hit play.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text-1)]">
            Tech highlights
          </h2>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-2)]">
            <li>Crawl4AI + RSS + sitemap discovery for broad coverage</li>
            <li>Multi-strategy content extraction with quality gating</li>
            <li>OpenAI TTS for natural-sounding conversational audio</li>
            <li>FastAPI backend with async job tracking</li>
            <li>Next.js 16 + React 19 frontend with global audio player</li>
            <li>Deployable via Docker or Railway with persistent storage</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text-1)]">
            Built by
          </h2>
          <p>
            Catchup is a personal project by Gaurav Surtani, built to
            make engineering knowledge more accessible. Contributions and
            feedback are welcome on{" "}
            <a
              href="https://github.com/gauravsurtani/tech-blog-catchup"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--blue)] hover:underline"
            >
              GitHub
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
