import { z } from "zod";

export const proposalItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0).default(1),
  unit_price: z.number().min(0),
});

export type ProposalItemInput = z.infer<typeof proposalItemSchema>;

export const proposalSchema = z.object({
  deal_id: z.string().uuid("Deal ID is required"),
  items: z.array(proposalItemSchema).min(1, "At least one line item is required"),
  tax_rate: z.number().min(0).max(100).default(18), // GST default 18%
  currency: z.string().length(3).default("INR"),
});

export type ProposalInput = z.infer<typeof proposalSchema>;

export const proposalUpdateSchema = proposalSchema.partial();
export type ProposalUpdateInput = z.infer<typeof proposalUpdateSchema>;

export const proposalStatusSchema = z.object({
  status: z.enum(["draft", "sent", "approved", "rejected", "expired"]),
});

export type ProposalStatusInput = z.infer<typeof proposalStatusSchema>;
