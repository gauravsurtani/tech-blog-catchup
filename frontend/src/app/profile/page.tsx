"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import { User, Calendar } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import ListeningStats from "@/components/ListeningStats";
import { useMemo } from "react";

const PLAYBACK_POSITIONS_KEY = "tbc-playback-positions";

function getMemberSince(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PLAYBACK_POSITIONS_KEY);
    if (!raw) return null;
    const positions = JSON.parse(raw);
    const timestamps = Object.values(positions)
      .map((p: unknown) => new Date((p as { updatedAt: string }).updatedAt).getTime())
      .filter((t: number) => !isNaN(t));
    if (timestamps.length === 0) return null;
    return new Date(Math.min(...timestamps)).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const user = session?.user;

  const memberSince = useMemo(() => getMemberSince(), []);

  const initials = useMemo(() => {
    if (!user) return "?";
    return (user.name || user.email || "?")
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [user]);

  return (
    <AuthGuard>
      <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <User className="w-6 h-6 text-[var(--color-text-muted)]" />
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Profile</h1>
        </div>

        {/* User Info Card */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 mb-8">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name || "User avatar"}
                width={72}
                height={72}
                className="rounded-full object-cover shrink-0"
                referrerPolicy="no-referrer"
                unoptimized
              />
            ) : (
              <span className="w-[72px] h-[72px] rounded-full shrink-0 bg-[var(--color-accent)] text-[var(--color-accent-text)] flex items-center justify-center text-2xl font-bold">
                {initials}
              </span>
            )}

            {/* Name / Email / Member since */}
            <div className="min-w-0 flex-1">
              {user?.name && (
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)] truncate">
                  {user.name}
                </h2>
              )}
              {user?.email && (
                <p className="text-sm text-[var(--color-text-secondary)] truncate mt-0.5">
                  {user.email}
                </p>
              )}
              {memberSince && (
                <p className="text-xs text-[var(--color-text-muted)] mt-2 flex items-center gap-1.5">
                  <Calendar size={12} />
                  Member since {memberSince}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Listening Stats */}
        <ListeningStats />
      </div>
    </AuthGuard>
  );
}
