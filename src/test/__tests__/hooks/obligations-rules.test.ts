import { describe, it, expect } from "vitest";
import { classifyObligation, AUTO_DETECT_COOLDOWN_MS } from "@/hooks/use-obligations";

const inDays = (d: number) => new Date(Date.now() + d * 86400000).toISOString();

describe("obligation rules", () => {
  it("past due date is overdue", () => expect(classifyObligation({ status: "upcoming", due_date: inDays(-1) })).toBe("overdue"));
  it("due within 7 days is due soon", () => expect(classifyObligation({ status: "upcoming", due_date: inDays(6) })).toBe("soon"));
  it("due after 7 days is upcoming", () => expect(classifyObligation({ status: "upcoming", due_date: inDays(8) })).toBe("upcoming"));
  it("paid stays paid even if overdue", () => expect(classifyObligation({ status: "paid", due_date: inDays(-3) })).toBe("paid"));
  it("auto re-scan waits at least 2 minutes", () => expect(AUTO_DETECT_COOLDOWN_MS).toBe(120000));
});
