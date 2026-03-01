"use client";

import AuthGuard from "@/components/AuthGuard";
import SettingsForm from "@/components/SettingsForm";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <AuthGuard>
      <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-6 h-6 text-[var(--color-text-muted)]" />
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Settings</h1>
        </div>
        <SettingsForm />
      </div>
    </AuthGuard>
  );
}
