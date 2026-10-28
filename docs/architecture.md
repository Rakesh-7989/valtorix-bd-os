# VALTORIX BD OS — Architecture

## Overview

VALTORIX BD OS is an AI-assisted Business Development Automation platform. The first release is a modular Next.js application that runs locally on a Windows PC and can be deployed to Vercel preview/production.

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js App Router (TypeScript) | Frontend + API routes |
| Styling | Tailwind CSS + custom components | Responsive UI |
| Package Manager | npm | Dependency management |
| Database | Supabase PostgreSQL (Phase 1) | CRM records, workflows, audit logs |
| Authentication | Supabase Auth (Phase 1) | User sign-in, sessions |
| Authorization | Role-based + PostgreSQL RLS | Org-scoped data access |
| Validation | Zod | API input validation |
| AI | Ollama (local) / MockAIProvider (demo) | Research, scoring, drafts |
| Background Jobs | Database-backed job table (Phase 4) | Scheduled tasks, retries |
| Testing | Vitest + Playwright | Unit, integration, E2E |

## Directory Structure

```
valtorix-bd-os/
├── apps/                 # (future: desktop shell via Tauri)
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # Shared UI components
│   ├── lib/              # Utilities, env validation, adapters
│   ├── features/         # Domain modules (leads, deals, outreach...)
│   └── styles/           # Global styles
├── docs/                 # Architecture and implementation plans
├── storage/              # (runtime: proposals, exports, backups — not in Git)
├── .env.example          # Environment variable placeholders
├── .gitignore            # Git ignore rules
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

## Security Principles

- Supabase service-role/secret key is server-side only; never in the browser.
- Client uses publishable key with Row Level Security (RLS) on every table.
- Organization membership enforced server-side; hiding UI buttons is not sufficient.
- External actions (email, proposals, contracts) require valid approval for the exact payload.
- Audit logs are append-only; AI outputs are treated as untrusted/unverified.
- No secrets, customer data, or database dumps in Git.

## Cost Policy

- Zero mandatory paid services for the MVP.
- No paid AI APIs or cloud inference by default.
- Ollama runs locally on the developer's Windows PC.
- Vercel preview deployments are optional and subject to plan terms.

## Deployment Notes

- Vercel cannot reach `localhost:11434` (Ollama on your PC).
- Hosted previews use `MockAIProvider` or show AI features as unavailable.
- For hosted deployments with local AI, a separate companion worker on the Windows PC polls for jobs via authenticated outbound connection.
- Do not expose Ollama ports to the public internet.
