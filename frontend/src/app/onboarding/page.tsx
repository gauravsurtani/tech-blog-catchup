"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";

const STORAGE_KEY_COMPLETED = "tbc-onboarding-completed";

export default function OnboardingPage() {
  const router = useRouter();
  const [ready] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY_COMPLETED) !== "true";
  });

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY_COMPLETED) === "true") {
      router.replace("/");
    }
  }, [router]);

  if (!ready) {
    return null;
  }

  return <OnboardingFlow />;
}
