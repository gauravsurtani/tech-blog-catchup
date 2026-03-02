"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Github } from "lucide-react";
import Logo from "@/components/Logo";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg)]">
      <div className="w-full max-w-sm space-y-8">
        {/* Form card */}
        <div className="bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] p-8 space-y-8">
          {/* Logo */}
          <div className="flex flex-col items-center gap-4">
            <Logo variant="icon" className="h-16 w-16" />
            <h1 className="text-2xl font-extrabold text-[var(--text-1)]">
              Welcome back
            </h1>
            <p className="text-sm text-[var(--text-2)]">
              Sign in to Catchup
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-[var(--radius)] border-[var(--border-w)] border-[var(--error)] px-4 py-3 text-sm text-[var(--error)] bg-[var(--error-bg)] text-center">
              {error === "OAuthSignin" ? "Error starting sign in. Try again." :
               error === "OAuthCallback" ? "Error completing sign in. Try again." :
               error === "Callback" ? "Sign in error. Try again." :
               "Something went wrong. Please try again."}
            </div>
          )}

          {/* Sign-in buttons */}
          <div className="space-y-3">
            <button
              onClick={() => signIn("google", { callbackUrl })}
              className="nb-hover w-full flex items-center justify-center gap-3 rounded-[var(--radius)] px-6 py-3 font-semibold transition-colors cursor-pointer border-[var(--border-w)] border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-1)] shadow-[var(--shadow-sm)]"
            >
              <GoogleIcon className="h-5 w-5" />
              Continue with Google
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[var(--split)]" />
              <span className="text-xs text-[var(--text-3)]">or</span>
              <div className="flex-1 h-px bg-[var(--split)]" />
            </div>

            <button
              onClick={() => signIn("github", { callbackUrl })}
              className="nb-hover w-full flex items-center justify-center gap-3 rounded-[var(--radius)] px-6 py-3 font-semibold transition-colors cursor-pointer border-[var(--border-w)] border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-1)] shadow-[var(--shadow-sm)]"
            >
              <Github className="h-5 w-5" />
              Continue with GitHub
            </button>
          </div>
        </div>

        {/* Terms */}
        <p className="text-center text-xs text-[var(--text-3)]">
          By signing in, you agree to our{" "}
          <a href="/terms" className="text-[var(--blue)] hover:underline">
            Terms
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-[var(--blue)] hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
