"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Lead = {
  id: string;
  source: string;
  status: string;
  score: number;
  owner_id: string;
  company_id: string;
  primary_contact_id: string | null;
  next_action_at: string | null;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-zinc-50 text-zinc-700",
  contacted: "bg-blue-50 text-blue-700",
  qualified: "bg-emerald-50 text-emerald-700",
  proposal: "bg-purple-50 text-purple-700",
  negotiation: "bg-amber-50 text-amber-700",
  won: "bg-emerald-100 text-emerald-900",
  lost: "bg-rose-100 text-rose-900",
  nurture: "bg-indigo-50 text-indigo-700",
};

async function fetchLeads(
  search: string,
  statusFilter: string
): Promise<Lead[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (statusFilter) params.set("status", statusFilter);
  params.set("limit", "100");

  const res = await fetch(`/api/leads?${params}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (res.ok) {
    const data = await res.json();
    return data.data || [];
  }
  return [];
}

const STATUSES = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
  "nurture",
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const data = await fetchLeads(search, statusFilter);
      if (mounted) {
        setLeads(data);
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [search, statusFilter]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center pl-64">
        <div className="text-zinc-500">Loading leads...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Leads</h2>
        <p className="text-zinc-500">
          Track and qualify your BD leads.
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <Link
          href="/leads/new"
          className="px-4 py-2 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors"
        >
          + Add Lead
        </Link>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Source
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Score
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Next Action
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                  No leads found. Import or add your first lead to get started.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3 text-zinc-600">
                    {lead.source}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                        STATUS_COLORS[lead.status] || "bg-zinc-50 text-zinc-700"
                      }`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {lead.score}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {lead.next_action_at || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/leads/${lead.id}`}
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
