# VALTORIX BD OS — Implementation Plan

## Phase 0 — Foundation (Current)

- [x] Next.js + TypeScript + Tailwind scaffold
- [x] Dashboard shell with sidebar navigation
- [x] Environment variable validation and `.env.example`
- [x] Lint, TypeScript, and production build configured
- [x] Docs: architecture.md, implementation-plan.md
- [x] README with Windows PowerShell setup instructions
- [ ] GitHub repository connected and initial commit pushed

## Phase 1 — Neon Database & Authentication

- Create Neon development project and get connection string
- Configure authentication provider (NextAuth.js, credentials, or Clerk)
- Install Drizzle ORM + @neondatabase/serverless
- Initial migration: `profiles`, `organizations`, `organization_members`, `roles`
- Business tables with organization ownership from the start
- Enable RLS and create policies for each table via SQL
- Seed data for development
- Test signed-out, authorized, and cross-organization access
- Commit migrations and generated database types

## Phase 2 — CRM Core

- Company CRUD
- Contact CRUD
- Lead CRUD
- CSV import with preview and validation
- Duplicate detection
- Lead status and ownership
- Activities and notes
- Deal pipeline
- Tasks and next-action dates
- Search, filters, pagination, dashboard counts

## Phase 3 — AI Lead Intelligence

- AI adapter interface (`MockAIProvider`, `OllamaProvider`)
- Company research schemas
- Evidence sources and verification states
- Rule-based lead scoring
- AI company research summaries
- Personalized outreach draft generation
- Zod validation of model output
- UI to review, edit, regenerate drafts

## Phase 4 — Persistent Workflow Engine & Approvals

- `workflow_runs`, `jobs`, `approvals`, `audit_logs` tables
- Explicit workflow states
- Scheduler and worker with restart recovery
- Job idempotency and bounded retries
- Approval, rejection, expiry, cancellation
- Approvals bound to exact action payloads
- Pause-all-automations control
- Activity timeline per execution
- Concurrent approval and duplicate delivery tests

## Phase 5 — Outreach & Follow-up Automation

- Outreach draft and approval screens
- Email adapter interface (mock first, real later)
- Approval-gated sending and delivery status
- Follow-up tasks from configurable rules
- Reply, opt-out, closed-deal stop conditions
- Message revalidation before sending
- Provider error and timeout handling

## Phase 6 — Meetings, Proposals & Closing

- Meeting records and discovery templates
- Meeting summaries and action-item extraction
- Service catalogue and proposal templates
- Proposal line items and deterministic totals
- Versioning and pricing approval
- Downloadable proposal documents
- Negotiation, won, lost deal states
- Handover record on configured win criteria

## Phase 7 — Dashboard & Analytics

- Total and qualified leads
- Leads by owner and stage
- Follow-ups due today and overdue
- Meetings scheduled
- Proposals pending approval
- Open pipeline value
- Won and lost deals
- Conversion by stage
- AI execution failures and approval turnaround

## Phase 8 — Production Hardening & Release

- Authorization and RLS tests
- Secrets absent from Git history and browser bundles
- Migration testing on clean database
- Backup and restore testing
- Concurrent workflow execution tests
- Email suppression and duplicate-send prevention
- Monitoring and error logging
- Pilot with synthetic data, then authorized real records
- Installation, recovery, access management, rollback docs
