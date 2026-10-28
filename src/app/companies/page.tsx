"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Company = {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  location: string | null;
  size_band: string | null;
  created_at: string;
};

async function fetchCompanies(
  search: string,
  industryFilter: string
): Promise<Company[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (industryFilter) params.set("industry", industryFilter);
  params.set("limit", "100");

  const res = await fetch(`/api/companies?${params}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (res.ok) {
    const data = await res.json();
    return data.data || [];
  }
  return [];
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const data = await fetchCompanies(search, industryFilter);
      if (mounted) {
        setCompanies(data);
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [search, industryFilter]);

  const industries = Array.from(
    new Set(
      companies
        .map((c) => c.industry)
        .filter((i): i is string => i !== null && i !== "")
    )
  );

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center pl-64">
        <div className="text-zinc-500">Loading companies...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Companies</h2>
        <p className="text-zinc-500">
          Manage your company records and track BD opportunities.
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <select
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
          className="px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
        >
          <option value="">All Industries</option>
          {industries.map((ind) => (
            <option key={ind} value={ind}>
              {ind}
            </option>
          ))}
        </select>
        <Link
          href="/companies/new"
          className="px-4 py-2 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors"
        >
          + Add Company
        </Link>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Company
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Industry
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Location
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Size
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {companies.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                  No companies found. Add your first company to get started.
                </td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr key={company.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/companies/${company.id}`}
                      className="font-medium text-zinc-900 hover:underline"
                    >
                      {company.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {company.industry || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {company.location || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {company.size_band || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/companies/${company.id}`}
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
