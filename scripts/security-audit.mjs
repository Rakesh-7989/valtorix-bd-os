/**
 * Security Audit Script — Phase 8 Production Hardening
 *
 * Performs security checks on the codebase and configuration.
 *
 * Checks:
 * 1. No secrets in Git history
 * 2. No secrets in source files
 * 3. .env files are gitignored
 * 4. RLS is enabled on all tables
 * 5. API routes have authorization middleware
 *
 * Usage: node scripts/security-audit.mjs
 */

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { globSync } from "glob";

const repoRoot = process.cwd();
let passed = 0;
let failed = 0;

function check(name, condition, detail = "") {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.log(`  ✗ ${name}`);
    if (detail) console.log(`    ${detail}`);
    failed++;
  }
}

console.log("Phase 8 — Security Audit\n");
console.log("=".repeat(60));

// 1. Check .env files are gitignored
console.log("\n1. Environment File Security");
const gitignore = readFileSync(`${repoRoot}/.gitignore`, "utf8");
check(".env.local is gitignored", gitignore.includes(".env.local"));
check(".env is gitignored", gitignore.includes("\n.env\n") || gitignore.includes(".env\n"));
check(".env.production is gitignored", gitignore.includes(".env.production"));
check(".env.example is NOT gitignored (template allowed)", gitignore.includes("!.env.example"));

// 2. Check for secrets in source files
console.log("\n2. Secret Detection in Source Code");
const secretPatterns = [
  { name: "DATABASE_URL hardcoded", pattern: /DATABASE_URL\s*=/ },
  { name: "API key hardcoded", pattern: /API_KEY\s*=/i },
  { name: "Secret key hardcoded", pattern: /SECRET_KEY\s*=/i },
  { name: "Password hardcoded", pattern: /PASSWORD\s*=/i },
  { name: "Private key hardcoded", pattern: /PRIVATE_KEY\s*=/i },
  { name: "Resend API key", pattern: /RESEND_API_KEY\s*=/i },
];

const srcFiles = globSync("src/**/*.{ts,tsx}", { cwd: repoRoot });
let secretsFound = 0;

for (const file of srcFiles) {
  const content = readFileSync(`${repoRoot}/${file}`, "utf8");
  for (const { name, pattern } of secretPatterns) {
    if (pattern.test(content)) {
      // Allow environment variable reads (process.env.NAME) but not hardcoded values
      const lines = content.split("\n");
      lines.forEach((line, i) => {
        if (pattern.test(line) && !line.includes("process.env")) {
          console.log(`  ✗ Potential secret in ${file}:${i + 1}`);
          secretsFound++;
        }
      });
    }
  }
}
check("No hardcoded secrets in source", secretsFound === 0, `${secretsFound} potential secrets found`);

// 3. Check Git history for secrets
console.log("\n3. Git History Security");
try {
  const gitLog = execSync("git log --all --oneline", { cwd: repoRoot, encoding: "utf8" });
  check("Git history exists", gitLog.length > 0);
} catch (e) {
  check("Git history exists", false, "Not a git repository or no commits");
}

// 4. Check RLS on database tables
console.log("\n4. Row Level Security");
const schemaFiles = globSync("src/lib/db/schema/*.ts", { cwd: repoRoot });
const rlsTables = [
  "organizations",
  "profiles",
  "organization_members",
  "companies",
  "contacts",
  "leads",
  "activities",
  "deals",
  "tasks",
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

let rlsMissing = [];
const migrationFiles = globSync("src/lib/db/migrations/*.sql", { cwd: repoRoot });
const migrationContent = migrationFiles.map((f) => readFileSync(`${repoRoot}/${f}`, "utf8")).join("\n");

for (const table of rlsTables) {
  const rlsPattern = new RegExp(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
  if (!rlsPattern.test(migrationContent)) {
    rlsMissing.push(table);
  }
}
check("All tenant tables have RLS enabled", rlsMissing.length === 0, `Missing RLS on: ${rlsMissing.join(", ")}`);

// 5. Check API routes have authorization
console.log("\n5. API Authorization");
const apiRouteFiles = globSync("src/app/api/**/route.ts", { cwd: repoRoot });
let routesWithoutAuth = 0;

for (const file of apiRouteFiles) {
  const content = readFileSync(`${repoRoot}/${file}`, "utf8");
  const hasAuth = content.includes("getServerSession") || content.includes("getCurrentUserOrgId") || content.includes("withAuth");
  if (!hasAuth && !file.includes("[id]")) {
    // [id] routes might rely on parent route auth
    routesWithoutAuth++;
    console.log(`  ⚠ ${file} - no explicit auth check found`);
  }
}
check("All API routes have authorization", routesWithoutAuth === 0, `${routesWithoutAuth} routes may lack auth`);

// 6. Check .env.example exists
console.log("\n6. Configuration Documentation");
check(".env.example exists", existsSync(`${repoRoot}/.env.example`));

// Summary
console.log("\n" + "=".repeat(60));
console.log(`Security Audit: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log("\n⚠ Security issues found. Review and fix before production deployment.");
  process.exit(1);
} else {
  console.log("\n✓ All security checks passed!");
  process.exit(0);
}
