# VALTORIX BD OS — Production Deployment Guide

## Phase 8 — Production Hardening & Release

This document covers production deployment, security hardening, backup/restore,
and rollback procedures for VALTORIX BD OS.

---

## Pre-Deployment Checklist

Before deploying to production, complete all items below:

### Security

- [ ] No secrets in Git history (`git log -p --all -S "DATABASE_URL"`, etc.)
- [ ] `.env.local`, `.env`, `.env.production` are in `.gitignore`
- [ ] `.env.example` contains only placeholder values
- [ ] `DATABASE_URL`, `AUTH_SECRET` are set in production environment
- [ ] Row Level Security (RLS) is enabled on all tenant tables
- [ ] All API routes have authentication middleware
- [ ] Approval engine requires valid, unexpired approval for external actions
- [ ] Suppression list is functional (unsubscribe/opt-out/bounce)

### Database

- [ ] All 6 migrations applied in order (001–006)
- [ ] Seed data loaded (organizations, roles, permissions, admin user)
- [ ] Database backups configured and tested
- [ ] Connection pooling configured (Neon pooled connection string)

### Application

- [ ] `NODE_ENV=production` set
- [ ] `LOG_LEVEL` set (info/warn/error)
- [ ] Build passes: `npm run build`
- [ ] Lint passes: `npm run lint`
- [ ] TypeScript passes: `npx tsc --noEmit`
- [ ] Tests pass: `npx vitest run`

### Deployment Target

- [ ] Vercel account configured (if using Vercel)
- [ ] Neon project created and accessible
- [ ] Domain configured and SSL enabled
- [ ] Environment variables configured in deployment platform

---

## Deployment Steps

### 1. Push Code to GitHub

```powershell
git add .
git commit -m "feat: prepare for production deployment"
git push origin main
```

### 2. Deploy to Vercel

Connect the GitHub repository to Vercel:

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import `Rakesh-7989/valtorix-bd-os`
4. Configure framework preset: Next.js
5. Add environment variables:
   - `DATABASE_URL` — Neon connection string
   - `AUTH_SECRET` — Random 32+ character string
   - `NODE_ENV` — `production`
   - `AI_PROVIDER` — `mock` (or `ollama` if using local AI)
   - `LOG_LEVEL` — `info`
6. Click "Deploy"

### 3. Apply Database Migrations

On your local machine or a deployment runner:

```powershell
# Set DATABASE_URL to production Neon connection string
$env:DATABASE_URL="postgresql://..."

# Apply all migrations in order
node scripts/push-db.mjs src/lib/db/migrations/001_identity_tables.sql
node scripts/push-db.mjs src/lib/db/migrations/002_crm_tables.sql
node scripts/push-db.mjs src/lib/db/migrations/003_ai_tables.sql
node scripts/push-db.mjs src/lib/db/migrations/004_workflow_engine.sql
node scripts/push-db.mjs src/lib/db/migrations/005_outreach_automation.sql
node scripts/push-db.mjs src/lib/db/migrations/006_deal_lifecycle.sql

# Seed initial data
npm run seed
```

### 4. Verify Deployment

Run the security audit:

```powershell
node scripts/security-audit.mjs
```

Run the migration test:

```powershell
node scripts/test-migrations.mjs
```

Visit the application and verify:
- Sign-in works with seeded admin credentials
- All navigation modules load
- Approval engine blocks actions without approval
- Email suppression list works

---

## Rollback Procedure

### Code Rollback

To roll back the application code to a previous commit:

```powershell
# Find the commit to roll back to
git log --oneline -10

# Reset to that commit
git reset --hard <commit-sha>
git push -f origin main
```

Vercel will automatically redeploy from the pushed commit.

### Database Rollback

Database migrations are applied incrementally. To roll back a specific migration:

1. Identify the migration to roll back
2. Manually drop the tables/columns added by that migration
3. Or restore from a database backup

**Important:** Database rollbacks are destructive. Always take a backup first:

```powershell
# Neon database backup via CLI (if neon CLI is installed)
neonctl branches backups create <branch-id>
```

