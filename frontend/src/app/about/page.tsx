import Link from "next/link";
export default function About() {
  return (
    <section className="site-copy">
      <h1>Learning, in another form.</h1>
      <p>
        Blog2Podcast is an educational project that turns source articles into
        short, two-speaker audio conversations. It is for people who want
        another way to explore technical ideas, with a link back to the original
        writing.
      </p>
      <h2>A quiet beta</h2>
      <p>
        The public library is open for browsing and listening. Creation is
        limited to approved members. New episodes begin as private drafts and
        require administrator review before publication.
      </p>
      <h2>The people behind the ideas</h2>
      <p>
        Original articles belong to their authors and publishers. AI-generated
        summaries and synthetic voices are not recordings of those authors, and
        do not imply their endorsement.
      </p>
      <p>
        Read <Link href="/sources">where the material comes from</Link> or{" "}
        <Link href="/listen">explore the library</Link>.
      </p>
    </section>
  );
}
