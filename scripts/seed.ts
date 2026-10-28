/**
 * Seed script for VALTORIX BD OS development database.
 *
 * Run after creating a Neon project and applying migration 001:
 *
 *   npx tsx scripts/seed.ts
 *
 * This creates:
 * - System roles: superadmin, orgadmin, bd_manager, bd_executive
 * - Base permissions for CRM, outreach, workflows, approvals
 * - Default role-permission assignments
 * - A seed organization (Valtorix Infotech)
 * - A seed admin user (admin@valtorix.com / admin123)
 */

import { config } from "dotenv";
config();

import { db } from "../src/lib/db/client";
import { roles } from "../src/lib/db/schema/roles";
import { permissions } from "../src/lib/db/schema/permissions";
import { role_permissions } from "../src/lib/db/schema/role_permissions";
import { organizations } from "../src/lib/db/schema/organizations";
import { profiles } from "../src/lib/db/schema/profiles";
import { organization_members } from "../src/lib/db/schema/organization_members";
import { hash } from "bcryptjs";

async function main() {
  console.log("🌱 Seeding VALTORIX BD OS database...");

  // 1. Create roles
  const [superadminRole] = await db
    .insert(roles)
    .values({
      name: "superadmin",
      description: "Full system access across all organizations",
    })
    .returning();

  const [orgAdminRole] = await db
    .insert(roles)
    .values({
      name: "orgadmin",
      description: "Organization administrator — manages users and settings",
    })
    .returning();

  const [bdManagerRole] = await db
    .insert(roles)
    .values({
      name: "bd_manager",
      description: "BD Manager — approves outreach, pricing, and deals",
    })
    .returning();

  const [bdExecRole] = await db
    .insert(roles)
    .values({
      name: "bd_executive",
      description: "BD Executive — works leads, outreach, and meetings",
    })
    .returning();

  console.log("  Roles created:", [
    superadminRole.name,
    orgAdminRole.name,
    bdManagerRole.name,
    bdExecRole.name,
  ]);

  // 2. Create permissions
  const perms = [
    { key: "org.manage", description: "Manage organization settings" },
    { key: "org.members.manage", description: "Add/remove organization members" },
    { key: "lead.create", description: "Create new leads" },
    { key: "lead.read", description: "Read leads" },
    { key: "lead.update", description: "Update leads" },
    { key: "lead.delete", description: "Delete leads" },
    { key: "lead.import", description: "Import leads from CSV" },
    { key: "outreach.draft", description: "Create outreach drafts" },
    { key: "outreach.approve", description: "Approve outreach for sending" },
    { key: "outreach.send", description: "Send approved outreach" },
    { key: "deal.create", description: "Create deals" },
    { key: "deal.update", description: "Update deals" },
    { key: "deal.approve", description: "Approve deal terms" },
    { key: "proposal.create", description: "Create proposals" },
    { key: "proposal.approve", description: "Approve proposals" },
    { key: "workflow.manage", description: "Manage workflow rules" },
    { key: "reports.read", description: "Read reports and analytics" },
    { key: "audit.read", description: "Read audit logs" },
  ];

  const insertedPerms = await db.insert(permissions).values(perms).returning();
  console.log("  Permissions created:", insertedPerms.length);

  // 3. Assign permissions to roles
  // Superadmin gets all permissions
  for (const p of insertedPerms) {
    await db.insert(role_permissions).values({
      role_id: superadminRole.id,
      permission_id: p.id,
    });
  }

  // OrgAdmin gets org management + most CRM permissions
  const orgAdminPerms = [
    "org.manage", "org.members.manage", "lead.create", "lead.read",
    "lead.update", "lead.import", "outreach.draft", "outreach.approve",
    "outreach.send", "deal.create", "deal.update", "proposal.create",
    "proposal.approve", "reports.read",
  ];
  for (const key of orgAdminPerms) {
    const p = insertedPerms.find((x) => x.key === key);
    if (p) {
      await db.insert(role_permissions).values({
        role_id: orgAdminRole.id,
        permission_id: p.id,
      });
    }
  }

  // BD Manager gets lead + outreach + deal + proposal permissions
  const bdManagerPerms = [
    "lead.create", "lead.read", "lead.update", "lead.import",
    "outreach.draft", "outreach.approve", "outreach.send",
    "deal.create", "deal.update", "deal.approve",
    "proposal.create", "proposal.approve", "reports.read",
  ];
  for (const key of bdManagerPerms) {
    const p = insertedPerms.find((x) => x.key === key);
    if (p) {
      await db.insert(role_permissions).values({
        role_id: bdManagerRole.id,
        permission_id: p.id,
      });
    }
  }

  // BD Executive gets basic lead + outreach permissions
  const bdExecPerms = [
    "lead.create", "lead.read", "lead.update", "lead.import",
    "outreach.draft", "reports.read",
  ];
  for (const key of bdExecPerms) {
    const p = insertedPerms.find((x) => x.key === key);
    if (p) {
      await db.insert(role_permissions).values({
        role_id: bdExecRole.id,
        permission_id: p.id,
      });
    }
  }

  console.log("  Role-permission assignments created");

  // 4. Create seed organization
  const [org] = await db
    .insert(organizations)
    .values({
      name: "Valtorix Infotech",
      slug: "valtorix",
    })
    .returning();

  console.log("  Organization created:", org.name);

  // 5. Create seed admin user
  const password_hash = await hash("admin123", 12);
  const [admin] = await db
    .insert(profiles)
    .values({
      email: "admin@valtorix.com",
      name: "System Administrator",
      password_hash,
      role_id: superadminRole.id,
    })
    .returning();

  await db.insert(organization_members).values({
    organization_id: org.id,
    profile_id: admin.id,
    role_id: superadminRole.id,
  });

  console.log("  Admin user created: admin@valtorix.com / admin123");
  console.log("✅ Seed complete!");
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
