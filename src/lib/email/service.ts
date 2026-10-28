import { db } from "@/lib/db/client";
import { email_deliveries } from "@/lib/db/schema/email_deliveries";
import { suppression_records } from "@/lib/db/schema/suppression_records";

import { eq, and } from "drizzle-orm";
import { EmailAdapter, EmailMessage } from "./adapter";
import { verifyApproval } from "@/lib/workflow/approval-service";
import { createAuditLog } from "@/lib/workflow/audit-service";

/**
 * Email Delivery Service — handles approval-gated email sending.
 *
 * Safety rules:
 * 1. No email can be sent without a valid, unexpired approval for the exact payload
 * 2. Recipients on the suppression list are skipped
 * 3. All sends are recorded with delivery status
 * 4. Provider errors are captured and retries are tracked
 */

export interface SendEmailInput {
  outreachDraftId: string;
  leadId: string;
  contactId: string;
  approvalId: string;
  recipient: string;
  subject: string;
  body: string;
  provider: "mock" | "smtp";
}

export interface EmailDeliveryRecord {
  id: string;
  status: string;
  messageId: string | null;
  provider: string;
  sentAt: string | null;
  errorMessage: string | null;
}

export class EmailService {
  private adapter: EmailAdapter;

  constructor(adapter: EmailAdapter) {
    this.adapter = adapter;
  }

  /**
   * Check if a recipient is suppressed (unsubscribed, bounced, opt-out, etc.)
   */
  async isSuppressed(recipient: string, channel: string = "email"): Promise<boolean> {
    const [record] = await db
      .select()
      .from(suppression_records)
      .where(
        and(
          eq(suppression_records.normalized_address, recipient.toLowerCase()),
          eq(suppression_records.channel, channel)
        )
      )
      .limit(1);
    return !!record;
  }

  /**
   * Add a recipient to the suppression list.
   */
  async addToSuppression(
    recipient: string,
    reason: string,
    createdBy: string,
    channel: string = "email",
    leadId?: string,
    contactId?: string
  ) {
    const [record] = await db
      .insert(suppression_records)
      .values({
        lead_id: leadId ?? null,
        contact_id: contactId ?? null,
        channel,
        normalized_address: recipient.toLowerCase(),
        reason,
        created_by: createdBy,
      })
      .returning();

    await createAuditLog({
      actorType: "user",
      actorId: createdBy,
      action: "suppression_added",
      entityType: "suppression_record",
      entityId: record.id,
      details: { recipient, reason, channel },
    });

    return record;
  }

