import { EmptyState } from "@/components/empty-state";

export default function WorkflowsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Workflows</h2>
        <p className="text-zinc-500">Persistent jobs, approval queue, and automation rules.</p>
      </div>

      <EmptyState
        icon="⚙️"
        title="Workflows coming soon"
        description="The workflow engine and approval queue will be available in Phase 4."
      />
    </div>
  );
}
