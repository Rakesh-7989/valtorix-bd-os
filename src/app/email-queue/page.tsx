"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Delivery = {
  id: string;
  recipient: string;
  subject: string;
  status: string;
  provider: string;
  sent_at: string | null;
  delivered_at: string | null;
  error_message: string | null;
  retry_count: number;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-zinc-50 text-zinc-700",
  sent: "bg-blue-50 text-blue-700",
  delivered: "bg-emerald-50 text-emerald-700",
  failed: "bg-rose-50 text-rose-700",
  bounced: "bg-rose-100 text-rose-900",
  suppressed: "bg-amber-50 text-amber-700",
};

async function fetchDeliveries(leadId?: string): Promise<Delivery[]> {
  const params = new URLSearchParams();
  if (leadId) params.set("leadId", leadId);

  const res = await fetch(`/api/email/deliveries?${params}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (res.ok) {
    const data = await res.json();
    return data.deliveries || [];
  }
  return [];
}

export default function EmailQueuePage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [leadFilter, setLeadFilter] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const data = await fetchDeliveries(leadFilter || undefined);
      if (mounted) {
        setDeliveries(data);
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [leadFilter, refresh]);

  const reload = () => setRefresh((r) => r + 1);

  const statusCounts = {
    pending: deliveries.filter((d) => d.status === "pending").length,
    sent: deliveries.filter((d) => d.status === "sent").length,
    failed: deliveries.filter((d) => d.status === "failed").length,
    suppressed: deliveries.filter((d) => d.status === "suppressed").length,
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center pl-64">
        <div className="text-zinc-500">Loading email queue...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Email Queue</h2>
        <p className="text-zinc-500">
          Track email delivery status and manage failed sends.
        </p>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="text-xs font-semibold text-zinc-500 uppercase">Pending</div>
          <div className="text-2xl font-bold text-zinc-900">{statusCounts.pending}</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="text-xs font-semibold text-zinc-500 uppercase">Sent</div>
          <div className="text-2xl font-bold text-zinc-900">{statusCounts.sent}</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="text-xs font-semibold text-zinc-500 uppercase">Failed</div>
          <div className="text-2xl font-bold text-zinc-900">{statusCounts.failed}</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="text-xs font-semibold text-zinc-500 uppercase">Suppressed</div>
          <div className="text-2xl font-bold text-zinc-900">{statusCounts.suppressed}</div>
        </div>
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
                Recipient
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Subject
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Provider
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Sent At
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {deliveries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                  No email deliveries found.
                </td>
              </tr>
            ) : (
              deliveries.map((d) => (
                <tr key={d.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3 text-zinc-900 font-medium">
                    {d.recipient}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 truncate max-w-xs">
                    {d.subject}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                        STATUS_COLORS[d.status] || "bg-zinc-50 text-zinc-700"
                      }`}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {d.provider}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {d.sent_at ? new Date(d.sent_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {d.status === "failed" && (
                      <Link
                        href="#"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Retry
                      </Link>
                    )}
                    {d.error_message && (
                      <span className="text-xs text-rose-600 ml-2" title={d.error_message}>
                        ⚠
                      </span>
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
          Delivery Safety Rules
        </h4>
        <ul className="text-sm text-amber-800 space-y-2 list-disc list-inside">
          <li>
            Every email requires a valid, unexpired approval before sending.
          </li>
          <li>
            Suppressed recipients (unsubscribed, bounced, opt-out) are skipped
            automatically.
          </li>
          <li>
            Failed deliveries can be retried with a new approval.
          </li>
          <li>
            All delivery attempts are recorded in the audit log.
          </li>
        </ul>
      </div>
    </div>
  );
}
