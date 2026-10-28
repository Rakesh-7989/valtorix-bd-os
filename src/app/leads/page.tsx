import { EmptyState } from "@/components/empty-state";

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Leads</h2>
        <p className="text-zinc-500">Manage and qualify your BD leads.</p>
      </div>

      <EmptyState
        icon="👥"
        title="No leads yet"
        description="Lead import and management will be available in Phase 2 (CRM Core). For now, this is a placeholder page."
      />
    </div>
  );
}
