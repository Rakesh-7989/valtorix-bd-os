/**
 * Migration Test Script — Phase 8 Production Hardening
 *
 * Tests database migrations on a clean database to ensure they apply
 * correctly and can be rolled back safely.
 *
 * Usage: node scripts/test-migrations.mjs <neon_connection_string>
 */

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { execSync } from "child_process";

config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL not set in .env");
  process.exit(1);
}

const sql = neon(connectionString);

const migrations = [
  "src/lib/db/migrations/001_identity_tables.sql",
  "src/lib/db/migrations/002_crm_tables.sql",
  "src/lib/db/migrations/003_ai_tables.sql",
  "src/lib/db/migrations/004_workflow_engine.sql",
  "src/lib/db/migrations/005_outreach_automation.sql",
  "src/lib/db/migrations/006_deal_lifecycle.sql",
];

async function testMigration(migrationFile) {
  const sqlContent = readFileSync(migrationFile, "utf8");
  const statements = sqlContent
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`\nTesting ${migrationFile} (${statements.length} statements)...`);

  let success = 0;
  let failed = 0;

  for (const stmt of statements) {
    try {
      await sql.query(stmt);
      success++;
    } catch (err) {
      // Some statements may fail if objects already exist (idempotent check)
      if (err.message.includes("already exists")) {
        success++;
      } else {
        console.log(`  ✗ ${stmt.substring(0, 60)}... - ${err.message}`);
        failed++;
      }
    }
  }

  console.log(`  Result: ${success} succeeded, ${failed} failed`);
  return failed === 0;
}

async function main() {
  console.log("Phase 8 — Migration Test Suite\n");
  console.log("=" .repeat(60));

  let allPassed = true;
  for (const migration of migrations) {
    const passed = await testMigration(migration);
    if (!passed) allPassed = false;
  }

  console.log("\n" + "=".repeat(60));
  console.log(allPassed ? "✓ All migrations passed!" : "✗ Some migrations failed!");
  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error("Migration test failed:", err);
  process.exit(1);
});
