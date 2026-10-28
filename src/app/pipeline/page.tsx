"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type DealStage = {
  id: string;
  stage: string;
  amount: number;
  currency: string;
  expected_close_at: string | null;
};

const PIPELINE_STAGES = [
  { id: "qualification", label: "Qualification", color: "bg-blue-50" },
  { id: "proposal", label: "Proposal", color: "bg-purple-50" },
  { id: "negotiation", label: "Negotiation", color: "bg-amber-50" },
  { id: "closed_won", label: "Closed Won", color: "bg-emerald-50" },
  { id: "closed_lost", label: "Closed Lost", color: "bg-rose-50" },
];

async function fetchDeals(): Promise<DealStage[]> {
  const res = await fetch("/api/deals?limit=100", {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (res.ok) {
    const data = await res.json();
    return data.data || [];
  }
  return [];
}

export default function PipelinePage() {
  const [deals, setDeals] = useState<DealStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const data = await fetchDeals();
      if (mounted) {
        setDeals(data);
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const stageDeals = PIPELINE_STAGES.map((stage) => ({
    ...stage,
    deals: deals.filter((d) => d.stage === stage.id),
    total: deals
      .filter((d) => d.stage === stage.id)
      .reduce((sum, d) => sum + d.amount, 0),
  }));

  const totalPipeline = deals.reduce((sum, d) => sum + d.amount, 0);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center pl-64">
        <div className="text-zinc-500">Loading pipeline...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Pipeline</h2>
        <p className="text-zinc-500">
          Visual Kanban view of your deals across stages.
        </p>
      </div>

      <div className="text-right mb-4">
        <div className="text-lg font-bold text-zinc-900">
          ₹{totalPipeline.toLocaleString()}
        </div>
        <div className="text-xs text-zinc-500">Total Pipeline Value</div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-4">
        {stageDeals.map((stage) => (
          <div
            key={stage.id}
            className="w-full md:w-64 bg-zinc-100 rounded-xl overflow-hidden flex flex-col"
          >
            <div className={`${stage.color} p-3`}>
              <div className="text-xs font-semibold text-zinc-900 uppercase">
                {stage.label}
              </div>
              <div className="text-xs font-bold text-zinc-700 mt-1">
                {stage.deals.length}
              </div>
              <div className="text-xs text-zinc-600">
                ₹{stage.total.toLocaleString()}
              </div>
            </div>
            <div className="flex-1 p-3 min-h-[400px] overflow-y-auto space-y-3">
              {stage.deals.length === 0 ? (
                <div className="text-xs text-zinc-400 text-center py-4">
                  No deals
                </div>
              ) : (
                stage.deals.map((deal) => (
                  <div
                    key={deal.id}
                    className="bg-white border border-zinc-200 rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="text-xs font-medium text-zinc-900 mb-1">
                      ₹{deal.amount.toLocaleString()}
                    </div>
                    <div className="text-xs text-zinc-500 mb-2">
                      {deal.expected_close_at || "No close date"}
                    </div>
                    <Link
                      href={`/deals/${deal.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View deal →
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/deals/new"
        className="px-4 py-2 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors"
      >
        + Add Deal
      </Link>
    </div>
  );
}
