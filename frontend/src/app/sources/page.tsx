import Link from "next/link";
export default function Sources() {
  return (
    <section className="site-copy">
      <h1>Every episode starts somewhere.</h1>
      <p>
        Blog2Podcast uses source articles from engineering blogs and text
        submitted by approved members. A source link and publisher label
        accompany public articles so you can read the original in context.
      </p>
      <h2>How material becomes audio</h2>
      <ol>
        <li>Capture the source text and its original link.</li>
        <li>Create a summary and two-speaker script using Ollama Cloud.</li>
        <li>
          Check the script structure and source quotations, then render
          synthetic speech with Kokoro on the application server.
        </li>
        <li>
          Preview the private draft. An administrator reviews it before public
          release.
        </li>
      </ol>
      <p>
        Automated checks do not prove every claim is correct. Names,
        pronunciation, numbers and important caveats need human review. The
        original article remains the reference.
      </p>
      <h2>Permission and attribution</h2>
      <p>
        Educational purpose does not grant permission to reuse someone else’s
        writing. Members must have permission to process submitted text. Source
        discovery through a feed or website does not establish narration or
        republication rights. Public release requires a separate rights review.
      </p>
      <p>
        Raw article bodies are not included in the public API. Follow the
        original link for the complete article. Publisher names identify the
        source; they are not partners or endorsements.
      </p>
      <h2>Speech credits</h2>
      <p>
        New draft speech uses the{" "}
        <a href="https://huggingface.co/hexgrad/Kokoro-82M">Kokoro model</a> and{" "}
        <a href="https://github.com/thewh1teagle/kokoro-onnx">
          Kokoro ONNX runtime integration
        </a>{" "}
        with stock synthetic voices. Existing recordings may use the earlier
        speech pipeline.
      </p>
      <p>
        <Link href="/privacy">
          See how text and account information are handled.
        </Link>
      </p>
    </section>
  );
}
