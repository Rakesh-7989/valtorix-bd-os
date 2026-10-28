import {
  AIProvider,
  CompanyResearchResult,
  LeadScoreResult,
  OutreachDraftResult,
  CompanyRecord,
  ContactRecord,
  ServiceCatalogItem,
} from "./provider";

/**
 * MockAIProvider — Deterministic AI responses for testing and demos.
 *
 * Used when Ollama is not available (Vercel deployments, CI, etc.).
 * Returns consistent, clearly-labelled mock data so the UI can be tested
 * without any AI backend.
 */

export class MockAIProvider implements AIProvider {
  name = "mock";

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async researchCompany(
    companyName: string,
    website?: string
  ): Promise<CompanyResearchResult> {
    // Simulate research delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      company_name: companyName,
      website: website || null,
      industry: "Architecture & Design",
      description: `Mock research for ${companyName}. This is deterministic demo data — not real company information.`,
      size_band: "11-50",
      recent_news: [
        "Mock: Company recently expanded operations",
        "Mock: New leadership appointed",
      ],
      service_fit_evidence: [
        "Company has a website that could benefit from modernization",
        "Architecture firms typically need portfolio showcase websites",
      ],
      missing_information: [
        "Budget evidence not found",
        "Decision maker contact not verified",
        "Timeline for project not specified",
      ],
      source_urls: website ? [website] : [],
      verified: false, // Mock data is never "verified"
    };
  }

  async scoreLead(
    company: CompanyRecord,
    research: CompanyResearchResult
  ): Promise<LeadScoreResult> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Deterministic scoring based on available evidence
    const serviceFitPoints = research.service_fit_evidence.length > 0 ? 25 : 0;
    const evidencePoints = research.recent_news.length > 0 ? 20 : 0;
    const decisionMakerPoints = research.missing_information.includes(
      "Decision maker contact not verified"
    )
      ? 5
      : 15;
    const budgetPoints = research.missing_information.includes(
      "Budget evidence not found"
    )
      ? 0
      : 15;
    const timelinePoints = research.missing_information.includes(
      "Timeline for project not specified"
    )
      ? 0
      : 15;

    const totalScore =
      serviceFitPoints +
      evidencePoints +
      decisionMakerPoints +
      budgetPoints +
      timelinePoints;

    let priority: "high" | "medium" | "low";
    if (totalScore >= 70) priority = "high";
    else if (totalScore >= 40) priority = "medium";
    else priority = "low";

    return {
      score: totalScore,
      score_version: "mock-v1",
      criteria: {
        service_fit: {
          points: serviceFitPoints,
          max: 30,
          reasoning: "Based on service fit evidence from company research",
        },
        evidence_of_need: {
          points: evidencePoints,
          max: 25,
          reasoning: "Based on recent company news and activity",
        },
        decision_maker_access: {
          points: decisionMakerPoints,
          max: 15,
          reasoning: "Decision maker access not verified in mock data",
        },
        budget_evidence: {
          points: budgetPoints,
          max: 15,
          reasoning: "No budget evidence found in mock research",
        },
        timeline_evidence: {
          points: timelinePoints,
          max: 15,
          reasoning: "No timeline evidence found in mock research",
        },
      },
      priority,
      missing_information: [...research.missing_information],
    };
  }

  async draftOutreach(
    company: CompanyRecord,
    contact: ContactRecord | null,
    serviceCatalog: ServiceCatalogItem[],
    research: CompanyResearchResult
  ): Promise<OutreachDraftResult> {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const service =
      serviceCatalog[0] || {
        name: "Website Development",
        description: "Professional website services",
        base_price: 75000,
        currency: "INR",
      };
    const contactName = contact?.name || "there";
    const companyName = company?.name || research.company_name;

    return {
      subject: `Website modernization for ${companyName}`,
      body: `Hi ${contactName},\n\nI came across ${companyName} and noticed your architecture practice could benefit from a modern website showcase. Our team specializes in website development for architecture firms.\n\n${service.description}\n\nWould you be open to a brief call next week to discuss your needs?\n\nBest regards,\nVALTORIX BD Team`,
      service_recommended: service.name,
      personalization_points: [
        "Company name from CRM record",
        "Industry from AI research",
        "Mock personalization — replace with real data",
      ],
      source_context: research.source_urls.join(", ") || "No sources",
    };
  }
}
