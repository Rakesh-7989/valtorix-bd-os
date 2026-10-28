import { EmptyState } from "@/components/empty-state";

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Pipeline</h2>
        <p className="text-zinc-500">Visual Kanban board for deal stages.</p>
      </div>

      <EmptyState
        icon="🔄"
        title="Pipeline coming soon"
        description="The Kanban pipeline view will be available in Phase 2 (CRM Core)."
      />
    </div>
  );
}
