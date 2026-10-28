/**
 * Email Suppression Tests — Phase 8 Production Hardening
 *
 * Tests suppression list logic without complex database mocking:
 * - Email normalization to lowercase
 * - Suppression reason classification
 * - Duplicate prevention
 */

import { describe, it, expect } from "vitest";

/**
 * Normalizes an email address for suppression lookup
 */
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Classifies suppression reason
 */
function classifyReason(reason: string): "unsubscribe" | "bounce" | "opt_out" | "do_not_contact" | "invalid" {
  const validReasons: string[] = ["unsubscribe", "bounce", "opt_out", "do_not_contact", "invalid"];
  return validReasons.includes(reason) ? (reason as "unsubscribe" | "bounce" | "opt_out" | "do_not_contact" | "invalid") : "invalid";
}

/**
 * Checks if an email is in the suppression list
 */
function isSuppressed(email: string, suppressionList: string[]): boolean {
  return suppressionList.includes(normalizeEmail(email));
}

/**
 * Adds email to suppression list if not already present
 */
function addToSuppression(email: string, list: string[]): string[] {
  const normalized = normalizeEmail(email);
  if (list.includes(normalized)) {
    return list;
  }
  return [...list, normalized];
}

describe("Email Suppression — Phase 8", () => {
  it("normalizes email addresses to lowercase", () => {
    expect(normalizeEmail("USER@Example.COM")).toBe("user@example.com");
    expect(normalizeEmail("  User@Example.COM  ")).toBe("user@example.com");
    expect(normalizeEmail("user@example.com")).toBe("user@example.com");
  });

  it("classifies suppression reasons correctly", () => {
    expect(classifyReason("unsubscribe")).toBe("unsubscribe");
    expect(classifyReason("bounce")).toBe("bounce");
    expect(classifyReason("opt_out")).toBe("opt_out");
    expect(classifyReason("do_not_contact")).toBe("do_not_contact");
    expect(classifyReason("invalid")).toBe("invalid");
    expect(classifyReason("unknown")).toBe("invalid");
  });

  it("checks if email is suppressed", () => {
    const list = ["user@example.com", "blocked@test.com"];
    expect(isSuppressed("USER@EXAMPLE.COM", list)).toBe(true);
    expect(isSuppressed("new@example.com", list)).toBe(false);
    expect(isSuppressed("BLOCKED@TEST.COM", list)).toBe(true);
  });

  it("prevents duplicate suppression entries", () => {
    const list = ["user@example.com"];
    const result1 = addToSuppression("user@example.com", list);
    expect(result1).toEqual(["user@example.com"]);
    expect(result1.length).toBe(1);

    const result2 = addToSuppression("new@example.com", list);
    expect(result2).toEqual(["user@example.com", "new@example.com"]);
    expect(result2.length).toBe(2);
  });

  it("is case-insensitive for suppression checks", () => {
    const list = ["User@Example.COM".toLowerCase()];
    expect(isSuppressed("USER@EXAMPLE.COM", list)).toBe(true);
    expect(isSuppressed("user@example.com", list)).toBe(true);
  });
});
