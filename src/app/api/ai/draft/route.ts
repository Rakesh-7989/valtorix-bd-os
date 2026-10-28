import { NextResponse } from "next/server";
import { AIService } from "@/lib/ai/service";

/**
 * POST /api/ai/draft
 * Body: { leadId: string, contactId?: string }
 * Generate a personalized outreach draft (pending approval).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leadId, contactId } = body;

    if (!leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 });
    }

    const aiService = new AIService();
    const draft = await aiService.draftOutreach(leadId, contactId);

    return NextResponse.json({
      success: true,
      draft,
    });
  } catch (error) {
    console.error("AI draft error:", error);
    return NextResponse.json(
      { error: "Draft generation failed" },
      { status: 500 }
    );
  }
}
