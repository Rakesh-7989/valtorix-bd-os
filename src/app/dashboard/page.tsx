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
type TimeSeries = { date: string; count: number };

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

async function fetchMetrics(period: string): Promise<{
  leadsPerDay: TimeSeries[];
  dealsPerDay: TimeSeries[];
  activitiesPerDay: TimeSeries[];
}> {
  const res = await fetch(`/api/dashboard/metrics?period=${period}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (res.ok) {
    const data = await res.json();
    return {
      leadsPerDay: data.leadsPerDay || [],
      dealsPerDay: data.dealsPerDay || [],
      activitiesPerDay: data.activitiesPerDay || [],
    };
  }
  return { leadsPerDay: [], dealsPerDay: [], activitiesPerDay: [] };
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

export default function DashboardPage() {
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
  const [timeSeries, setTimeSeries] = useState({
    leadsPerDay: [] as TimeSeries[],
    dealsPerDay: [] as TimeSeries[],
    activitiesPerDay: [] as TimeSeries[],
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [o, p, c, m] = await Promise.all([
        fetchOverview(),
        fetchPipeline(),
        fetchConversion(),
        fetchMetrics(period),
      ]);
      if (mounted) {
        setOverview(o);
        setPipeline(p);
        setConversion(c);
        setTimeSeries(m);
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [period]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
          <p className="text-zinc-500">
            Real-time view of your BD pipeline and performance.
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm"
          >
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
            <option value="90d">90 Days</option>
          </select>
          <Link
            href="/reports"
            className="px-4 py-2 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors"
          >
            View All Reports
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center pl-64">
          <div className="text-zinc-500">Loading dashboard...</div>
        </div>
      ) : (
        <>
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-zinc-200 rounded-xl p-6">
              <div className="flex items-between justify-between mb-2">
                <div>
                  <div className="text-xs font-semibold text-zinc-500 uppercase">
                    Total Leads
                  </div>
                  <div className="text-2xl font-bold text-zinc-900">
                    {formatNumber(overview.totalLeads)}
                  </div>
                </div>
                <div className="text-zinc-400 text-xs">👥</div>
              </div>
              <div className="mt-2 text-xs text-zinc-500">
                {formatNumber(overview.qualifiedLeads)} qualified
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-6">
              <div className="flex items-between justify-between mb-2">
                <div>
                  <div className="text-xs font-semibold text-zinc-500 uppercase">
                    Open Deals
                  </div>
                  <div className="text-2xl font-bold text-zinc-900">
                    {formatNumber(overview.openDeals)}
                  </div>
                </div>
                <div className="text-zinc-400 text-xs">🔄</div>
              </div>
              <div className="mt-2 text-xs text-zinc-500">
                ₹{formatNumber(overview.pipelineValue)} pipeline
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-6">
              <div className="flex items-between justify-between mb-2">
                <div>
                  <div className="text-xs font-semibold text-zinc-500 uppercase">
                    Won Deals
                  </div>
                  <div className="text-2xl font-bold text-zinc-900">
                    {formatNumber(overview.wonDeals)}
                  </div>
                </div>
                <div className="text-zinc-400 text-xs">✅</div>
              </div>
              <div className="mt-2 text-xs text-zinc-500">
                ₹{formatNumber(overview.wonValue)} won value
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl p-6">
              <div className="flex items-between justify-between mb-2">
                <div>
                  <div className="text-xs font-semibold text-zinc-500 uppercase">
                    Pending Approvals
                  </div>
                  <div className="text-2xl font-bold text-zinc-900">
                    {formatNumber(overview.pendingApprovals)}
                  </div>
                </div>
                <div className="text-zinc-400 text-xs">⏳</div>
              </div>
              <div className="mt-2 text-xs text-zinc-500">
                {formatNumber(overview.tasksDueToday)} tasks due today
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversion Funnel */}
            <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-zinc-900 uppercase mb-4">
                Conversion Funnel
              </h3>
              <div className="space-y-4">
                {conversion.map((stage, idx) => {
                  const width = stage.conversion;
                  return (
                    <div key={stage.stage} className="flex items-center gap-4">
                      <div className="w-20 text-sm text-zinc-700">
                        {stage.stage}
                      </div>
                      <div className="flex-1 h-3 bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${width}%` }}
                        ></div>
                      </div>
                      <div className="w-16 text-sm text-right font-mono text-zinc-900">
                        {stage.count} ({stage.conversion}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Leads by Stage */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-zinc-900 uppercase mb-4">
                Leads by Stage
              </h3>
              <div className="space-y-3">
                {pipeline.leadsByStage.map((s) => (
                  <div key={s.stage} className="flex justify-between items-center">
                    <span className="text-sm text-zinc-700">{s.stage}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-zinc-900">
                        {s.count}
                      </span>
                    </div>
                  </div>
                ))}
                {pipeline.leadsByStage.length === 0 && (
                  <div className="text-center text-zinc-400 text-sm py-4">
                    No data
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Deals by Stage with Value */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-zinc-900 uppercase mb-4">
                Deals by Stage
              </h3>
              <div className="space-y-3">
                {pipeline.dealsByStage.map((s) => (
                  <div key={s.stage} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-700">{s.stage}</span>
                      <span className="text-xs text-zinc-500">
                        ₹{formatNumber(s.value || 0)}
                      </span>
                    </div>
                    <span className="text-sm font-mono text-zinc-900">
                      {s.count}
                    </span>
                  </div>
                ))}
                {pipeline.dealsByStage.length === 0 && (
                  <div className="text-center text-zinc-400 text-sm py-4">
                    No data
                  </div>
                )}
              </div>
            </div>

            {/* Time Series Chart (simple bar chart using CSS) */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-zinc-900 uppercase mb-4">
                Activity Over Time ({period === "7d" ? "7 Days" : period === "30d" ? "30 Days" : "90 Days"})
              </h3>
              <div className="h-48 flex items-end gap-1 max-w-full">
                {timeSeries.leadsPerDay.map((point, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center gap-1"
                    style={{
                      height: `${Math.max(10, (point.count / 10) * 100)}%`,
                    }}
                  >
                    <div className="w-4 bg-blue-600 rounded-t" title={`${point.date}: ${point.count} leads`}></div>
                    <span className="text-[10px] text-zinc-500">
                      {point.date.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
