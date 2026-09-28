import Link from "next/link";
import LandingScroll from "@/components/landing/LandingScroll";
import WordToSound from "@/components/landing/WordToSound";
export default function Home() {
  return (
    <>
      <section className="site-hero">
        <div className="hero-copy">
          <p className="site-kicker">
            <span />
            Public listening. Private creation.
          </p>
          <h1>Good ideas deserve a little airtime.</h1>
          <p className="hero-description">
            Turn a blog post into a conversation you can listen to. Keep
            learning when your eyes need a break.
          </p>
          <div className="hero-actions">
            <Link className="site-button" href="/listen">
              Explore the library
            </Link>
            <a href="#how-it-works">See how it happens</a>
          </div>
          <p className="hero-footnote">
            An educational project, quietly open to a small group of creators.
          </p>
        </div>
        <div id="how-it-works" className="hero-motion">
          <WordToSound />
        </div>
      </section>
      <LandingScroll>
      <section className="format-strip" aria-label="What you can do">
        <span>Read the source</span>
        <span aria-hidden="true">↗</span>
        <span>Hear the conversation</span>
        <span aria-hidden="true">↗</span>
        <span>Keep the idea</span>
      </section>
      <section className="product-notes">
        <div className="section-intro">
          <h2>
            A reading habit.
            <br />
            With a play button.
          </h2>
          <p>
            For the articles you saved, the tabs you left open, and the ideas
            you want to spend more time with.
          </p>
          <div className="reading-progress" aria-hidden="true">
            <span>Keep scrolling. Follow an idea.</span>
            <div data-progress-step><b>01</b> Find a source</div>
            <div data-progress-step><b>02</b> Make time to listen</div>
            <div data-progress-step><b>03</b> Create with care</div>
          </div>
        </div>
        <div className="product-features">
          <article data-scroll-card>
            <div className="feature-preview source-list" aria-hidden="true">
              <span className="preview-caption">Your next rabbit hole</span>
              <div><b>Engineering</b><span>↗</span></div>
              <div><b>Systems & ideas</b><span>↗</span></div>
              <div><b>Something unexpected</b><span>↗</span></div>
              <small>Every episode keeps its source.</small>
            </div>
            <h3>Follow your curiosity</h3>
            <p>
              Explore engineering articles by source and topic. The original
              link stays attached, so you can always go deeper.
            </p>
            <Link href="/browse">Browse topics</Link>
          </article>
          <article data-scroll-card>
            <div className="feature-preview mini-player" aria-hidden="true">
              <span className="preview-caption">A little room for an idea</span>
              <div className="preview-wave">{[18,32,49,65,38,76,91,55,72,42,84,62,35,57,26,43,19].map((height, i) => <i key={i} style={{ height: `${height}%` }} />)}</div>
              <div className="preview-player-controls"><span>▶</span><span>Listen at your pace</span><b>1.25×</b></div>
            </div>
            <h3>Make room to listen</h3>
            <p>
              Build a queue, change playback speed and pick up where you left
              off. Your episode stays with you as you browse.
            </p>
            <Link href="/listen">Open the player</Link>
          </article>
          <article data-scroll-card>
            <div className="feature-preview draft-review" aria-hidden="true">
              <span className="preview-caption">Care before publication</span>
              <div><span>01</span><b>Read the source</b><i>✓</i></div>
              <div><span>02</span><b>Listen to the draft</b><i>✓</i></div>
              <div><span>03</span><b>Review the claims</b><i>↗</i></div>
              <small>Private until reviewed.</small>
            </div>
            <h3>Create with care</h3>
            <p>
              Approved members turn permitted source text into private drafts.
              Listen, check the claims, then submit for review.
            </p>
            <Link href="/login">Member studio</Link>
          </article>
        </div>
      </section>
      <section className="listening-notes">
        <div data-scroll-note>
          <h2>
            Keep your curiosity.
            <br />
            Change the format.
          </h2>
          <p>
            Browse the public collection, build a listening queue and return to
            the original article when you want to go deeper.
          </p>
          <Link href="/listen">Find something to listen to</Link>
        </div>
        <div data-scroll-note>
          <h3>A thoughtful first draft</h3>
          <p>
            AI voices and summaries can make mistakes. Episodes are an aid to
            understanding, and original authors remain the source of their
            ideas.
          </p>
          <h3>A small, deliberate beta</h3>
          <p>
            Anyone can browse and listen. Creating episodes requires an approved
            account. New drafts stay private until reviewed for publication.
          </p>
          <Link href="/sources">Read our methodology</Link>
        </div>
      </section>
      </LandingScroll>
    </>
  );
}
