"use client";

import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { Activity, Clock } from "lucide-react";

export default function ActivityPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Activity
          </h1>
          <p className="text-sm text-slate-400">
            Global timeline of agent execution events, commands, and file inspections.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-6">
          <EmptyState
            icon={Activity}
            title="No Global Activity Recorded"
            description="Active commands, file inspections, and execution loop steps will stream here in real-time as tasks are dispatched."
          />
        </div>
      </div>
    </AppShell>
  );
}
