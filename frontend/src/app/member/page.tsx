"use client";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { submitPost } from "@/lib/api";
interface Member {
  role: string;
}
interface Job {
  id: number;
  status: string;
  stage: string | null;
  error_message: string | null;
  artifact: string | null;
}
export default function MemberPage() {
  const { status } = useSession();
  const [member, setMember] = useState<Member | null>(null);
  const [message, setMessage] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (status !== "authenticated") return;
    let active = true;
    async function refresh() {
      try {
        const me = await fetch("/api/backend/users/me", { cache: "no-store" });
        const data = await me.json();
        if (!me.ok) throw new Error(data.detail || "Access unavailable");
        if (active) setMember(data.user);
        const r = await fetch("/api/backend/jobs", { cache: "no-store" });
        if (r.ok && active) setJobs(await r.json());
      } catch (e) {
        if (active)
          setMessage(e instanceof Error ? e.message : "Status unavailable");
      }
    }
    refresh();
    const id = setInterval(refresh, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [status]);
  if (status === "unauthenticated")
    return (
      <section className="site-copy">
        <h1>Member studio</h1>
        <p>
          <Link href="/login">Sign in</Link> to check your access.
        </p>
      </section>
    );
  return (
    <section className="site-copy">
      <h1>Member studio</h1>
      <p>
        New episodes stay private until an administrator reviews and publishes
        them.
      </p>
      <p role="status">
        {message ||
          (member?.role === "pending"
            ? "Your account is pending approval. Public listening remains open."
            : member
              ? `Access: ${member.role}`
              : "Checking access…")}
      </p>
      {member && ["member", "admin"].includes(member.role) && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const data = new FormData(e.currentTarget);
            try {
              await submitPost({
                title: String(data.get("title")),
                text: String(data.get("text")),
              });
              setMessage("Your private draft is queued.");
            } catch (error) {
              setMessage(
                error instanceof Error
                  ? error.message
                  : "Generation unavailable",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Episode title
            <input name="title" required maxLength={500} />
          </label>
          <label>
            Source text you have permission to use
            <textarea
              name="text"
              required
              minLength={100}
              maxLength={50000}
              rows={8}
            />
          </label>
          <label>
            <input type="checkbox" required /> I have permission to process this
            text and send it to the text provider.
          </label>
          <button className="site-button" disabled={busy}>
            {busy ? "Submitting…" : "Create private draft"}
          </button>
        </form>
      )}
      <div>
        {jobs.map((j) => {
          const a = j.artifact ? JSON.parse(j.artifact) : null;
          return (
            <article key={j.id} className="member-job">
              <h2>Draft {j.id}</h2>
              <p>
                {j.status}
                {j.stage ? `: ${j.stage}` : ""}
              </p>
              {j.error_message && <p>{j.error_message}</p>}
              {a && (
                <>
                  <p>{a.summary}</p>
                  <audio
                    controls
                    preload="none"
                    src={`/api/backend/${a.audio_path}`}
                  />
                  <details>
                    <summary>Script and source evidence</summary>
                    <p>{a.podcast_script}</p>
                    <ul>
                      {a.evidence?.map((q: string) => (
                        <li key={q}>{q}</li>
                      ))}
                    </ul>
                  </details>
                </>
              )}
              {["queued", "running", "retrying"].includes(j.status) && (
                <button
                  onClick={() =>
                    fetch(`/api/backend/jobs/${j.id}/cancel`, {
                      method: "POST",
                    }).then(() => setMessage("Cancellation requested."))
                  }
                >
                  Cancel
                </button>
              )}
              {member?.role === "admin" && j.status === "completed" && (
                <button
                  onClick={() =>
                    fetch(`/api/backend/jobs/${j.id}/publish`, {
                      method: "POST",
                    }).then(async (r) =>
                      setMessage(
                        r.ok ? "Episode published." : (await r.json()).detail,
                      ),
                    )
                  }
                >
                  Publish reviewed episode
                </button>
              )}
            </article>
          );
        })}
      </div>
      <button onClick={() => signOut({ callbackUrl: "/" })}>Sign out</button>
    </section>
  );
}
