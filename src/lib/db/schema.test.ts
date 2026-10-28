/**
 * Database Schema Tests — Phase 8 Production Hardening
 *
 * Verifies that all database tables are properly exported from the
 * schema module. Integration tests against a real Neon database
 * should be run separately using scripts/test-migrations.mjs.
 */

import { describe, it, expect } from "vitest";

import {
  organizations,
  profiles,
  roles,
  permissions,
  organization_members,
  companies,
  contacts,
  leads,
  deals,
  tasks,
  activities,
  proposals,
  proposal_items,
  meetings,
  meeting_actions,
  outreach_drafts,
  research_records,
  lead_scores,
  email_deliveries,
  suppression_records,
  followup_rules,
  followup_tasks,
  workflows,
  workflow_runs,
  jobs,
  approvals,
  audit_logs,
  handover_records,
  tags,
  lead_tags,
} from "./schema";

describe("Database Schema — Phase 8", () => {
  it("exports all expected tables", () => {
    const expectedTables = [
      "organizations",
      "profiles",
      "roles",
      "permissions",
      "organization_members",
      "companies",
      "contacts",
      "leads",
      "deals",
      "tasks",
      "activities",
      "proposals",
      "proposal_items",
      "meetings",
      "meeting_actions",
      "outreach_drafts",
      "research_records",
      "lead_scores",
      "email_deliveries",
      "suppression_records",
      "followup_rules",
      "followup_tasks",
      "workflows",
      "workflow_runs",
      "jobs",
      "approvals",
      "audit_logs",
      "handover_records",
      "tags",
      "lead_tags",
    ];

    const tables: Record<string, unknown> = {
      organizations,
      profiles,
      roles,
      permissions,
      organization_members,
      companies,
      contacts,
      leads,
      deals,
      tasks,
      activities,
      proposals,
      proposal_items,
      meetings,
      meeting_actions,
      outreach_drafts,
      research_records,
      lead_scores,
      email_deliveries,
      suppression_records,
      followup_rules,
      followup_tasks,
      workflows,
      workflow_runs,
      jobs,
      approvals,
      audit_logs,
      handover_records,
      tags,
      lead_tags,
    };

    for (const tableName of expectedTables) {
      expect(tables[tableName], `Table ${tableName} should be exported`).toBeDefined();
      expect(typeof tables[tableName], `Table ${tableName} should be an object`).toBe("object");
    }
  });
});
