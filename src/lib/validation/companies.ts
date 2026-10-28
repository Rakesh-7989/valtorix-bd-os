import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  website: z.string().optional().or(z.literal("")),
  industry: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  size_band: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
});

export type CompanyInput = z.infer<typeof companySchema>;

export const companyUpdateSchema = companySchema.partial();
export type CompanyUpdateInput = z.infer<typeof companyUpdateSchema>;
