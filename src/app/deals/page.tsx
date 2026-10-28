"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Deal = {
  id: string;
  stage: string;
  amount: number;
  currency: string;
  owner_id: string;
  lead_id: string;
  company_id: string;
  expected_close_at: string | null;
  lost_reason: string | null;
  created_at: string;
};

const STAGE_COLORS: Record<string, string> = {
  qualification: "bg-blue-50 text-blue-700",
  proposal: "bg-purple-50 text-purple-700",
  negotiation: "bg-amber-50 text-amber-700",
  closed_won: "bg-emerald-100 text-emerald-900",
  closed_lost: "bg-rose-100 text-rose-900",
};

async function fetchDeals(stageFilter: string): Promise<Deal[]> {
  const params = new URLSearchParams();
  if (stageFilter) params.set("stage", stageFilter);
  params.set("limit", "100");

  const res = await fetch(`/api/deals?${params}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (res.ok) {
    const data = await res.json();
    return data.data || [];
  }
  return [];
}

const STAGES = [
  "qualification",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
];

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const data = await fetchDeals(stageFilter);
      if (mounted) {
        setDeals(data);
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [stageFilter]);

  const totalValue = deals.reduce(
    (sum, d) => sum + (d.stage === "closed_won" ? d.amount : 0),
    0
  );

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center pl-64">
        <div className="text-zinc-500">Loading deals...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Deals</h2>
        <p className="text-zinc-500">
          Track your active deals and pipeline value.
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          <div className="bg-zinc-100 rounded-lg p-4">
            <div className="text-xs font-semibold text-zinc-500 uppercase mb-1">
              Closed Won Value
            </div>
            <div className="text-xl font-bold text-zinc-900">
              ₹{totalValue.toLocaleString()}
            </div>
          </div>
        </div>
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
        >
          <option value="">All Stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ")}
            </option>
          ))}
        </select>
        <Link
          href="/deals/new"
          className="px-4 py-2 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors"
        >
          + Add Deal
        </Link>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Stage
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Amount
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Expected Close
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {deals.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-400">
                  No deals found. Convert a qualified lead to create your first deal.
                </td>
              </tr>
            ) : (
              deals.map((deal) => (
                <tr key={deal.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                        STAGE_COLORS[deal.stage] || "bg-zinc-50 text-zinc-700"
                      }`}
                    >
                      {deal.stage.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    ₹{deal.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {deal.expected_close_at || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/deals/${deal.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
