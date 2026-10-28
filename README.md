# VALTORIX BD OS

AI-powered Business Development Automation Platform for VALTORIX INFOTECH.

An internal tool that manages the full BD lifecycle — lead import, qualification, outreach, follow-ups, meetings, proposals, deal closing, and project handover — with AI assistance and human-governed approvals.

## Tech Stack

- Next.js App Router, TypeScript
- Tailwind CSS
- Supabase PostgreSQL + Auth (Phase 1+)
- Ollama for local AI (Phase 3+)
- Zero mandatory paid services for the MVP

## Prerequisites (Windows)

- Node.js 18+ (LTS recommended)
- npm
- Git
- (Optional) Ollama for local AI inference

## Setup

Open PowerShell and run:

```powershell
# 1. Clone the repository
git clone https://github.com/YOUR_GITHUB_NAME/valtorix-bd-os.git
cd valtorix-bd-os

# 2. Install dependencies
npm install

# 3. Copy environment variables
Copy-Item .env.example .env.local

# 4. Edit .env.local with your own values (never commit it)
# Not required for Phase 0; Supabase and AI keys are added in later phases.

# 5. Run the development server
npm run dev

# 6. Open http://localhost:3000
```

## Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start development server on localhost:3000 |
| `npm run build` | Production build (Turbopack) |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | TypeScript type check |

## Project Phases

See `docs/implementation-plan.md` for the full 8-phase roadmap.

## Security

- Never commit `.env.local`, secrets, customer data, or database dumps.
- Supabase secret keys are server-side only.
- All external actions require approval before execution.
- See `docs/architecture.md` for full security principles.

## License

Private — VALTORIX INFOTECH internal use.