Or use the Neon dashboard to create a manual backup before applying migrations.

### Full Rollback

If both code and database need to be rolled back:

1. Take a Neon database backup
2. Roll back application code (see above)
3. If database schema changed incompatibly, restore from backup

---

## Backup & Restore

### Database Backup (Neon)

Neon provides automated backups. To create a manual backup:

1. Go to Neon Console → Your Project → Branches
2. Click on your production branch
3. Click "Create backup"
4. Download or store the backup

### Database Restore

To restore from a backup:

1. Go to Neon Console → Branches → Backups
2. Click "Restore" on the desired backup
3. This creates a new branch — update `DATABASE_URL` to point to it

### Application Code Backup

Application code is backed up in GitHub. To restore:

```powershell
git clone https://github.com/Rakesh-7989/valtorix-bd-os.git
cd valtorix-bd-os
git checkout <commit-sha>
npm install
npm run build
```

---

## Monitoring & Logging

### Application Logging

VALTORIX BD OS uses structured JSON logging:

- `src/lib/monitoring.ts` — Logger with levels (debug, info, warn, error, fatal)
- All errors are logged with stack traces
- Request IDs are generated for request correlation
- Performance timing is tracked for operations

### Error Tracking

Error tracking via Sentry can be enabled by:

1. Creating a Sentry project at https://sentry.io
2. Adding `SENTRY_DSN` to environment variables
3. Uncommenting the Sentry integration in `src/lib/monitoring.ts`

### Health Checks

The application exposes health via:
- `GET /api/dashboard/overview` — Returns system metrics
- `GET /api/dashboard/pipeline` — Returns pipeline distribution
- `GET /api/dashboard/conversion` — Returns conversion funnel

### Log Retention

Application logs are retained according to the hosting platform's policy:
- Vercel: Function logs retained per plan
- Neon: Database query logs retained per plan

---

## Security Configuration

### Row Level Security (RLS)

All tenant-owned tables have RLS enabled. Policies ensure users can only
access data within their organization(s). RLS is enforced at the database
level, providing defense-in-depth even if application logic has bugs.

### Approval Engine

External actions (sending emails, creating deals, changing pricing) require
a valid, unexpired approval for the exact payload. The approval payload hash
is verified at execution time to prevent tampering.

### Suppression List

Unsubscribed, bounced, and do-not-contact recipients are stored in the
`suppression_records` table and checked before every email send.

### Idempotency

All background jobs use idempotency keys to prevent duplicate execution.
External actions (email sends, etc.) are checked for idempotency before
processing.

---

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string | `postgresql://...` |
| `AUTH_SECRET` | Yes | NextAuth.js signing secret | `random-32-char-string` |
| `NODE_ENV` | Yes | Application environment | `production` |
| `AI_PROVIDER` | No | AI provider (`mock` or `ollama`) | `mock` |
| `OLLAMA_BASE_URL` | No | Ollama endpoint (local only) | `http://127.0.0.1:11434` |
| `LOG_LEVEL` | No | Minimum log level | `info` |

---

## Troubleshooting

### Build Fails

1. Check Node.js version (18+ LTS)
2. Run `npm install` to ensure dependencies
3. Run `npm run build` locally to catch errors
4. Check Vercel build logs for specific errors

### Database Connection Fails

1. Verify `DATABASE_URL` is correct
2. Check Neon project is active (not suspended)
3. Verify SSL mode is `require` in connection string
4. Check Neon firewall/IP allowlist

### Sign-In Fails

1. Verify `AUTH_SECRET` is set
2. Verify user exists in `profiles` table
3. Verify password hash is correct
4. Check browser cookies are enabled

### Emails Not Sending

1. Verify `AI_PROVIDER=mock` or email provider configured
2. Check recipient is not in suppression list
3. Check approval exists and is not expired
4. Check application logs for error details

---

## Support

For production issues, check:
1. Application logs (Vercel function logs)
2. Neon database logs
3. Sentry error tracking (if configured)
4. GitHub issues for known bugs
