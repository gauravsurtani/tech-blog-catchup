"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";

const STORAGE_KEY_COMPLETED = "tbc-onboarding-completed";

export default function OnboardingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY_COMPLETED);
    if (completed === "true") {
      router.replace("/");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return null;
  }

  return <OnboardingFlow />;
}
