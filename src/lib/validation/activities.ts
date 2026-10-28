import { z } from "zod";

export const activitySchema = z.object({
  lead_id: z.string().uuid().optional().or(z.literal("")),
  deal_id: z.string().uuid().optional().or(z.literal("")),
  type: z
    .enum(["call", "email", "meeting", "note", "task", "outreach"])
    .default("note"),
  direction: z.enum(["inbound", "outbound"]).default("outbound"),
  subject: z.string().optional().or(z.literal("")),
  body: z.string().optional().or(z.literal("")),
  occurred_at: z.string().datetime().optional(),
});

export type ActivityInput = z.infer<typeof activitySchema>;

export const activityUpdateSchema = activitySchema.partial();
export type ActivityUpdateInput = z.infer<typeof activityUpdateSchema>;
