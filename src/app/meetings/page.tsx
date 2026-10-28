import { EmptyState } from "@/components/empty-state";

export default function MeetingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Meetings</h2>
        <p className="text-zinc-500">Discovery calls, scheduling, and action items.</p>
      </div>

      <EmptyState
        icon="📅"
        title="Meetings coming soon"
        description="Meeting records and discovery templates will be available in Phase 6."
      />
    </div>
  );
}
