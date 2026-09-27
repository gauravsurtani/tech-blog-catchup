import Link from "next/link";
import ArticleStory from "@/components/landing/ArticleStory";
export default function Home() {
  return (
    <>
      <section className="site-hero">
        <div className="hero-copy">
          <p className="site-kicker">
            <span />
            Public listening. Private creation.
          </p>
          <h1>
            Good ideas deserve
            <br />a little airtime.
          </h1>
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
        <div className="hero-art" aria-hidden="true">
          <div className="record">
            <div className="record-label">
              <span>Read it.</span>
              <strong>Hear it.</strong>
              <span>Think it through.</span>
            </div>
          </div>
          <div className="article-slip">
            <span>From the original article</span>
            <i />
            <i />
            <i />
            <b>
              A different way
              <br />
              to take it in.
            </b>
          </div>
        </div>
      </section>
      <div id="how-it-works" className="story-section">
        <div className="section-intro">
          <h2>
            From a page
            <br />
            to a point of view.
          </h2>
          <p>
            The source stays in the story. Here is what happens between choosing
            an article and pressing play.
          </p>
        </div>
        <ArticleStory />
      </div>
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
