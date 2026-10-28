"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Task = {
  id: string;
  title: string;
  description: string | null;
  due_at: string;
  status: string;
  owner_id: string;
  lead_id: string | null;
  deal_id: string | null;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-zinc-100 text-zinc-500",
};

async function fetchTasks(statusFilter: string): Promise<Task[]> {
  const params = new URLSearchParams();
  if (statusFilter) params.set("status", statusFilter);
  params.set("limit", "100");

  const res = await fetch(`/api/tasks?${params}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (res.ok) {
    const data = await res.json();
    return data.data || [];
  }
  return [];
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const data = await fetchTasks(statusFilter);
      if (mounted) {
        setTasks(data);
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [statusFilter]);

  const overdueCount = tasks.filter(
    (t) => t.status === "pending" && new Date(t.due_at) < new Date()
  ).length;

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center pl-64">
        <div className="text-zinc-500">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Tasks</h2>
        <p className="text-zinc-500">
          Manage your follow-ups and next actions.
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          {overdueCount > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-4">
              <div className="text-xs font-semibold text-rose-700 uppercase mb-1">
                {overdueCount} Overdue Task{overdueCount > 1 ? "s" : ""}
              </div>
            </div>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <Link
          href="/tasks/new"
          className="px-4 py-2 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors"
        >
          + Add Task
        </Link>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Title
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Due Date
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-400">
                  No tasks found. Add your first task to get started.
                </td>
              </tr>
            ) : (
              tasks.map((task) => {
                const isOverdue =
                  task.status === "pending" &&
                  new Date(task.due_at) < new Date();
                return (
                  <tr
                    key={task.id}
                    className={`hover:bg-zinc-50 transition-colors ${
                      isOverdue ? "bg-rose-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900">
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-xs text-zinc-500 mt-1">
                          {task.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {new Date(task.due_at).toLocaleDateString()}
                      {isOverdue && (
                        <span className="text-xs text-rose-600 font-medium ml-2">
                          ⚠ Overdue
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                          STATUS_COLORS[task.status] || "bg-zinc-50 text-zinc-700"
                        }`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/tasks/${task.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
