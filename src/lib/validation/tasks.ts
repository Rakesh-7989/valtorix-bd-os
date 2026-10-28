import { z } from "zod";

export const taskSchema = z.object({
  lead_id: z.string().uuid().optional().or(z.literal("")),
  deal_id: z.string().uuid().optional().or(z.literal("")),
  owner_id: z.string().uuid("Owner ID is required"),
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional().or(z.literal("")),
  due_at: z.string().datetime("Due date is required"),
  status: z
    .enum(["pending", "completed", "cancelled"])
    .default("pending"),
});

export type TaskInput = z.infer<typeof taskSchema>;

export const taskUpdateSchema = taskSchema.partial();
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