  /**
   * Send an email with full approval and suppression checks.
   * This is the only path for sending emails through the system.
   */
  async sendEmail(input: SendEmailInput): Promise<EmailDeliveryRecord> {
    // 1. Verify the approval exists and is valid
    const approvalValid = await verifyApproval(input.approvalId, {
      recipient: input.recipient,
      subject: input.subject,
      body: input.body,
    });

    if (!approvalValid) {
      throw new Error(
        "No valid approval found for this email. Approval may be missing, expired, rejected, or payload may have changed."
      );
    }

    // 2. Check suppression list
    const suppressed = await this.isSuppressed(input.recipient, "email");
    if (suppressed) {
      // Record as suppressed (not sent)
      const [delivery] = await db
        .insert(email_deliveries)
        .values({
          outreach_draft_id: input.outreachDraftId,
          lead_id: input.leadId,
          contact_id: input.contactId,
          approval_id: input.approvalId,
          recipient: input.recipient,
          subject: input.subject,
          body: input.body,
          status: "suppressed",
          provider: this.adapter.name,
          created_at: new Date(),
        })
        .returning();

      await createAuditLog({
        actorType: "system",
        actorId: "email-service",
        action: "email_suppressed",
        entityType: "email_delivery",
        entityId: delivery.id,
        details: { recipient: input.recipient, reason: "suppressed" },
      });

      return {
        id: delivery.id,
        status: "suppressed",
        messageId: null,
        provider: this.adapter.name,
        sentAt: null,
        errorMessage: null,
      };
    }

    // 3. Compose the email message
    const message: EmailMessage = {
      to: { address: input.recipient },
      subject: input.subject,
      text: input.body,
      html: input.body,
    };

    // 4. Send via the adapter
    let sendResult;
    try {
      sendResult = await this.adapter.send(message);
    } catch (error) {
      // Record the failure
      const [delivery] = await db
        .insert(email_deliveries)
        .values({
          outreach_draft_id: input.outreachDraftId,
          lead_id: input.leadId,
          contact_id: input.contactId,
          approval_id: input.approvalId,
          recipient: input.recipient,
          subject: input.subject,
          body: input.body,
          status: "failed",
          provider: this.adapter.name,
          error_message: error instanceof Error ? error.message : "Unknown error",
          created_at: new Date(),
        })
        .returning();

      await createAuditLog({
        actorType: "system",
        actorId: "email-service",
        action: "email_send_failed",
        entityType: "email_delivery",
        entityId: delivery.id,
        details: { recipient: input.recipient, error: error instanceof Error ? error.message : "Unknown" },
      });

      throw new Error(
        `Email send failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    // 5. Record successful delivery
    const [delivery] = await db
      .insert(email_deliveries)
      .values({
        outreach_draft_id: input.outreachDraftId,
        lead_id: input.leadId,
        contact_id: input.contactId,
        approval_id: input.approvalId,
        recipient: input.recipient,
        subject: input.subject,
        body: input.body,
        status: "sent",
        provider: this.adapter.name,
        provider_message_id: sendResult.messageId,
        sent_at: new Date(),
        created_at: new Date(),
      })
      .returning();

    await createAuditLog({
      actorType: "system",
      actorId: "email-service",
      action: "email_sent",
      entityType: "email_delivery",
      entityId: delivery.id,
      details: {
        recipient: input.recipient,
        messageId: sendResult.messageId,
        provider: sendResult.provider,
      },
    });

    return {
      id: delivery.id,
      status: "sent",
      messageId: sendResult.messageId,
      provider: sendResult.provider,
      sentAt: delivery.sent_at?.toISOString() ?? null,
      errorMessage: null,
    };
  }

  /**
   * Get delivery status for a specific delivery.
   */
  async getDelivery(deliveryId: string) {
    const [delivery] = await db
      .select()
      .from(email_deliveries)
      .where(eq(email_deliveries.id, deliveryId))
      .limit(1);
    return delivery;
  }

  /**
   * Get all deliveries for a lead.
   */
  async getDeliveriesForLead(leadId: string) {
    return await db
      .select()
      .from(email_deliveries)
      .where(eq(email_deliveries.lead_id, leadId))
      .orderBy(email_deliveries.created_at);
  }

  /**
   * Get all deliveries for an outreach draft.
   */
  async getDeliveriesForDraft(draftId: string) {
    return await db
      .select()
      .from(email_deliveries)
      .where(eq(email_deliveries.outreach_draft_id, draftId))
      .orderBy(email_deliveries.created_at);
  }

  /**
   * Retry a failed delivery (requires new approval).
   */
  async retryDelivery(deliveryId: string, newApprovalId: string) {
    const [delivery] = await db
      .select()
      .from(email_deliveries)
      .where(eq(email_deliveries.id, deliveryId))
      .limit(1);

    if (!delivery) {
      throw new Error("Delivery not found");
    }

    if (delivery.status !== "failed") {
      throw new Error(`Cannot retry delivery with status ${delivery.status}`);
    }

    // Verify new approval
    const approvalValid = await verifyApproval(newApprovalId, {
      recipient: delivery.recipient,
      subject: delivery.subject,
      body: delivery.body,
    });

    if (!approvalValid) {
      throw new Error("No valid approval for retry");
    }

    // Increment retry count
    await db
      .update(email_deliveries)
      .set({
        retry_count: delivery.retry_count + 1,
        status: "pending",
        error_message: null,
        sent_at: null,
        provider_message_id: null,
      })
      .where(eq(email_deliveries.id, deliveryId))
      .returning();

    // Re-send
    return this.sendEmail({
      outreachDraftId: delivery.outreach_draft_id,
      leadId: delivery.lead_id,
      contactId: delivery.contact_id,
      approvalId: newApprovalId,
      recipient: delivery.recipient,
      subject: delivery.subject,
      body: delivery.body,
      provider: this.adapter.name as "mock" | "smtp",
    });
  }
}
