import { describe, expect, it } from "vitest";
import { canActOnRole, isPanelRole } from "./roles";

// canActOnRole is the authorization boundary for every member-management
// action (suspend, delete, impersonate, cancel booking, delete event type —
// see app/actions/orbit-users.ts) plus the UI's row-level action gating
// (components/orbit/users-table.tsx). A wrong answer here is a privilege
// escalation, not a cosmetic bug — the owner must never be actionable, and a
// manager must never be able to act on another manager.
describe("isPanelRole", () => {
  it("is true for owner and manager", () => {
    expect(isPanelRole("owner")).toBe(true);
    expect(isPanelRole("manager")).toBe(true);
  });

  it("is false for member, unknown roles, null, and undefined", () => {
    expect(isPanelRole("member")).toBe(false);
    expect(isPanelRole("user")).toBe(false);
    expect(isPanelRole("admin")).toBe(false);
    expect(isPanelRole(null)).toBe(false);
    expect(isPanelRole(undefined)).toBe(false);
  });
});

describe("canActOnRole", () => {
  it("the owner can act on managers and members", () => {
    expect(canActOnRole("owner", "manager")).toBe(true);
    expect(canActOnRole("owner", "member")).toBe(true);
  });

  it("nobody can act on the owner — not even another owner", () => {
    expect(canActOnRole("owner", "owner")).toBe(false);
    expect(canActOnRole("manager", "owner")).toBe(false);
    expect(canActOnRole("member", "owner")).toBe(false);
  });

  it("a manager can act on a member", () => {
    expect(canActOnRole("manager", "member")).toBe(true);
  });

  it("a manager cannot act on another manager — only the owner can", () => {
    expect(canActOnRole("manager", "manager")).toBe(false);
  });

  // In practice a "member" actor never reaches this check — every call site
  // is gated behind requireAdmin() first (owner|manager only), so this just
  // documents the function's actual domain: it only judges the target,
  // trusting the caller already verified the actor holds a panel role.
  it("only judges the target — a non-panel actor isn't rejected on its own", () => {
    expect(canActOnRole("member", "manager")).toBe(false);
    expect(canActOnRole("member", "member")).toBe(true);
  });

  it("treats a null/undefined target role as a plain member (actionable)", () => {
    expect(canActOnRole("owner", null)).toBe(true);
    expect(canActOnRole("manager", undefined)).toBe(true);
  });
});
