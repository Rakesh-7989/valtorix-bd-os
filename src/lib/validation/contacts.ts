import { z } from "zod";

export const contactSchema = z.object({
  company_id: z.string().uuid("Company ID is required"),
  name: z.string().min(1, "Contact name is required"),
  title: z.string().optional().or(z.literal("")),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  consent_status: z
    .enum(["unknown", "granted", "denied"])
    .default("unknown"),
  do_not_contact: z.boolean().default(false),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const contactUpdateSchema = contactSchema.partial();
export type ContactUpdateInput = z.infer<typeof contactUpdateSchema>;
