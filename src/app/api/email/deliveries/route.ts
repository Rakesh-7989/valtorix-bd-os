import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EmailService } from "@/lib/email/service";
import { MockEmailAdapter } from "@/lib/email/adapter";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get("leadId");
    const draftId = searchParams.get("draftId");

    const adapter = new MockEmailAdapter();
    const emailService = new EmailService(adapter);

    if (leadId) {
      const deliveries = await emailService.getDeliveriesForLead(leadId);
      return NextResponse.json({ deliveries });
    }

    if (draftId) {
      const deliveries = await emailService.getDeliveriesForDraft(draftId);
      return NextResponse.json({ deliveries });
    }

    return NextResponse.json({ error: "leadId or draftId required" }, { status: 400 });
  } catch (error) {
    console.error("Email deliveries error:", error);
    return NextResponse.json({ error: "Failed to fetch deliveries" }, { status: 500 });
  }
}
