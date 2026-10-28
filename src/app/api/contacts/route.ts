import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { contacts } from "@/lib/db/schema/contacts";
import { contactSchema } from "@/lib/validation/contacts";
import { eq, and, ilike } from "drizzle-orm";
import { getCurrentUserOrgId } from "@/lib/auth-helper";

/**
 * GET /api/contacts — List contacts for the current organization
 */
export async function GET(req: Request) {
  try {
    const orgId = await getCurrentUserOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const company_id = searchParams.get("company_id") ?? "";
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const offset = parseInt(searchParams.get("offset") ?? "0");

    const conditions = [eq(contacts.organization_id, orgId)];

    if (search) {
      conditions.push(ilike(contacts.name, `%${search}%`));
    }

    if (company_id) {
      conditions.push(eq(contacts.company_id, company_id));
    }

    const results = await db
      .select()
      .from(contacts)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      data: results,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Contacts GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contacts — Create a new contact
 */
export async function POST(req: Request) {
  try {
    const orgId = await getCurrentUserOrgId();
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = contactSchema.parse(body);

    const [contact] = await db
      .insert(contacts)
      .values({
        ...validated,
        organization_id: orgId,
        email: validated.email || null,
        phone: validated.phone || null,
        title: validated.title || null,
      })
      .returning();

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error("Contacts POST error:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 400 }
    );
  }
}
