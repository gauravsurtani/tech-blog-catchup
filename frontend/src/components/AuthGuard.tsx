"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { loading } = useRequireAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--color-text-tertiary)] border-t-[var(--color-accent)]" />
      </div>
    );
  }

  return <>{children}</>;
}
