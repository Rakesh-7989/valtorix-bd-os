"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type WorkflowRun = {
  id: string;
  workflow_id: string;
  status: string;
  trigger_payload_json: Record<string, unknown>;
  current_state_json: Record<string, unknown>;
  error_summary: string | null;
  started_at: string;
  finished_at: string | null;
};

async function fetchWorkflowRuns(): Promise<WorkflowRun[]> {
  const res = await fetch("/api/workflows", {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (res.ok) {
    const data = await res.json();
    return data.runs || [];
  }
  return [];
}

const STATUS_COLORS: Record<string, string> = {
  running: "bg-blue-50 text-blue-700",
  completed: "bg-emerald-50 text-emerald-700",
  failed: "bg-rose-50 text-rose-700",
  cancelled: "bg-zinc-100 text-zinc-500",
  waiting_for_approval: "bg-amber-50 text-amber-700",
};

export default function WorkflowsPage() {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const data = await fetchWorkflowRuns();
      if (mounted) {
        setRuns(data);
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [refresh]);

  const reload = () => setRefresh((r) => r + 1);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center pl-64">
        <div className="text-zinc-500">Loading workflows...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Workflow Runs</h2>
          <p className="text-zinc-500">
            Persistent workflow execution with retry, recovery, and audit trail.
          </p>
        </div>
        <button
          onClick={reload}
          className="px-4 py-2 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                ID
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Workflow
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Started
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {runs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                  No workflow runs yet.
                </td>
              </tr>
            ) : (
              runs.map((run) => (
                <tr key={run.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3 text-zinc-600 text-xs font-mono">
                    {run.id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {run.workflow_id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                        STATUS_COLORS[run.status] || "bg-zinc-50 text-zinc-700"
                      }`}
                    >
                      {run.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {new Date(run.started_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/approvals`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View Approvals
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-zinc-900 uppercase mb-4">
          Workflow Engine Capabilities
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-zinc-200 rounded-lg">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">
              Persistent Jobs
            </h4>
            <p className="text-xs text-zinc-600">
              Jobs stored in database — survive server restarts.
            </p>
          </div>
          <div className="p-4 border border-zinc-200 rounded-lg">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">
              Bounded Retries
            </h4>
            <p className="text-xs text-zinc-600">
              Failed jobs retry with exponential backoff, then dead-letter.
            </p>
          </div>
          <div className="p-4 border border-zinc-200 rounded-lg">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">
              Idempotency
            </h4>
            <p className="text-xs text-zinc-600">
              Idempotency keys prevent duplicate actions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
