import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { companies } from "@/lib/db/schema/companies";
import { companyUpdateSchema } from "@/lib/validation/companies";
import { eq, and } from "drizzle-orm";
import { getCurrentUserOrgId } from "@/lib/auth-helper";

/**
 * GET /api/companies/[id] — Get a single company
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const orgId = await getCurrentUserOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [company] = await db
      .select()
      .from(companies)
      .where(
        and(eq(companies.id, id), eq(companies.organization_id, orgId))
      )
      .limit(1);

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Companies GET single error:", error);
    return NextResponse.json(
      { error: "Failed to fetch company" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/companies/[id] — Update a company
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const orgId = await getCurrentUserOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = companyUpdateSchema.parse(body);

    const [company] = await db
      .update(companies)
      .set({
        ...validated,
        updated_at: new Date(),
      })
      .where(
        and(eq(companies.id, id), eq(companies.organization_id, orgId))
      )
      .returning();

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Companies PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update company" },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/companies/[id] — Delete a company
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const orgId = await getCurrentUserOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [deleted] = await db
      .delete(companies)
      .where(
        and(eq(companies.id, id), eq(companies.organization_id, orgId))
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Company deleted" });
  } catch (error) {
    console.error("Companies DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete company" },
      { status: 500 }
    );
  }
}
