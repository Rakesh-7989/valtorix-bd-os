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
  items: Array<{
    id: string;
    description: string;
    quantity: string;
    unit_price: string;
    line_total: string;
  }>;
  created_at: string;
  approved_by: string | null;
  approved_at: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-50 text-zinc-700",
  sent: "bg-blue-50 text-blue-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-700",
  expired: "bg-amber-50 text-amber-700",
};

async function fetchProposal(id: string): Promise<Proposal | null> {
  const res = await fetch(`/api/proposals/${id}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (res.ok) {
    return (await res.json()) as Proposal;
  }
  return null;
}

export default function ProposalDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const p = await fetchProposal(params.id);
      if (mounted) {
        setProposal(p);
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center pl-64">
        <div className="text-zinc-500">Loading proposal...</div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center pl-64">
        <div className="text-zinc-500">Proposal not found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Proposal v{proposal.version}
          </h1>
          <p className="text-zinc-500">
            Deal ID: {proposal.deal_id.slice(0, 8)}...
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/proposals"
            className="px-4 py-2 text-sm font-medium text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
          >
            Back to Proposals
          </Link>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-zinc-500 uppercase mb-4">
          Proposal Details
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-zinc-500">Status</span>
            <span
              className={`text-zinc-900 font-medium ${STATUS_COLORS[proposal.status] || "bg-zinc-50 text-zinc-700"}`}
            >
              {proposal.status}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Version</span>
            <span className="text-zinc-900 font-medium">v{proposal.version}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Currency</span>
            <span className="text-zinc-900 font-medium">{proposal.currency}</span>
          </div>
          {proposal.approved_by && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Approved By</span>
              <span className="text-zinc-900 font-medium">
                {proposal.approved_by.slice(0, 8)}...
              </span>
            </div>
          )}
          {proposal.approved_at && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Approved At</span>
              <span className="text-zinc-900 font-medium">
                {new Date(proposal.approved_at).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-zinc-500 uppercase mb-4">
          Line Items
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                  Description
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase text-right">
                  Quantity
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase text-right">
                  Unit Price
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase text-right">
                  Line Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {proposal.items.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3 text-zinc-700">
                    {item.description}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 text-right">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 text-right">
                    ₹{parseFloat(item.unit_price).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 text-right">
                    ₹{parseFloat(item.line_total).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-zinc-500 uppercase mb-4">
          Totals
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-zinc-500">Subtotal</span>
            <span className="text-zinc-900 font-medium">
              ₹{parseFloat(proposal.subtotal).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Tax ({proposal.currency})</span>
            <span className="text-zinc-900 font-medium">
              ₹{parseFloat(proposal.tax_amount).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between border-t border-zinc-200 pt-2">
            <span className="text-lg font-bold text-zinc-900">Total</span>
            <span className="text-lg font-bold text-zinc-900">
              ₹{parseFloat(proposal.total).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
