import { EmptyState } from "@/components/empty-state";

export default function ApprovalsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Approvals</h2>
        <p className="text-zinc-500">Review and approve outreach, pricing, and deals.</p>
      </div>

      <EmptyState
        icon="✅"
        title="No pending approvals"
        description="The approval engine will be available in Phase 4 (Workflow Engine)."
      />
    </div>
  );
}
