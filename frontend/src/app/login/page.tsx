import { authEnabled, auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
export const dynamic = "force-dynamic";
export default async function Login() {
  const host = (await headers()).get("host");
  if (host === "www.blog2podcast.com")
    redirect("https://blog2podcast.com/login");
  if (authEnabled && await auth()) redirect("/member");
  const providers = [
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? "google"
      : null,
    process.env.GITHUB_ID && process.env.GITHUB_SECRET ? "github" : null,
  ].filter(Boolean) as string[];
  return (
    <section className="site-copy">
      <p className="site-kicker">Private beta</p>
      <h1>A little room for learning.</h1>
      <p>
        Anyone can listen. Creating episodes is available to a small group of
        approved members. Signing in creates a pending account; it does not
        automatically grant generation access.
      </p>
      {authEnabled ? (
        providers.map((provider) => (
          <form
            key={provider}
            action={async () => {
              "use server";
              await signIn(provider, { redirectTo: "/member" });
            }}
          >
            <button className="site-button">
              Continue with {provider === "google" ? "Google" : "GitHub"}
            </button>
          </form>
        ))
      ) : (
        <p role="status">
          Member sign-in is being configured. The public library is open.
        </p>
      )}
      <p>
        <Link href="/listen">Browse the library</Link>
      </p>
      <small>
        By signing in, you accept the <Link href="/terms">terms</Link> and
        acknowledge the <Link href="/privacy">privacy notice</Link>.
      </small>
    </section>
  );
}
