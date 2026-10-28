"use client";

import { useState, useEffect } from "react";

type Approval = {
  id: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  payload_json: Record<string, unknown>;
  payload_hash: string;
  status: string;
  requested_by: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  expires_at: string;
  created_at: string;
};

async function fetchApprovals(): Promise<Approval[]> {
  const res = await fetch("/api/approvals", {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (res.ok) {
    const data = await res.json();
    return data.approvals || [];
  }
  return [];
}

async function decideApproval(
  id: string,
  decision: "approve" | "reject"
): Promise<boolean> {
  const res = await fetch(`/api/approvals/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision }),
  });
  return res.ok;
}

async function cancelApproval(id: string): Promise<boolean> {
  const res = await fetch(`/api/approvals/${id}`, {
    method: "DELETE",
  });
  return res.ok;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const data = await fetchApprovals();
      if (mounted) {
        setApprovals(data);
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [refresh]);

  const reload = () => setRefresh((r) => r + 1);

  const handleApprove = async (id: string) => {
    const ok = await decideApproval(id, "approve");
    if (ok) reload();
  };

  const handleReject = async (id: string) => {
    const ok = await decideApproval(id, "reject");
    if (ok) reload();
  };

  const handleCancel = async (id: string) => {
    const ok = await cancelApproval(id);
    if (ok) reload();
  };

  const pending = approvals.filter((a) => a.status === "pending");
  const expired = approvals.filter((a) => a.status === "expired");

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center pl-64">
        <div className="text-zinc-500">Loading approvals...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Approvals</h2>
          <p className="text-zinc-500">
            Review and approve external actions before they are executed.
            No action is sent without valid human approval.
          </p>
        </div>
        <button
          onClick={reload}
          className="px-4 py-2 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-zinc-900 uppercase mb-4">
            Pending Approvals ({pending.length})
          </h3>
          {pending.length === 0 ? (
            <div className="text-center text-zinc-400 text-sm py-8">
              No pending approvals.
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((approval) => (
                <div
                  key={approval.id}
                  className="p-4 border border-zinc-200 rounded-lg bg-zinc-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        approval.action_type === "send_email"
                          ? "bg-blue-100 text-blue-700"
                          : approval.action_type === "approve_pricing"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      {approval.action_type}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {new Date(approval.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-zinc-700 mb-3">
                    Entity: {approval.entity_type} ({approval.entity_id})
                  </div>
                  <details className="text-xs text-zinc-500 mb-3">
                    <summary className="cursor-pointer">Payload</summary>
                    <pre className="mt-1 p-2 bg-zinc-100 rounded overflow-x-auto">
                      {JSON.stringify(approval.payload_json, null, 2)}
                    </pre>
                  </details>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(approval.id)}
                      className="flex-1 px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => handleReject(approval.id)}
                      className="flex-1 px-3 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors"
                    >
                      ❌ Reject
                    </button>
                    <button
                      onClick={() => handleCancel(approval.id)}
                      className="px-3 py-2 bg-zinc-300 text-zinc-700 text-sm font-medium rounded-lg hover:bg-zinc-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-zinc-900 uppercase mb-4">
            Expired / Decided ({expired.length})
          </h3>
          {expired.length === 0 ? (
            <div className="text-center text-zinc-400 text-sm py-8">
              No expired approvals.
            </div>
          ) : (
            <div className="space-y-3">
              {expired.map((approval) => (
                <div key={approval.id} className="p-3 border border-zinc-200 rounded-lg text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-zinc-900">
                      {approval.action_type}
                    </span>
                    <span className="text-zinc-500">{approval.status}</span>
                  </div>
                  <div className="text-zinc-600">
                    {approval.entity_type}: {approval.entity_id}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <h4 className="text-sm font-semibold text-amber-900 mb-2">
          How Approvals Work
        </h4>
        <ul className="text-sm text-amber-800 space-y-2 list-disc list-inside">
          <li>
            Every external action (email, deal creation, pricing change)
            requires a valid approval.
          </li>
          <li>
            Approvals are bound to the exact payload — if content changes,
            re-approval is required.
          </li>
          <li>
            Approvals expire after a configured period.
          </li>
          <li>
            All approval decisions are recorded in the audit log.
          </li>
        </ul>
      </div>
    </div>
  );
}
