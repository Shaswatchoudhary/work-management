import { describe, test, expect } from "vitest";
import { fmtDate, fmtMoney, fmtRel } from "../dateFormatter";

describe("fmtDate", () => {
  test("valid ISO string ko readable date mein convert karta hai", () => {
    const result = fmtDate("2026-06-09T10:30:00.000Z");
    expect(result).toBe("Jun 9, 2026");
  });

  test("Date object bhi accept karta hai", () => {
    const result = fmtDate(new Date("2026-01-01"));
    expect(result).toBe("Jan 1, 2026");
  });

  test("format MMM d yyyy hai", () => {
    const result = fmtDate("2026-12-25T00:00:00.000Z");
    expect(result).toMatch(/^[A-Z][a-z]+ \d+, \d{4}$/);
  });
});

describe("fmtMoney", () => {
  test("number ko INR currency format mein convert karta hai", () => {
    const result = fmtMoney(5000);
    expect(result).toContain("5,000");
  });

  test("zero pe bhi kaam karta hai", () => {
    const result = fmtMoney(0);
    expect(result).toContain("0");
  });

  test("bada number comma ke saath format hota hai", () => {
    const result = fmtMoney(100000);
    expect(result).toContain("1,00,000");
  });

  test("INR symbol ya currency code include hota hai", () => {
    const result = fmtMoney(1000);
    expect(result).toMatch(/₹|INR/);
  });
});

describe("fmtRel", () => {
  test("recent date ke liye relative string return karta hai", () => {
    const recent = new Date(Date.now() - 60 * 1000).toISOString();
    const result = fmtRel(recent);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  test("suffix 'ago' include hota hai past date ke liye", () => {
    const past = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const result = fmtRel(past);
    expect(result).toContain("ago");
  });

  test("Date object bhi accept karta hai", () => {
    const result = fmtRel(new Date(Date.now() - 5000));
    expect(typeof result).toBe("string");
  });
});