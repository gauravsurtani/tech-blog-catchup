export const dynamic = "force-dynamic";

export default function Privacy() {
  const contact = process.env.OPERATOR_CONTACT;
  return (
    <section className="site-copy">
      <h1>Privacy notice</h1>
      <p>
        Private-beta implementation draft. Operator identity, contact details
        and retention periods must be confirmed before new member access is
        enabled.
      </p>
      <h2>What the application stores</h2>
      <p>
        Signing in uses Google or GitHub. The application stores your verified
        email, provider identity, membership status and account preferences.
        Authentication uses session cookies. The player uses browser storage for
        listening preferences and queue/history features.
      </p>
      <p>
        Submitted text, its source reference, generated scripts, supporting
        quotations, audio and job status are stored on the server.
        Administrators can review private drafts. Public visitors can read
        published summaries and play published recordings.
      </p>
      <h2>Where processing happens</h2>
      <p>
        Source text and prompts are sent to Ollama Cloud for text generation.
        Its handling of those requests is described in{" "}
        <a href="https://ollama.com/privacy">Ollama’s privacy policy</a>. New
        speech synthesis runs on the application server using Kokoro; it does
        not require sending text to OpenAI. Railway hosts the application and
        persistent files. Login providers process sign-in information under
        their own policies.
      </p>
      <h2>Retention and removal</h2>
      <p>
        There is currently no automatic expiry for accounts, source snapshots or
        generated files. Server and hosting logs may contain request metadata. A
        retention schedule and private contact route must be established before
        accepting new member content.
      </p>
      <p>
        Withdrawing an episode removes application access to its public
        recording. Copies already downloaded while it was public cannot be
        recalled. Private API responses and audio previews are marked not to be
        cached; the service worker stores only static application assets.
      </p>
      <h2>Contact</h2>
      <p>
        {contact ? (
          <>
            Contact the operator at <a href={`mailto:${contact}`}>{contact}</a>.
          </>
        ) : (
          "The operator’s private contact route is pending configuration. Do not put private material in public issue trackers."
        )}
      </p>
    </section>
  );
}
