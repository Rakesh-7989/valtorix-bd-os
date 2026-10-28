"use client";

import { NavItem } from "./nav-item";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/leads", label: "Leads", icon: "👥" },
  { href: "/companies", label: "Companies", icon: "🏢" },
  { href: "/pipeline", label: "Pipeline", icon: "🔄" },
  { href: "/outreach", label: "Outreach", icon: "✉️" },
  { href: "/approvals", label: "Approvals", icon: "✅" },
  { href: "/meetings", label: "Meetings", icon: "📅" },
  { href: "/proposals", label: "Proposals", icon: "📄" },
  { href: "/workflows", label: "Workflows", icon: "⚙️" },
  { href: "/reports", label: "Reports", icon: "📈" },
  { href: "/ai-research", label: "AI Research", icon: "🤖" },
  { href: "/ai-outreach", label: "AI Outreach", icon: "✉️" },
  { href: "/email-queue", label: "Email Queue", icon: "📬" },
  { href: "/followup-center", label: "Follow-ups", icon: "🔄" },
  { href: "/reports", label: "Reports", icon: "📊" },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-full w-64 bg-zinc-900 text-zinc-100 border-r border-zinc-800 flex flex-col">
      <div className="flex items-center gap-2 px-6 py-5">
        <span className="text-xl">📈</span>
        <span className="text-sm font-bold tracking-tighter uppercase">VALTORIX BD OS</span>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Demo Data</div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          All numbers shown are clearly labelled demo data. No real customer records are used in this phase.
        </p>
      </div>
    </aside>
  );
}
