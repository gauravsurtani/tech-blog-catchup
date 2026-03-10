"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { loading, authEnabled } = useRequireAuth();

  // When no OAuth providers are configured, allow anonymous access
  if (authEnabled === false) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--tag-bg)] border-t-[var(--primary)]" />
      </div>
    );
  }

  return <>{children}</>;
}
