"use client";

import { useState } from "react";

type ResearchResult = {
  company_name: string;
  website: string | null;
  industry: string | null;
  description: string | null;
  size_band: string | null;
  recent_news: string[];
  service_fit_evidence: string[];
  missing_information: string[];
  source_urls: string[];
  verified: boolean;
};

export default function AIResearchPage() {
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [research, setResearch] = useState<ResearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [provider, setProvider] = useState("");

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setResearch(null);

    try {
      const res = await fetch("/api/ai/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: "temp-" + Date.now() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Research failed");
        return;
      }

      const data = await res.json();
      setResearch(data.research);
      setProvider(data.provider || "unknown");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">AI Company Research</h2>
        <p className="text-zinc-500">
          Research companies using AI to understand their needs and service fit.
          All results are clearly labelled as AI-generated and require human verification.
        </p>
      </div>

      <form onSubmit={handleResearch} className="bg-white border border-zinc-200 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Company Name
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g. Acme Architects"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Website (optional)
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="https://example.com"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors"
        >
          {loading ? "Researching..." : "Research Company"}
        </button>
      </form>

      {error && (
        <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {research && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <h3 className="text-lg font-bold text-zinc-900">
                Research: {research.company_name}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium px-2 py-1 rounded ${
                  research.verified
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-zinc-100 text-zinc-700"
                }`}
              >
                {research.verified ? "Verified" : "Unverified — AI Generated"}
              </span>
              <span className="text-xs text-zinc-500">Provider: {provider}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="text-sm font-semibold text-zinc-500 uppercase mb-2">
                Description
              </h4>
              <p className="text-zinc-700">
                {research.description || "No description available"}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <div>
                <span className="text-xs font-semibold text-zinc-500">Industry</span>
                <span className="text-zinc-700">
                  {research.industry || "—"}
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold text-zinc-500">Size Band</span>
                <span className="text-zinc-700">
                  {research.size_band || "—"}
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold text-zinc-500">Website</span>
                <span className="text-zinc-700">
                  {research.website || "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section>
              <h4 className="text-sm font-semibold text-zinc-500 uppercase mb-3">
                Service Fit Evidence
              </h4>
              <ul className="space-y-2">
                {research.service_fit_evidence.length === 0 ? (
                  <li className="text-sm text-zinc-500">No evidence found</li>
                ) : (
                  research.service_fit_evidence.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                      <span className="text-emerald-500">✓</span>
                      {item}
                    </li>
                  ))
                )}
              </ul>
            </section>

            <section>
              <h4 className="text-sm font-semibold text-zinc-500 uppercase mb-3">
                Recent News
              </h4>
              <ul className="space-y-2">
                {research.recent_news.length === 0 ? (
                  <li className="text-sm text-zinc-500">No news found</li>
                ) : (
                  research.recent_news.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                      <span className="text-blue-500">•</span>
                      {item}
                    </li>
                  ))
                )}
              </ul>
            </section>

            <section>
              <h4 className="text-sm font-semibold text-zinc-500 uppercase mb-3">
                Missing Information
              </h4>
              <ul className="space-y-2">
                {research.missing_information.length === 0 ? (
                  <li className="text-sm text-zinc-500">None identified</li>
                ) : (
                  research.missing_information.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                      <span className="text-rose-500">⚠</span>
                      {item}
                    </li>
                  ))
                )}
              </ul>
            </section>

            <section>
              <h4 className="text-sm font-semibold text-zinc-500 uppercase mb-3">
                Sources
              </h4>
              <ul className="space-y-2">
                {research.source_urls.length === 0 ? (
                  <li className="text-sm text-zinc-500">No sources</li>
                ) : (
                  research.source_urls.map((url, i) => (
                    <li key={i} className="text-sm text-zinc-700">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {url}
                      </a>
                    </li>
                  ))
                )}
              </ul>
            </section>
          </div>

          <div className="mt-6 pt-6 border-t border-zinc-100">
            <p className="text-xs text-zinc-500">
              ⚠️ AI-generated content requires human verification before use.
              Do not treat AI research as verified fact.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
