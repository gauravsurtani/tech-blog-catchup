import Link from "next/link";
import Logo from "@/components/Logo";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg)]">
      <div className="w-full max-w-sm space-y-8">
        <div className="bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] p-8 space-y-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <Logo variant="icon" className="h-16 w-16" />
            <h1 className="text-2xl font-extrabold text-[var(--text-1)]">
              Create your account
            </h1>
            <p className="text-sm text-[var(--text-2)]">
              Sign up using your Google or GitHub account to get started with Catchup.
            </p>
          </div>
          <Link
            href="/login"
            className="nb-hover inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-[var(--radius)] bg-[var(--primary)] text-[var(--primary-text)] font-semibold border-[var(--border-w)] border-[var(--border-color)] shadow-[var(--shadow-sm)] transition-colors"
          >
            Continue to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
