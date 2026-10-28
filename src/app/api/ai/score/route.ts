import { NextResponse } from "next/server";
import { AIService } from "@/lib/ai/service";

/**
 * POST /api/ai/score
 * Body: { leadId: string }
 * Score a lead using AI + deterministic rules.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 });
    }

    const aiService = new AIService();
    const score = await aiService.scoreLead(leadId);

    return NextResponse.json({
      success: true,
      score,
    });
  } catch (error) {
    console.error("AI scoring error:", error);
    return NextResponse.json(
      { error: "Scoring failed" },
      { status: 500 }
    );
  }
}
