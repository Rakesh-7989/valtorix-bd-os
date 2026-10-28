import { EmptyState } from "@/components/empty-state";

export default function CompaniesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Companies</h2>
        <p className="text-zinc-500">Company profiles and decision-maker records.</p>
      </div>

      <EmptyState
        icon="🏢"
        title="No companies yet"
        description="Company management will be available in Phase 2 (CRM Core)."
      />
    </div>
  );
}
