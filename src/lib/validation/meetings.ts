import { z } from "zod";

export const meetingSchema = z.object({
  deal_id: z.string().uuid("Deal ID is required"),
  title: z.string().min(1, "Meeting title is required"),
  agenda: z.string().optional().or(z.literal("")),
  scheduled_at: z.string().datetime("Scheduled date is required"),
  duration_minutes: z.number().min(15).max(480).default(60),
  status: z
    .enum(["scheduled", "completed", "cancelled", "no_show"])
    .default("scheduled"),
});

export type MeetingInput = z.infer<typeof meetingSchema>;

export const meetingUpdateSchema = meetingSchema.partial();
export type MeetingUpdateInput = z.infer<typeof meetingUpdateSchema>;

export const meetingActionSchema = z.object({
  meeting_id: z.string().uuid("Meeting ID is required"),
  description: z.string().min(1, "Action description is required"),
  owner_id: z.string().uuid("Owner ID is required"),
  due_at: z.string().datetime().optional().or(z.literal("")),
  status: z.enum(["open", "completed", "cancelled"]).default("open"),
});

export type MeetingActionInput = z.infer<typeof meetingActionSchema>;

export const meetingActionUpdateSchema = meetingActionSchema.partial();
export type MeetingActionUpdateInput = z.infer<typeof meetingActionUpdateSchema>;
