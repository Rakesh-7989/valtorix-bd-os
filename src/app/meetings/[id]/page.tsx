"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Meeting = {
  id: string;
  deal_id: string;
  title: string;
  agenda: string | null;
  notes: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  created_at: string;
};

type MeetingAction = {
  id: string;
  meeting_id: string;
  description: string;
  owner_id: string;
  due_at: string | null;
  status: string;
  created_at: string;
};

async function fetchMeeting(id: string): Promise<Meeting | null> {
  const res = await fetch(`/api/meetings/${id}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (res.ok) {
    return (await res.json()) as Meeting;
  }
  return null;
}

async function fetchMeetingActions(meetingId: string): Promise<MeetingAction[]> {
  const res = await fetch(`/api/meeting-actions?meeting_id=${meetingId}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (res.ok) {
    const data = await res.json();
    return data.data || [];
  }
  return [];
}

export default function MeetingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [actions, setActions] = useState<MeetingAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [m, a] = await Promise.all([
        fetchMeeting(params.id),
        fetchMeetingActions(params.id),
      ]);
      if (mounted) {
        setMeeting(m);
        setActions(a);
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
        <div className="text-zinc-500">Loading meeting...</div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center pl-64">
        <div className="text-zinc-500">Meeting not found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{meeting.title}</h1>
          <p className="text-zinc-500">
            Deal ID: {meeting.deal_id.slice(0, 8)}...
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/meetings"
            className="px-4 py-2 text-sm font-medium text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
          >
            Back to Meetings
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-zinc-500 uppercase mb-4">
            Meeting Details
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-zinc-500">Status</span>
              <span className="text-zinc-900 font-medium">{meeting.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Scheduled</span>
              <span className="text-zinc-900 font-medium">
                {new Date(meeting.scheduled_at).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Duration</span>
              <span className="text-zinc-900 font-medium">
                {meeting.duration_minutes} minutes
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-zinc-500 uppercase mb-4">
            Agenda
          </h3>
          <div className="text-zinc-700 whitespace-pre-wrap">
            {meeting.agenda || "No agenda set."}
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-zinc-500 uppercase mb-4">
            Notes
          </h3>
          <div className="text-zinc-700 whitespace-pre-wrap">
            {meeting.notes || "No notes added."}
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-zinc-500 uppercase mb-4">
          Action Items ({actions.length})
        </h3>
        {actions.length === 0 ? (
          <div className="text-center text-zinc-400 text-sm py-8">
            No action items for this meeting.
          </div>
        ) : (
          <div className="space-y-3">
            {actions.map((a) => (
              <div
                key={a.id}
                className="p-3 border border-zinc-200 rounded-lg"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-medium text-zinc-900">
                    {a.description}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                      a.status === "completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {a.status}
                  </span>
                </div>
                <div className="text-xs text-zinc-500 mb-2">
                  {a.due_at
                    ? `Due: ${new Date(a.due_at).toLocaleDateString()}`
                    : "No due date"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
