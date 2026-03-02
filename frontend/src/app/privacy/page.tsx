export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-extrabold text-[var(--text-1)] mb-2">
        Privacy Policy
      </h1>
      <p className="text-sm text-[var(--text-3)] mb-8">
        Last updated: February 2026
      </p>

      <div className="bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius-xl)] shadow-[var(--shadow)] p-8 prose dark:prose-invert max-w-none space-y-6 text-[var(--text-2)]">
        <section>
          <h2 className="text-xl font-bold text-[var(--text-1)]">
            1. Overview
          </h2>
          <p>
            Tech Blog Catchup is committed to protecting your privacy. This
            policy explains what data we collect, how we use it, and your rights
            regarding that data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text-1)]">
            2. Data We Collect
          </h2>
          <p>
            Tech Blog Catchup does not require user accounts and collects
            minimal data:
          </p>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-2)]">
            <li>
              <strong className="text-[var(--text-1)]">
                No personal information
              </strong>{" "}
              — We do not collect names, email addresses, or any
              personally identifiable information.
            </li>
            <li>
              <strong className="text-[var(--text-1)]">
                Local storage only
              </strong>{" "}
              — Playback preferences (volume, speed, queue) are stored in your
              browser&apos;s localStorage. This data never leaves your device.
            </li>
            <li>
              <strong className="text-[var(--text-1)]">
                No analytics tracking
              </strong>{" "}
              — We do not use Google Analytics, Facebook Pixel, or any
              third-party tracking scripts.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text-1)]">
            3. Cookies
          </h2>
          <p>
            Tech Blog Catchup does not set cookies. All client-side state is
            managed through browser localStorage, which is not transmitted to
            our servers.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text-1)]">
            4. Third-Party Services
          </h2>
          <p>
            The Service uses the following third-party services during content
            processing (server-side only):
          </p>
          <ul className="list-disc list-inside space-y-1 text-[var(--text-2)]">
            <li>
              <strong className="text-[var(--text-1)]">
                OpenAI API
              </strong>{" "}
              — For generating podcast scripts and text-to-speech audio. No user
              data is sent to OpenAI.
            </li>
            <li>
              <strong className="text-[var(--text-1)]">
                Crawl4AI
              </strong>{" "}
              — For scraping publicly available blog content. No user data is
              involved.
            </li>
          </ul>
          <p>
            These services process only publicly available blog content, not
            user data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text-1)]">
            5. Data Retention
          </h2>
          <p>
            Since we do not collect personal data, there is nothing to retain or
            delete. Blog content and generated audio are stored on our servers
            for the purpose of providing the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text-1)]">
            6. Your Rights
          </h2>
          <p>
            As we do not collect personal data, there are no user profiles to
            access, modify, or delete. You can clear your localStorage at any
            time through your browser settings to remove locally stored
            playback preferences.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text-1)]">
            7. Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be
            reflected by an updated &quot;Last updated&quot; date on this page.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text-1)]">
            8. Contact
          </h2>
          <p>
            If you have questions about this Privacy Policy, please open an
            issue on our{" "}
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
