/**
 * AI Provider Interface for VALTORIX BD OS.
 *
 * All AI providers must implement this interface. The provider abstraction
 * allows swapping between local Ollama (development) and MockAIProvider
 * (testing/demo) without changing business logic.
 *
 * Security: AI providers only generate content. They never execute external
 * actions (sending emails, creating deals, etc.). All AI outputs are treated
 * as untrusted and must be validated by Zod schemas before use.
 */

export interface CompanyResearchResult {
  company_name: string;
  website: string | null;
  industry: string | null;
  description: string | null;
  size_band: string | null;
  recent_news: string[];
  service_fit_evidence: string[]; // Evidence why our services fit
  missing_information: string[]; // Fields that couldn't be determined
  source_urls: string[]; // Where the info came from
  verified: boolean; // Whether facts were cross-checked
}

export interface LeadScoreResult {
  score: number; // 0-100
  score_version: string;
  criteria: {
    service_fit: { points: number; max: number; reasoning: string };
    evidence_of_need: { points: number; max: number; reasoning: string };
    decision_maker_access: { points: number; max: number; reasoning: string };
    budget_evidence: { points: number; max: number; reasoning: string };
    timeline_evidence: { points: number; max: number; reasoning: string };
  };
  priority: "high" | "medium" | "low";
  missing_information: string[];
}

export interface OutreachDraftResult {
  subject: string;
  body: string;
  service_recommended: string;
  personalization_points: string[]; // What was used to personalize
  source_context: string; // Source of company info used
}

export interface CompanyRecord {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  location: string | null;
  size_band: string | null;
  description: string | null;
}

export interface ContactRecord {
  id: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
}

export interface AIProvider {
  name: string;
  isAvailable(): Promise<boolean>;
  researchCompany(companyName: string, website?: string): Promise<CompanyResearchResult>;
  scoreLead(company: CompanyRecord, research: CompanyResearchResult): Promise<LeadScoreResult>;
  draftOutreach(
    company: CompanyRecord,
    contact: ContactRecord | null,
    serviceCatalog: ServiceCatalogItem[],
    research: CompanyResearchResult
  ): Promise<OutreachDraftResult>;
}

export interface ServiceCatalogItem {
  name: string;
  description: string;
  base_price: number;
  currency: string;
}
