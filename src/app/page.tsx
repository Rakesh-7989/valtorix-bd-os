import { MetricsCard } from "@/components/metrics-card";
import Link from "next/link";

// Demo data — clearly labelled as sample data, not real company results
const DEMO_STATS = {
  totalLeads: 24,
  qualifiedLeads: 8,
  openDeals: 5,
  pendingApprovals: 3,
};

const DEMO_ACTIVITIES = [
  { time: "10:30 AM", action: "New lead imported", entity: "Acme Architects", type: "lead" },
  { time: "09:15 AM", action: "Outreach draft created", entity: "BuildWell Constructions", type: "outreach" },
  { time: "Yesterday", action: "Proposal approved", entity: "Skyline Design Studio", type: "proposal" },
  { time: "Yesterday", action: "Discovery call scheduled", entity: "Urban Spaces PLC", type: "meeting" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Dashboard</h2>
          <p className="text-zinc-500">Welcome back. Here is your BD pipeline overview.</p>
        </div>
        <Link
          href="/leads"
          className="px-4 py-2 text-sm font-medium text-zinc-900 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
        >
          View All Leads
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard label="Total Leads" value={DEMO_STATS.totalLeads} change="+3 this week" changeType="positive" />
        <MetricsCard label="Qualified Leads" value={DEMO_STATS.qualifiedLeads} change="+1 since Monday" changeType="positive" />
        <MetricsCard label="Open Deals" value={DEMO_STATS.openDeals} change="2 pending signature" changeType="neutral" />
        <MetricsCard label="Pending Approvals" value={DEMO_STATS.pendingApprovals} change="Requires review" changeType="neutral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <section className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {DEMO_ACTIVITIES.map((activity, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="text-zinc-400 mt-1">{activity.time}</span>
                <div className="flex-1">
                  <p className="text-sm text-zinc-900">
                    <span className="font-medium">{activity.action}</span>{" "}
                    <span className="text-zinc-500">for {activity.entity}</span>
                  </p>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    activity.type === "lead"
                      ? "bg-emerald-50 text-emerald-700"
                      : activity.type === "outreach"
                        ? "bg-blue-50 text-blue-700"
                        : activity.type === "proposal"
                          ? "bg-purple-50 text-purple-700"
                          : "bg-indigo-50 text-indigo-700"
                  }`}>
                    {activity.type}
                  </span>
                </div>
              </div>
            ))}
            <div className="text-center py-4 text-zinc-400 text-sm">
              These are demo activities. Real data will appear after Phase 1 (Supabase) is connected.
            </div>
          </div>
        </section>

        {/* Pipeline Overview */}
        <section className="bg-white border border-zinc-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider mb-4">Pipeline Overview</h3>
          <div className="space-y-3">
            {[
              { stage: "New", count: 12, color: "bg-zinc-100 text-zinc-700" },
              { stage: "Contacted", count: 6, color: "bg-blue-100 text-blue-700" },
              { stage: "Qualified", count: 4, color: "bg-emerald-100 text-emerald-700" },
              { stage: "Proposal Sent", count: 2, color: "bg-purple-100 text-purple-700" },
              { stage: "Negotiation", count: 1, color: "bg-amber-100 text-amber-700" },
            ].map((stage) => (
              <div key={stage.stage} className="flex items-center justify-between text-sm">
                <span className="text-zinc-600">{stage.stage}</span>
                <span className={`px-2 py-0.5 rounded ${stage.color}`}>{stage.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 text-xs text-zinc-400">
            Pipeline values are demo data. Connect Supabase in Phase 1 for real records.
          </div>
        </section>
      </div>

      {/* Empty state notice for modules not yet implemented */}
      <section className="bg-white border border-zinc-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider mb-4">Coming Next</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: "Leads Management", desc: "Import, qualify, and track leads" },
            { title: "AI Outreach", desc: "Generate and approve outreach drafts" },
            { title: "Proposals", desc: "Create and send proposal documents" },
            { title: "Deal Closing", desc: "Track negotiations and close deals" },
          ].map((item) => (
            <div key={item.title} className="p-4 border border-zinc-200 rounded-lg">
              <h4 className="text-sm font-medium text-zinc-900">{item.title}</h4>
              <p className="text-xs text-zinc-500 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-zinc-100 text-xs text-zinc-400">
          Phase 0 is the foundation shell. CRM, AI, and workflow modules arrive in Phases 1–4.
        </div>
      </section>
    </div>
  );
}
