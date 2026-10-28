import { EmptyState } from "@/components/empty-state";

export default function ProposalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Proposals</h2>
        <p className="text-zinc-500">Proposal generation, versioning, and approval.</p>
      </div>

      <EmptyState
        icon="📄"
        title="Proposals coming soon"
        description="Proposal Studio will be available in Phase 6 (Deal Lifecycle)."
      />
    </div>
  );
}
