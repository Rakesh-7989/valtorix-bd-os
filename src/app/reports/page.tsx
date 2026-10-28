"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type OverviewMetrics = {
  totalLeads: number;
  qualifiedLeads: number;
  openDeals: number;
  wonDeals: number;
  pipelineValue: number;
  wonValue: number;
  pendingApprovals: number;
  tasksDueToday: number;
};

type PipelineStage = { stage: string; count: number; value?: number };
type ConversionStage = { stage: string; count: number; conversion: number };

async function fetchOverview(): Promise<OverviewMetrics> {
  const res = await fetch("/api/dashboard/overview", {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (res.ok) {
    const data = await res.json();
    return data.metrics;
  }
  return {
    totalLeads: 0,
    qualifiedLeads: 0,
    openDeals: 0,
    wonDeals: 0,
    pipelineValue: 0,
    wonValue: 0,
    pendingApprovals: 0,
    tasksDueToday: 0,
  };
}

async function fetchPipeline(): Promise<{
  leadsByStage: PipelineStage[];
  dealsByStage: PipelineStage[];
}> {
  const res = await fetch("/api/dashboard/pipeline", {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (res.ok) {
    const data = await res.json();
    return {
      leadsByStage: data.leadsByStage || [],
      dealsByStage: data.dealsByStage || [],
    };
  }
  return { leadsByStage: [], dealsByStage: [] };
}

async function fetchConversion(): Promise<ConversionStage[]> {
  const res = await fetch("/api/dashboard/conversion", {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (res.ok) {
    const data = await res.json();
    return data.funnel || [];
  }
  return [];
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}

function formatNumber(val: number): string {
  return new Intl.NumberFormat("en-IN").format(val);
}

export default function ReportsPage() {
  const [overview, setOverview] = useState<OverviewMetrics>({
    totalLeads: 0,
    qualifiedLeads: 0,
    openDeals: 0,
    wonDeals: 0,
    pipelineValue: 0,
    wonValue: 0,
    pendingApprovals: 0,
    tasksDueToday: 0,
  });
  const [pipeline, setPipeline] = useState({
    leadsByStage: [] as PipelineStage[],
    dealsByStage: [] as PipelineStage[],
  });
  const [conversion, setConversion] = useState<ConversionStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [o, p, c] = await Promise.all([
        fetchOverview(),
        fetchPipeline(),
        fetchConversion(),
      ]);
      if (mounted) {
        setOverview(o);
        setPipeline(p);
        setConversion(c);
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center pl-64">
        <div className="text-zinc-500">Loading reports...</div>
      </div>
    );
  }

  const conversionRate =
    overview.totalLeads > 0
      ? Math.round((overview.wonDeals / overview.totalLeads) * 100)
      : 0;
  const qualificationRate =
    overview.totalLeads > 0
      ? Math.round((overview.qualifiedLeads / overview.totalLeads) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Reports</h1>
          <p className="text-zinc-500">
            BD performance metrics and conversion analytics.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="px-4 py-2 text-sm font-medium text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <div className="text-xs font-semibold text-zinc-500 uppercase mb-1">
            Lead Qualification Rate
          </div>
          <div className="text-3xl font-bold text-zinc-900">
            {qualificationRate}%
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            {overview.qualifiedLeads} of {overview.totalLeads} leads qualified
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <div className="text-xs font-semibold text-zinc-500 uppercase mb-1">
            Overall Win Rate
          </div>
          <div className="text-3xl font-bold text-zinc-900">
            {conversionRate}%
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            {overview.wonDeals} of {overview.totalLeads} leads won
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <div className="text-xs font-semibold text-zinc-500 uppercase mb-1">
            Average Deal Value
          </div>
          <div className="text-3xl font-bold text-zinc-900">
            {formatCurrency(
              overview.wonDeals > 0
                ? overview.wonValue / overview.wonDeals
                : 0
            )}
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            {overview.wonDeals} won deals
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-zinc-900 uppercase">
            Conversion Funnel
          </h3>
          <Link
            href="/dashboard"
            className="text-sm text-blue-600 hover:underline"
          >
            Back to Dashboard
          </Link>
        </div>
        <div className="space-y-4">
          {conversion.map((stage) => (
            <div key={stage.stage} className="flex items-center gap-4">
              <div className="w-24 text-sm text-zinc-700">
                {stage.stage}
              </div>
              <div className="flex-1 h-3 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${stage.conversion}%`,
                    backgroundColor:
                      stage.conversion > 50 ? "#3b82f6" : "#f59e0b",
                  }}
                ></div>
              </div>
              <div className="w-20 text-sm text-right font-mono text-zinc-900">
                {stage.count} ({stage.conversion}%)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leads by Stage */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-zinc-900 uppercase mb-4">
          Leads by Stage
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                  Stage
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase text-right">
                  Count
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase text-right">
                  % of Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {pipeline.leadsByStage.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-zinc-400">
                    No data available
                  </td>
                </tr>
              ) : (
                pipeline.leadsByStage.map((s) => {
                  const pct =
                    overview.totalLeads > 0
                      ? Math.round((s.count / overview.totalLeads) * 100)
                      : 0;
                  return (
                    <tr key={s.stage} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3 text-zinc-700">
                        {s.stage}
                      </td>
                      <td className="px-4 py-3 text-zinc-900 font-mono text-right">
                        {s.count}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 text-right">
                        {pct}%
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deals by Stage */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-zinc-900 uppercase mb-4">
          Deals by Stage
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                  Stage
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase text-right">
                  Count
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase text-right">
                  Value
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {pipeline.dealsByStage.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-zinc-400">
                    No data available
                  </td>
                </tr>
              ) : (
                pipeline.dealsByStage.map((s) => (
                  <tr
                    key={s.stage}
                    className="hover:bg-zinc-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-zinc-700">
                      {s.stage}
                    </td>
                    <td className="px-4 py-3 text-zinc-900 font-mono text-right">
                      {s.count}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 text-right">
                      ₹{formatNumber(s.value || 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-zinc-900 uppercase mb-4">
          Key Insights
        </h3>
        <ul className="space-y-3 text-sm text-zinc-700">
          <li className="flex items-start gap-2">
            <span className="text-emerald-500">✓</span>
            {overview.qualifiedLeads > 0
              ? `${qualificationRate}% of leads are qualified and moving through the pipeline.`
              : "No qualified leads yet. Focus on lead qualification."}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">ℹ</span>
            {conversionRate > 0
              ? `Your overall win rate is ${conversionRate}%. ${overview.wonDeals} deals closed worth ₹${formatNumber(overview.wonValue)}.`
              : "No deals won yet. Review your proposal and negotiation process."}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500">⚠</span>
            {overview.pendingApprovals > 0
              ? `${overview.pendingApprovals} approval(s) pending review. Check the Approvals page.`
              : "No pending approvals. All caught up!"}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-rose-500">⚠</span>
            {overview.tasksDueToday > 0
              ? `${overview.tasksDueToday} task(s) due today. Check your task list.`
              : "No tasks due today. Great job staying on track!"}
          </li>
        </ul>
      </div>
    </div>
  );
}
