"use client";

import { useState } from "react";

type DraftResult = {
  subject: string;
  body: string;
  service_recommended: string;
  personalization_points: string[];
  source_context: string;
};

export default function AIOutreachPage() {
  const [leadId, setLeadId] = useState("");
  const [contactId, setContactId] = useState("");
  const [draft, setDraft] = useState<DraftResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [provider, setProvider] = useState("");
  const [status, setStatus] = useState<"idle" | "drafted" | "approved" | "rejected">("idle");

  const handleDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setDraft(null);
    setStatus("idle");

    try {
      const res = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, contactId: contactId || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Draft generation failed");
        return;
      }

      const data = await res.json();
      setDraft(data.draft);
      setProvider(data.provider || "unknown");
      setStatus("drafted");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    setStatus("approved");
  };

  const handleReject = () => {
    setStatus("rejected");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">AI Outreach Drafts</h2>
        <p className="text-zinc-500">
          Generate personalized outreach emails using AI. All drafts require
          human approval before sending — AI never sends automatically.
        </p>
      </div>

      <form onSubmit={handleDraft} className="bg-white border border-zinc-200 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Lead ID
            </label>
            <input
              type="text"
              required
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g. 550e8400-e29b-41d4..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Contact ID (optional)
            </label>
            <input
              type="text"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Contact UUID"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors"
        >
          {loading ? "Generating..." : "Generate Draft"}
        </button>
      </form>

      {error && (
        <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {draft && status === "drafted" && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">✉️</span>
              <h3 className="text-lg font-bold text-zinc-900">Outreach Draft</h3>
            </div>
            <span className="text-xs text-zinc-500">Provider: {provider}</span>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-zinc-700 mb-1">
              Subject
            </label>
            <div className="p-3 bg-zinc-50 rounded border border-zinc-200 text-zinc-900 font-medium">
              {draft.subject}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-zinc-700 mb-1">
              Message
            </label>
            <div className="p-3 bg-zinc-50 rounded border border-zinc-200 text-zinc-800 whitespace-pre-wrap font-mono text-sm">
              {draft.body}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">
                Recommended Service
              </h4>
              <p className="text-sm text-zinc-700">{draft.service_recommended}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">
                Source Context
              </h4>
              <p className="text-sm text-zinc-700 truncate">
                {draft.source_context || "No sources"}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">
              Personalization Points
            </h4>
            <ul className="space-y-1 text-sm text-zinc-700">
              {draft.personalization_points.map((p, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-blue-500">•</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleApprove}
              className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              ✅ Approve Draft
            </button>
            <button
              onClick={handleReject}
              className="px-4 py-2 bg-rose-600 text-white font-medium rounded-lg hover:bg-rose-700 transition-colors"
            >
              ❌ Reject Draft
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-100">
            <p className="text-xs text-zinc-500">
              ⚠️ Approving this draft saves it for review. It will NOT be sent
              automatically. Sending requires separate approval in the Approvals module.
            </p>
          </div>
        </div>
      )}

      {status === "approved" && (
        <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          ✅ Draft approved. Saved to approval queue for review.
        </div>
      )}

      {status === "rejected" && (
        <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          ❌ Draft rejected. Generate a new draft or edit manually.
        </div>
      )}
    </div>
  );
}
