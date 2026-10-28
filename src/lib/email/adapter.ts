/**
 * Email Adapter Interface for VALTORIX BD OS.
 *
 * All email providers must implement this interface. The abstraction allows
 * switching between mock (testing/demo) and real providers (SMTP, Resend, etc.)
 * without changing business logic.
 *
 * Security: All send operations require a valid, unexpired approval for the
 * exact payload. The adapter itself does not check approvals — that is done
 * by the approval service before calling send().
 */

export interface EmailAddress {
  address: string;
  name?: string;
}

export interface EmailMessage {
  to: EmailAddress | EmailAddress[];
  cc?: EmailAddress | EmailAddress[];
  bcc?: EmailAddress | EmailAddress[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: EmailAddress;
  headers?: Record<string, string>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailSendResult {
  messageId: string;
  status: "sent" | "queued" | "accepted";
  provider: string;
  timestamp: string;
}

export interface EmailAdapter {
  name: string;
  isAvailable(): Promise<boolean>;
  send(message: EmailMessage): Promise<EmailSendResult>;
  verifyConnection?(): Promise<boolean>;
}

/**
 * MockEmailAdapter — Deterministic test adapter that records intended sends
 * without contacting anyone. Safe for demos and CI.
 */

export class MockEmailAdapter implements EmailAdapter {
  name = "mock";
  private sentMessages: EmailMessage[] = [];

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    // Record the message without actually sending
    this.sentMessages.push(message);

    return {
      messageId: `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      status: "queued",
      provider: "mock",
      timestamp: new Date().toISOString(),
    };
  }

  async verifyConnection(): Promise<boolean> {
    return true;
  }

  getSentMessages(): EmailMessage[] {
    return [...this.sentMessages];
  }

  clearSentMessages(): void {
    this.sentMessages = [];
  }
}
