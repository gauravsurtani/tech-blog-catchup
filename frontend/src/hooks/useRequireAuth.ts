"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function useRequireAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return { loading: true, session: null } as const;
  }

  if (status === "authenticated") {
    return { loading: false, session } as const;
  }

  return { loading: true, session: null } as const;
}
