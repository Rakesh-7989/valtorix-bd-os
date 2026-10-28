import { EmptyState } from "@/components/empty-state";

export default function OutreachPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Outreach</h2>
        <p className="text-zinc-500">Personalized email drafts and approval queues.</p>
      </div>

      <EmptyState
        icon="✉️"
        title="Outreach coming soon"
        description="AI outreach drafts and approval-gated sending will be available in Phases 3 and 5."
      />
    </div>
  );
}
