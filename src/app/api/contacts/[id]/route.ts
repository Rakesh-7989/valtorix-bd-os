import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { contacts } from "@/lib/db/schema/contacts";
import { contactUpdateSchema } from "@/lib/validation/contacts";
import { eq, and } from "drizzle-orm";
import { getCurrentUserOrgId } from "@/lib/auth-helper";

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

    const [contact] = await db
      .select()
      .from(contacts)
      .where(
        and(eq(contacts.id, id), eq(contacts.organization_id, orgId))
      )
      .limit(1);

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Contacts GET single error:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact" },
      { status: 500 }
    );
  }
}

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
    const validated = contactUpdateSchema.parse(body);

    const [contact] = await db
      .update(contacts)
      .set({
        ...validated,
        updated_at: new Date(),
      })
      .where(
        and(eq(contacts.id, id), eq(contacts.organization_id, orgId))
      )
      .returning();

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Contacts PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update contact" },
      { status: 400 }
    );
  }
}

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
      .delete(contacts)
      .where(
        and(eq(contacts.id, id), eq(contacts.organization_id, orgId))
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Contact deleted" });
  } catch (error) {
    console.error("Contacts DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete contact" },
      { status: 500 }
    );
  }
}
