export const dynamic = "force-dynamic";

export default function Terms() {
  const operator = process.env.OPERATOR_NAME;
  return (
    <section className="site-copy">
      <h1>Terms of use</h1>
      <p>
        Private-beta draft. These terms require operator and jurisdiction review
        before new member access is enabled.
      </p>
      <h2>The service</h2>
      <p>
        Blog2Podcast is an educational project
        {operator ? ` operated by ${operator}` : ""}. Public visitors may browse
        the library and listen. Generation is restricted to approved members and
        may be limited or unavailable.
      </p>
      <h2>Your submissions</h2>
      <p>
        Submit only material you have permission to use and send to the
        service’s processors. Do not submit confidential information,
        third-party personal information without permission, or material
        intended to bypass access restrictions. You remain responsible for your
        submissions.
      </p>
      <p>
        Creating a draft does not publish it. Administrator review is required
        before a draft appears in the public library. Source authors retain
        their rights; using this service does not grant rights to reuse their
        work.
      </p>
      <h2>AI output</h2>
      <p>
        Episodes contain AI-generated summaries and synthetic voices. They may
        misstate facts, omit context or pronounce words incorrectly. Check
        important details against the linked source. The voices do not represent
        the source authors.
      </p>
      <h2>Fair use of the application</h2>
      <p>
        Do not bypass membership controls, impersonate another user, interfere
        with the service or generate abusive requests. Access may be suspended
        for misuse. Availability and features can change during the beta.
      </p>
      <h2>Questions and removals</h2>
      <p>
        The operator’s contact route, governing jurisdiction and final retention
        policy are launch requirements. This draft does not promise a legal
        outcome or a deletion timetable that has not been implemented.
      </p>
    </section>
  );
}
