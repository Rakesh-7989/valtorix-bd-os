import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { followup_rules } from "@/lib/db/schema/followup_rules";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sequenceConfig: z.array(
    z.object({
      dayOffset: z.number().min(0),
      channel: z.string(),
      template: z.string(),
      condition: z.string().optional(),
    })
  ),
  stopConditions: z.array(
    z.object({
      type: z.enum(["reply", "opt_out", "deal_closed", "no_response"]),
      value: z.string().optional(),
    })
  ),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rules = await db
      .select()
      .from(followup_rules)
      .where(eq(followup_rules.is_active, true))
      .orderBy(followup_rules.created_at);

    return NextResponse.json({ rules });
  } catch (error) {
    console.error("Follow-up rules GET error:", error);
    return NextResponse.json({ error: "Failed to fetch rules" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const input = createRuleSchema.parse(body);

    const [rule] = await db
      .insert(followup_rules)
      .values({
        name: input.name,
        description: input.description ?? null,
        sequence_config: input.sequenceConfig,
        stop_conditions: input.stopConditions,
      })
      .returning();

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("Follow-up rules POST error:", error);
    return NextResponse.json({ error: "Failed to create rule" }, { status: 400 });
  }
}
