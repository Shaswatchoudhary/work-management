import { describe, test, expect } from "vitest";
import { verifyPin, formatSignatureTimestamp, generateSecureHash } from "../signatureEngine";

describe("verifyPin", () => {
  test("Return true for correct HR pin", () => {
    expect(verifyPin("u-hr", "1222")).toBe(true);
  });

  test("Return true for correct admin pin", () => {
    expect(verifyPin("u-admin", "1234")).toBe(true);
  });

  test("Return true for correct helpdesk pin", () => {
    expect(verifyPin("u-helpdesk", "4521")).toBe(true);
  });

  test("Return false for incorrect pin", () => {
    expect(verifyPin("u-hr", "0000")).toBe(false);
  });

  test("Return false for invalid user ID", () => {
    expect(verifyPin("invalid-id", "1234")).toBe(false);
  });

  test("Return false for empty PIN", () => {
    expect(verifyPin("u-hr", "")).toBe(false);
  });
});

describe("formatSignatureTimestamp", () => {
  test("Converts ISO string to readable format", () => {
    const result = formatSignatureTimestamp("2026-06-09T10:30:00.000Z");
    expect(typeof result).toBe("string");
    expect(result).toContain("2026");
  });

  test("format contains both date and time", () => {
    const result = formatSignatureTimestamp("2026-06-09T10:30:00.000Z");
    expect(result.length).toBeGreaterThan(10);
  });
});

describe("generateSecureHash", () => {
  test("Return 64 char hex string for valid input", async () => {
    const hash = await generateSecureHash({
      userId: "u-hr",
      ticketId: "TKT-1001",
      purpose: "hr_approval",
      signedAt: "2026-06-09T10:30:00.000Z",
    });
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[A-F0-9]+$/);
  });

  test("Return same hash for same input", async () => {
    const data = {
      userId: "u-hr",
      ticketId: "TKT-1001",
      purpose: "hr_approval",
      signedAt: "2026-06-09T10:30:00.000Z",
    };
    const hash1 = await generateSecureHash(data);
    const hash2 = await generateSecureHash(data);
    expect(hash1).toBe(hash2);
  });

  test("Return different hash for different input", async () => {
    const hash1 = await generateSecureHash({
      userId: "u-hr",
      ticketId: "TKT-1001",
      purpose: "hr_approval",
      signedAt: "2026-06-09T10:30:00.000Z",
    });
    const hash2 = await generateSecureHash({
      userId: "u-admin",
      ticketId: "TKT-1002",
      purpose: "admin_approval",
      signedAt: "2026-06-09T11:00:00.000Z",
    });
    expect(hash1).not.toBe(hash2);
  });
});