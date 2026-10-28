import { z } from "zod";

export const dealSchema = z.object({
  lead_id: z.string().uuid("Lead ID is required"),
  company_id: z.string().uuid("Company ID is required"),
  owner_id: z.string().uuid("Owner ID is required"),
  stage: z
    .enum([
      "qualification",
      "proposal",
      "negotiation",
      "closed_won",
      "closed_lost",
    ])
    .default("qualification"),
  currency: z.string().length(3).default("INR"),
  amount: z.number().min(0).default(0),
  expected_close_at: z.string().datetime().optional().or(z.literal("")),
  lost_reason: z.string().optional().or(z.literal("")),
});

export type DealInput = z.infer<typeof dealSchema>;

export const dealUpdateSchema = dealSchema.partial();
export type DealUpdateInput = z.infer<typeof dealUpdateSchema>;
