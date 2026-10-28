import { EmptyState } from "@/components/empty-state";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Reports</h2>
        <p className="text-zinc-500">Conversion metrics, activity history, and AI logs.</p>
      </div>

      <EmptyState
        icon="📈"
        title="Reports coming soon"
        description="Dashboard analytics and conversion reporting will be available in Phase 7."
      />
    </div>
  );
}
