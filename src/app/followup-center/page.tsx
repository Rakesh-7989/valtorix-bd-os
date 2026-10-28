"use client";

import { useState, useEffect } from "react";

type FollowupTask = {
  id: string;
  lead_id: string;
  contact_id: string;
  rule_id: string | null;
  sequence_step: number;
  status: string;
  stop_reason: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-zinc-50 text-zinc-700",
  sent: "bg-blue-50 text-blue-700",
  skipped: "bg-zinc-100 text-zinc-500",
  stopped: "bg-rose-50 text-rose-700",
};

async function fetchFollowupTasks(leadId?: string): Promise<FollowupTask[]> {
  const params = new URLSearchParams();
  if (leadId) params.set("leadId", leadId);

  const res = await fetch(`/api/followups?${params}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (res.ok) {
    const data = await res.json();
    return data.tasks || [];
  }
  return [];
}

async function updateTaskStatus(
  id: string,
  status: "scheduled" | "sent" | "skipped" | "stopped",
  stopReason?: string
): Promise<boolean> {
  const res = await fetch(`/api/followups/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, stopReason }),
  });
  return res.ok;
}

export default function FollowupCenterPage() {
  const [tasks, setTasks] = useState<FollowupTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [leadFilter, setLeadFilter] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const data = await fetchFollowupTasks(leadFilter || undefined);
      if (mounted) {
        setTasks(data);
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [leadFilter, refresh]);

  const reload = () => setRefresh((r) => r + 1);

  const pendingCount = tasks.filter((t) => t.status === "scheduled").length;

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center pl-64">
        <div className="text-zinc-500">Loading follow-up tasks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Follow-up Center</h2>
          <p className="text-zinc-500">
            Manage follow-up tasks and sequences for your leads.
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-amber-100 border border-amber-200 rounded-lg px-4 py-3 text-sm">
            <span className="text-amber-900 font-medium">{pendingCount} pending follow-up{pendingCount > 1 ? "s" : ""}</span>
          </div>
        )}
        <button
          onClick={reload}
          className="px-4 py-2 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Filter by lead ID..."
            value={leadFilter}
            onChange={(e) => setLeadFilter(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Lead ID
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Contact ID
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Step
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Created
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                  No follow-up tasks found.
                </td>
              </tr>
            ) : (
              tasks.map((t) => (
                <tr key={t.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3 text-zinc-900 font-mono text-xs">
                    {t.lead_id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3 text-zinc-600 text-xs font-mono">
                    {t.contact_id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    Step {t.sequence_step}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                        STATUS_COLORS[t.status] || "bg-zinc-50 text-zinc-700"
                      }`}
                    >
                      {t.status}
                    </span>
                    {t.stop_reason && (
                      <span className="ml-2 text-xs text-rose-600" title={t.stop_reason}>
                        ⚠ {t.stop_reason}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {new Date(t.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {t.status === "scheduled" ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => updateTaskStatus(t.id, "sent")}
                          className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded hover:bg-emerald-700 transition-colors"
                        >
                          Mark Sent
                        </button>
                        <button
                          onClick={() =>
                            updateTaskStatus(t.id, "stopped", "Cancelled by user")
                          }
                          className="px-3 py-1.5 bg-rose-600 text-white text-xs font-medium rounded hover:bg-rose-700 transition-colors"
                        >
                          Stop
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <h4 className="text-sm font-semibold text-amber-900 mb-2">
          How Follow-ups Work
        </h4>
        <ul className="text-sm text-amber-800 space-y-2 list-disc list-inside">
          <li>
            Follow-up tasks are created from rule-defined sequences.
          </li>
          <li>
            Tasks stop automatically on reply, opt-out, or deal closure.
          </li>
          <li>
            Stop conditions are checked before each follow-up is sent.
          </li>
          <li>
            All follow-up actions are recorded in the audit log.
          </li>
        </ul>
      </div>
    </div>
  );
}
