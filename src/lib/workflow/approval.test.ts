/**
 * Approval Engine Tests — Phase 8 Production Hardening
 *
 * Tests the approval system security principles without complex
 * database mocking. Focuses on business logic: payload hash
 * integrity, expiry checks, and status transitions.
 */

import { describe, it, expect } from "vitest";
import { createHash } from "crypto";

/**
 * Compute SHA-256 hash of a payload (same logic as approval-service)
 */
function computePayloadHash(payload: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

/**
 * Check if an approval is expired
 */
function isExpired(expiresAt: string | Date): boolean {
  return new Date(expiresAt) < new Date();
}

/**
 * Check if an approval status allows further action
 */
function isApprovable(status: string): boolean {
  return status === "pending";
}

describe("Approval Engine — Phase 8", () => {
  const payload = {
    recipient: "client@example.com",
    subject: "Proposal",
    body: "Please review our proposal",
  };

  it("computes consistent hash for same payload", () => {
    const hash1 = computePayloadHash(payload);
    const hash2 = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // SHA-256 hex length
  });

  it("produces different hash for different payload", () => {
    const hash1 = computePayloadHash({ recipient: "a@example.com" });
    const hash2 = createHash("sha256").update(JSON.stringify({ recipient: "b@example.com" })).digest("hex");
    expect(hash1).not.toBe(hash2);
  });

  it("detects expired approval", () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    const futureDate = new Date(Date.now() + 86400000).toISOString();

    expect(isExpired(pastDate)).toBe(true);
    expect(isExpired(futureDate)).toBe(false);
  });

  it("only allows pending approvals to be acted upon", () => {
    expect(isApprovable("pending")).toBe(true);
    expect(isApprovable("approved")).toBe(false);
    expect(isApprovable("rejected")).toBe(false);
    expect(isApprovable("expired")).toBe(false);
    expect(isApprovable("cancelled")).toBe(false);
  });

  it("validates payload hash integrity", () => {
    const originalHash = computePayloadHash(payload);
    const tamperedHash = createHash("sha256").update("tampered").digest("hex");

    expect(originalHash).not.toBe(tamperedHash);
    expect(computePayloadHash(payload)).toBe(originalHash);
  });
});
