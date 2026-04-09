"use client";

import SettingsForm from "@/components/SettingsForm";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-6 h-6 text-[var(--text-3)]" />
        <h1 className="text-2xl font-extrabold text-[var(--text-1)]">Settings</h1>
      </div>
      <SettingsForm />
    </div>
  );
}
