import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { companies } from "@/lib/db/schema/companies";
import { companySchema } from "@/lib/validation/companies";
import { eq, and, ilike } from "drizzle-orm";
import { getCurrentUserOrgId } from "@/lib/auth-helper";

/**
 * GET /api/companies — List companies for the current organization
 */
export async function GET(req: Request) {
  try {
    const orgId = await getCurrentUserOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const industry = searchParams.get("industry") ?? "";
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const offset = parseInt(searchParams.get("offset") ?? "0");

    const conditions = [eq(companies.organization_id, orgId)];

    if (search) {
      conditions.push(ilike(companies.name, `%${search}%`));
    }

    if (industry) {
      conditions.push(eq(companies.industry, industry));
    }

    const results = await db
      .select()
      .from(companies)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: results,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Companies GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/companies — Create a new company
 */
export async function POST(req: Request) {
  try {
    const orgId = await getCurrentUserOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = companySchema.parse(body);

    const [company] = await db
      .insert(companies)
      .values({
        ...validated,
        organization_id: orgId,
        website: validated.website || null,
        industry: validated.industry || null,
        location: validated.location || null,
        size_band: validated.size_band || null,
        description: validated.description || null,
      })
      .returning();

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error("Companies POST error:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 400 }
    );
  }
}
