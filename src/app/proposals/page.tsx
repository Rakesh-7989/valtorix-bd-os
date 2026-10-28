"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Proposal = {
  id: string;
  deal_id: string;
  version: number;
  status: string;
  subtotal: string;
  tax_amount: string;
  total: string;
  currency: string;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-50 text-zinc-700",
  sent: "bg-blue-50 text-blue-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-700",
  expired: "bg-amber-50 text-amber-700",
};

async function fetchProposals(dealId?: string): Promise<Proposal[]> {
  const params = new URLSearchParams();
  if (dealId) params.set("deal_id", dealId);
  params.set("limit", "100");

  const res = await fetch(`/api/proposals?${params}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (res.ok) {
    const data = await res.json();
    return data.data || [];
  }
  return [];
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dealFilter, setDealFilter] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const data = await fetchProposals(dealFilter || undefined);
      if (mounted) {
        setProposals(data);
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [dealFilter, refresh]);

  const reload = () => setRefresh((r) => r + 1);

  const totalValue = proposals.reduce(
    (sum, p) => sum + (p.status === "approved" ? parseFloat(p.total) : 0),
    0
  );

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center pl-64">
        <div className="text-zinc-500">Loading proposals...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Proposals</h2>
          <p className="text-zinc-500">
            Create, version, and track client proposals.
          </p>
        </div>
        <Link
          href="/proposals/new"
          className="px-4 py-2 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors"
        >
          + Create Proposal
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="text-xs font-semibold text-zinc-500 uppercase">
            Total Proposals
          </div>
          <div className="text-2xl font-bold text-zinc-900">
            {proposals.length}
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="text-xs font-semibold text-zinc-500 uppercase">
            Approved Value
          </div>
          <div className="text-2xl font-bold text-zinc-900">
            ₹{totalValue.toLocaleString()}
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="text-xs font-semibold text-zinc-500 uppercase">
            Draft
          </div>
          <div className="text-2xl font-bold text-zinc-900">
            {proposals.filter((p) => p.status === "draft").length}
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <div className="text-xs font-semibold text-zinc-500 uppercase">
            Sent
          </div>
          <div className="text-2xl font-bold text-zinc-900">
            {proposals.filter((p) => p.status === "sent").length}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Filter by deal ID..."
            value={dealFilter}
            onChange={(e) => setDealFilter(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <button
          onClick={() => setRefresh((r) => r + 1)}
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
                Deal ID
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Version
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Total
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
            {proposals.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                  No proposals found.
                </td>
              </tr>
            ) : (
              proposals.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3 text-zinc-600 text-xs font-mono">
                    {p.deal_id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3 text-zinc-600">v{p.version}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                        STATUS_COLORS[p.status] || "bg-zinc-50 text-zinc-700"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    ₹{parseFloat(p.total).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/proposals/${p.id}`}
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
