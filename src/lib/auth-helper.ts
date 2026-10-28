import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { organization_members } from "@/lib/db/schema/organization_members";
import { eq } from "drizzle-orm";

/**
 * Get the current authenticated user's organization ID.
 * Returns null if no session or no organization membership.
 */
export async function getCurrentUserOrgId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }

  const membership = await db
    .select({ organization_id: organization_members.organization_id })
    .from(organization_members)
    .where(eq(organization_members.profile_id, session.user.id))
    .limit(1);

  return membership.length > 0 ? membership[0].organization_id : null;
}

/**
 * Get the current authenticated user's profile ID.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

/**
 * Check if the current user has access to a specific organization.
 */
export async function hasOrgAccess(organizationId: string): Promise<boolean> {
  const orgId = await getCurrentUserOrgId();
  return orgId === organizationId;
}
