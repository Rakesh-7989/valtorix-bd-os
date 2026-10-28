"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Contact = {
  id: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  company_id: string;
  consent_status: string;
  do_not_contact: boolean;
  created_at: string;
};

async function fetchContacts(search: string): Promise<Contact[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  params.set("limit", "100");

  const res = await fetch(`/api/contacts?${params}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (res.ok) {
    const data = await res.json();
    return data.data || [];
  }
  return [];
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const data = await fetchContacts(search);
      if (mounted) {
        setContacts(data);
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [search]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center pl-64">
        <div className="text-zinc-500">Loading contacts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Contacts</h2>
        <p className="text-zinc-500">
          Manage your contacts and decision-makers.
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <Link
          href="/contacts/new"
          className="px-4 py-2 bg-zinc-900 text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors"
        >
          + Add Contact
        </Link>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Name
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Title
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Email
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Phone
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">
                Consent
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {contacts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                  No contacts found. Add your first contact to get started.
                </td>
              </tr>
            ) : (
              contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/contacts/${contact.id}`}
                      className="font-medium text-zinc-900 hover:underline"
                    >
                      {contact.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {contact.title || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {contact.email || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {contact.phone || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                        contact.consent_status === "granted"
                          ? "bg-emerald-50 text-emerald-700"
                          : contact.consent_status === "denied"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-zinc-50 text-zinc-700"
                      }`}
                    >
                      {contact.consent_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/contacts/${contact.id}`}
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
