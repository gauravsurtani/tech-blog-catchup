export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-extrabold text-[var(--text-1)] mb-2">
        Terms of Service
      </h1>
      <p className="text-sm text-[var(--text-3)] mb-8">
        Last updated: April 2026
      </p>

      <div className="bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius-xl)] shadow-[var(--shadow)] p-8 prose dark:prose-invert max-w-none space-y-6 text-[var(--text-2)]">
        <section>
          <h2 className="text-xl font-bold text-[var(--text-1)]">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using Catchup (&quot;the Service&quot;),
            you agree to be bound by these Terms of Service. If you do not agree
            to these terms, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text-1)]">
            2. Description of Service
          </h2>
          <p>
            Catchup aggregates publicly available content from tech
            engineering blogs and generates AI-produced conversational podcast
            summaries. The Service is provided for informational and educational
            purposes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text-1)]">
            3. Content & Intellectual Property
          </h2>
          <p>
            The original blog content referenced by the Service remains the
            intellectual property of its respective authors and publishers.
            Podcast audio is generated using AI and represents a summary
            interpretation, not a reproduction of the original work. We link
            back to original sources whenever possible.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text-1)]">
            4. Use Restrictions
          </h2>
          <p>You agree not to:</p>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-2)]">
            <li>
              Use the Service for any unlawful purpose or in violation of any
              applicable laws
            </li>
            <li>
              Attempt to interfere with, compromise, or disrupt the Service
            </li>
            <li>
              Redistribute generated audio content for commercial purposes
              without permission
            </li>
            <li>
              Scrape or programmatically access the Service beyond normal usage
              patterns
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text-1)]">
            5. Disclaimer of Warranties
          </h2>
          <p>
            The Service is provided &quot;as is&quot; and &quot;as
            available&quot; without warranties of any kind, either express or
            implied. We do not guarantee the accuracy, completeness, or
            reliability of any AI-generated content. Podcast summaries may
            contain errors or omissions — always refer to the original blog post
            for authoritative information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text-1)]">
            6. Limitation of Liability
          </h2>
          <p>
            To the fullest extent permitted by law, Catchup and its
            maintainers shall not be liable for any indirect, incidental,
            special, or consequential damages arising out of your use of the
            Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text-1)]">
            7. Changes to Terms
          </h2>
          <p>
            We reserve the right to modify these Terms of Service at any time.
            Changes will be reflected by an updated &quot;Last updated&quot;
            date on this page. Continued use of the Service after changes
            constitutes acceptance of the revised terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text-1)]">
            8. Contact
          </h2>
          <p>
            If you have questions about these Terms, please open an issue on our{" "}
            <a
              href="https://github.com/gauravsurtani/tech-blog-catchup"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--blue)] hover:underline"
            >
              GitHub repository
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
