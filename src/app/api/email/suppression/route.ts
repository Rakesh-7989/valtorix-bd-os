import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EmailService } from "@/lib/email/service";
import { MockEmailAdapter } from "@/lib/email/adapter";
import { z } from "zod";

export const dynamic = "force-dynamic";

const suppressionSchema = z.object({
  recipient: z.string().email(),
  reason: z.enum(["unsubscribe", "bounce", "opt_out", "do_not_contact", "invalid"]),
  channel: z.string().default("email"),
  leadId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address");

    const adapter = new MockEmailAdapter();
    const emailService = new EmailService(adapter);

    if (address) {
      const suppressed = await emailService.isSuppressed(address, "email");
      return NextResponse.json({ suppressed, address });
    }

    return NextResponse.json({ error: "address required" }, { status: 400 });
  } catch (error) {
    console.error("Suppression check error:", error);
    return NextResponse.json({ error: "Failed to check suppression" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const input = suppressionSchema.parse(body);

    const adapter = new MockEmailAdapter();
    const emailService = new EmailService(adapter);

    const record = await emailService.addToSuppression(
      input.recipient,
      input.reason,
      session.user.id,
      input.channel,
      input.leadId,
      input.contactId
    );

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Suppression add error:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to add suppression" }, { status: 500 });
  }
}
