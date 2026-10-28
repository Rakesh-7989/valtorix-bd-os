import { z } from "zod";

export const handoverSchema = z.object({
  deal_id: z.string().uuid("Deal ID is required"),
  scope_json: z.string().optional().or(z.literal("")),
  requirements_json: z.string().optional().or(z.literal("")),
  delivery_notes: z.string().optional().or(z.literal("")),
  status: z.enum(["pending", "completed"]).default("pending"),
});

export type HandoverInput = z.infer<typeof handoverSchema>;

export const handoverUpdateSchema = handoverSchema.partial();
export type HandoverUpdateInput = z.infer<typeof handoverUpdateSchema>;
