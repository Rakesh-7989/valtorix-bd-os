import { NextResponse } from "next/server";
import { AIService } from "@/lib/ai/service";

/**
 * POST /api/ai/research
 * Body: { companyId: string }
 * Research a company using AI and save results.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { companyId } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId is required" },
        { status: 400 }
      );
    }

    const aiService = new AIService();
    const research = await aiService.researchCompany(companyId);

    return NextResponse.json({
      success: true,
      research,
      provider: "mock-or-ollama",
    });
  } catch (error) {
    console.error("AI research error:", error);
    return NextResponse.json(
      { error: "Research failed" },
      { status: 500 }
    );
  }
}
