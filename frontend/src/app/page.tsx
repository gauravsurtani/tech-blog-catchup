import Link from "next/link";
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
        </div>
        <div className="product-features">
          <article>
            <span className="feature-mark" aria-hidden="true">
              ↗
            </span>
            <h3>Follow your curiosity</h3>
            <p>
              Explore engineering articles by source and topic. The original
              link stays attached, so you can always go deeper.
            </p>
            <Link href="/browse">Browse topics</Link>
          </article>
          <article>
            <span className="feature-mark" aria-hidden="true">
              ≋
            </span>
            <h3>Make room to listen</h3>
            <p>
              Build a queue, change playback speed and pick up where you left
              off. Your episode stays with you as you browse.
            </p>
            <Link href="/listen">Open the player</Link>
          </article>
          <article>
            <span className="feature-mark" aria-hidden="true">
              ✳
            </span>
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
        <div>
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
        <div>
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
    </>
  );
}
