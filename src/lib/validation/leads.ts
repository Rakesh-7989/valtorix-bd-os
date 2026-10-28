import { z } from "zod";

export const leadSchema = z.object({
  company_id: z.string().uuid("Company ID is required"),
  primary_contact_id: z.string().uuid().optional().or(z.literal("")),
  owner_id: z.string().uuid("Owner ID is required"),
  source: z
    .enum(["csv", "manual", "website", "api", "referral"])
    .default("manual"),
  status: z
    .enum([
      "new",
      "contacted",
      "qualified",
      "proposal",
      "negotiation",
      "won",
      "lost",
      "nurture",
    ])
    .default("new"),
  score: z.number().min(0).max(100).default(0),
  score_reasons_json: z.string().optional().or(z.literal("")),
  next_action_at: z.string().datetime().optional().or(z.literal("")),
});

export type LeadInput = z.infer<typeof leadSchema>;

export const leadUpdateSchema = leadSchema.partial();
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;
