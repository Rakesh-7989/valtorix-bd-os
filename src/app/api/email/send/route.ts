import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EmailService } from "@/lib/email/service";
import { MockEmailAdapter } from "@/lib/email/adapter";
import { z } from "zod";

export const dynamic = "force-dynamic";

const sendEmailSchema = z.object({
  outreachDraftId: z.string().uuid(),
  leadId: z.string().uuid(),
  contactId: z.string().uuid(),
  approvalId: z.string().uuid(),
  recipient: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const input = sendEmailSchema.parse(body);

    const adapter = new MockEmailAdapter();
    const emailService = new EmailService(adapter);

    const result = await emailService.sendEmail({
      ...input,
      provider: "mock",
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Email send error:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
