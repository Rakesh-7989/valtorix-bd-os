import { db } from "@/lib/db/client";
import { companies } from "@/lib/db/schema/companies";
import { leads } from "@/lib/db/schema/leads";
import { contacts } from "@/lib/db/schema/contacts";
import { lead_scores } from "@/lib/db/schema/lead_scores";
import { research_records } from "@/lib/db/schema/research_records";
import { outreach_drafts } from "@/lib/db/schema/outreach_drafts";
import { eq } from "drizzle-orm";
import {
  getAIProvider,
  getAvailableAIProvider,
  type AIProvider,
} from "./adapter";
import type {
  CompanyResearchResult,
  LeadScoreResult,
  OutreachDraftResult,
  CompanyRecord,
  ContactRecord,
  ServiceCatalogItem,
} from "./provider";

/**
 * Service Catalog — approved services that can be offered to leads.
 * Pricing is deterministic and stored here (not invented by AI).
 */

export const SERVICE_CATALOG: ServiceCatalogItem[] = [
  {
    name: "Website Development",
    description: "Custom website development for architecture and design firms",
    base_price: 75000,
    currency: "INR",
  },
  {
    name: "AI Workflow Automation",
    description: "AI-powered workflow automation for business processes",
    base_price: 150000,
    currency: "INR",
  },
  {
    name: "SaaS Product Development",
    description: "Custom SaaS product development and deployment",
    base_price: 300000,
    currency: "INR",
  },
  {
    name: "Mobile App Development",
    description: "iOS and Android mobile application development",
    base_price: 200000,
    currency: "INR",
  },
];

export type ServiceCatalogItemType = (typeof SERVICE_CATALOG)[number];

/**
 * AI Service — orchestrates research, scoring, and outreach drafting.
 * All AI outputs are saved to the database with full audit trail.
 */

export class AIService {
  private provider: AIProvider;

  constructor() {
    this.provider = getAIProvider();
  }

  /**
   * Step 1: Research a company using AI.
   * Saves research to research_records table.
   */
  async researchCompany(companyId: string): Promise<CompanyResearchResult> {
    // Get the company from the database
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company) {
      throw new Error(`Company ${companyId} not found`);
    }

    // Check if Ollama is available (re-check each time)
    const availableProvider = await getAvailableAIProvider();
    this.provider = availableProvider;

    // Research using the AI provider
    const research = await this.provider.researchCompany(
      company.name,
      company.website || undefined
    );

    // Save to research_records
    await db.insert(research_records).values({
      company_id: companyId,
      provider: this.provider.name,
      research_json: JSON.stringify(research),
      verified: research.verified,
    });

    return research;
  }

  /**
   * Step 2: Score a lead using deterministic rule-based scoring + AI input.
   * The scoring arithmetic is deterministic — AI only provides input.
   * Saves to lead_scores table.
   */
  async scoreLead(leadId: string): Promise<LeadScoreResult> {
    // Get the lead with company and contact
    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);

    if (!lead) {
      throw new Error(`Lead ${leadId} not found`);
    }

    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, lead.company_id))
      .limit(1);

    if (!company) {
      throw new Error(`Company for lead ${leadId} not found`);
    }

    // Get the latest research for this company
    const [researchRecord] = await db
      .select()
      .from(research_records)
      .where(eq(research_records.company_id, lead.company_id))
      .orderBy(research_records.created_at)
      .limit(1);

    let research: CompanyResearchResult;
    if (researchRecord) {
      research = JSON.parse(researchRecord.research_json);
    } else {
      // No research yet — do it now
      research = await this.researchCompany(lead.company_id);
    }

    // Get AI provider (re-check availability)
    const availableProvider = await getAvailableAIProvider();
    this.provider = availableProvider;

    // Map company to CompanyRecord type
    const companyRecord: CompanyRecord = {
      id: company.id,
      name: company.name,
      website: company.website,
      industry: company.industry,
      location: company.location,
      size_band: company.size_band,
      description: null,
    };

    // Score using AI provider
    const scoreResult = await this.provider.scoreLead(
      companyRecord,
      research
    );

    // Save to lead_scores
    await db.insert(lead_scores).values({
      lead_id: leadId,
      score_version: scoreResult.score_version,
      score: scoreResult.score,
      reasoning_json: JSON.stringify({
        criteria: scoreResult.criteria,
        priority: scoreResult.priority,
        missing_information: scoreResult.missing_information,
      }),
      priority: scoreResult.priority,
    });

    // Update lead score
    await db
      .update(leads)
      .set({
        score: scoreResult.score,
        score_reasons_json: JSON.stringify(scoreResult.criteria),
        updated_at: new Date(),
      })
      .where(eq(leads.id, leadId));

    return scoreResult;
  }

  /**
   * Step 3: Generate personalized outreach draft.
   * Saves to outreach_drafts table with status 'pending' (awaiting approval).
   */
  async draftOutreach(
    leadId: string,
    contactId?: string
  ): Promise<OutreachDraftResult> {
    // Get the lead
    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);

    if (!lead) {
      throw new Error(`Lead ${leadId} not found`);
    }

    // Get company
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, lead.company_id))
      .limit(1);

    if (!company) {
      throw new Error(`Company for lead ${leadId} not found`);
    }

    // Get contact
    let contact: ContactRecord | null = null;
    if (contactId) {
      const [c] = await db
        .select()
        .from(contacts)
        .where(eq(contacts.id, contactId))
        .limit(1);
      if (c) {
        contact = {
          id: c.id,
          name: c.name,
          title: c.title,
          email: c.email,
          phone: c.phone,
        };
      }
    } else if (lead.primary_contact_id) {
      const [c] = await db
        .select()
        .from(contacts)
        .where(eq(contacts.id, lead.primary_contact_id))
        .limit(1);
      if (c) {
        contact = {
          id: c.id,
          name: c.name,
          title: c.title,
          email: c.email,
          phone: c.phone,
        };
      }
    }

    // Get latest research
    const [researchRecord] = await db
      .select()
      .from(research_records)
      .where(eq(research_records.company_id, lead.company_id))
      .orderBy(research_records.created_at)
      .limit(1);

    let research: CompanyResearchResult;
    if (researchRecord) {
      research = JSON.parse(researchRecord.research_json);
    } else {
      research = await this.researchCompany(lead.company_id);
    }

    // Get AI provider
    const availableProvider = await getAvailableAIProvider();
    this.provider = availableProvider;

    // Map company to CompanyRecord type
    const companyRecord: CompanyRecord = {
      id: company.id,
      name: company.name,
      website: company.website,
      industry: company.industry,
      location: company.location,
      size_band: company.size_band,
      description: null,
    };

    // Draft outreach using AI
    const draft = await this.provider.draftOutreach(
      companyRecord,
      contact,
      SERVICE_CATALOG,
      research
    );

    // Save to outreach_drafts (pending approval)
    await db.insert(outreach_drafts).values({
      lead_id: leadId,
      contact_id: contactId ?? lead.primary_contact_id ?? null,
      provider: this.provider.name,
      subject: draft.subject,
      body: draft.body,
      service_recommended: draft.service_recommended,
      personalization_json: JSON.stringify(draft.personalization_points),
      source_context: draft.source_context,
      status: "pending",
    });

    return draft;
  }

  /**
   * Get the service catalog (deterministic, not AI-generated).
   */
  getServiceCatalog(): ServiceCatalogItem[] {
    return SERVICE_CATALOG;
  }
}
