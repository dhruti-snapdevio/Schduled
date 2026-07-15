import { createId } from "@paralleldrive/cuid2";
import { eq, sql } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { invitation, user } from "@/db/schema";
import { db, dbClient } from "@/lib/db";
import {
  createInvitation,
  findPendingInvitationByEmail,
  findPendingInvitationByToken,
  isValidInvitationRole,
  markInvitationAccepted,
  revokeInvitation,
} from "./invitations";

// Pure — no DB needed. The one thing this must never accept is "owner": an
// invite can only ever carry member/manager, since ownership is assigned at
// setup or via transfer, never via invite (see config/platform.ts OWNER_ROLE).
describe("isValidInvitationRole", () => {
  it("accepts member and manager", () => {
    expect(isValidInvitationRole("member")).toBe(true);
    expect(isValidInvitationRole("manager")).toBe(true);
  });

  it("rejects owner — ownership is never granted via invite", () => {
    expect(isValidInvitationRole("owner")).toBe(false);
  });

  it("rejects unknown strings, empty string, and the old role names", () => {
    expect(isValidInvitationRole("admin")).toBe(false);
    expect(isValidInvitationRole("user")).toBe(false);
    expect(isValidInvitationRole("")).toBe(false);
    expect(isValidInvitationRole("Member")).toBe(false);
  });
});

// Integration tests against the real dev database — same rationale as
// lib/api/rate-limit.test.ts: the whole point is proving the DB-level
// invariants (the partial-unique "one pending invite per email" index, the
// FK to invited_by) actually hold, which an in-memory mock can't verify.
// invitation.invited_by is NOT NULL + FK'd to user.id, so a throwaway inviter
// row is required for the whole suite.

const TEST_EMAIL_PREFIX = "vitest-invite-";
let inviterId: string;

beforeAll(async () => {
  inviterId = createId();
  await db.insert(user).values({
    id: inviterId,
    email: `${TEST_EMAIL_PREFIX}inviter@example.test`,
    name: "Vitest Inviter",
    role: "owner",
  });
});

afterEach(async () => {
  await db.execute(sql`DELETE FROM invitation WHERE email LIKE ${`${TEST_EMAIL_PREFIX}%`}`);
});

afterAll(async () => {
  await db.delete(user).where(eq(user.id, inviterId));
  await dbClient.end();
});

describe("createInvitation", () => {
  it("creates a pending invite with a token, role, and a ~7-day expiry", async () => {
    const email = `${TEST_EMAIL_PREFIX}a@example.test`;
    const before = Date.now();
    const invite = await createInvitation({ email, role: "manager", invitedBy: inviterId });

    expect(invite.email).toBe(email);
    expect(invite.role).toBe("manager");
    expect(invite.status).toBe("pending");
    expect(invite.token).toBeTruthy();
    expect(invite.invitedBy).toBe(inviterId);

    const expiresInMs = invite.expiresAt.getTime() - before;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    expect(expiresInMs).toBeGreaterThan(sevenDaysMs - 5000);
    expect(expiresInMs).toBeLessThan(sevenDaysMs + 5000);
  });

  it("lowercases and trims the email", async () => {
    const invite = await createInvitation({
      email: `  ${TEST_EMAIL_PREFIX}B@Example.Test  `,
      role: "member",
      invitedBy: inviterId,
    });
    expect(invite.email).toBe(`${TEST_EMAIL_PREFIX}b@example.test`);
  });
});

describe("findPendingInvitationByEmail", () => {
  it("finds a pending invite, case-insensitively", async () => {
    const email = `${TEST_EMAIL_PREFIX}c@example.test`;
    await createInvitation({ email, role: "member", invitedBy: inviterId });

    const found = await findPendingInvitationByEmail(email.toUpperCase());
    expect(found?.email).toBe(email);
    expect(found?.role).toBe("member");
  });

  it("returns null when no invite exists for the email", async () => {
    const found = await findPendingInvitationByEmail(`${TEST_EMAIL_PREFIX}nobody@example.test`);
    expect(found).toBeNull();
  });

  it("auto-expires and hides a pending invite past its expiry", async () => {
    const email = `${TEST_EMAIL_PREFIX}expired@example.test`;
    const invite = await createInvitation({ email, role: "member", invitedBy: inviterId });

    // Backdate expiresAt directly — same technique as the rate-limit test's
    // "resets the count once the window has expired" case.
    await db.execute(sql`UPDATE invitation SET expires_at = now() - interval '1 second' WHERE id = ${invite.id}`);

    const found = await findPendingInvitationByEmail(email);
    expect(found).toBeNull();

    // The read-side expiry check should also have flipped the row's status,
    // so a later re-invite of the same email isn't blocked by a stale
    // "pending" row sitting under the partial-unique index.
    const [row] = await db.select().from(invitation).where(eq(invitation.id, invite.id));
    expect(row.status).toBe("expired");
  });
});

describe("findPendingInvitationByToken", () => {
  it("finds a pending invite by its token", async () => {
    const email = `${TEST_EMAIL_PREFIX}d@example.test`;
    const invite = await createInvitation({ email, role: "manager", invitedBy: inviterId });

    const found = await findPendingInvitationByToken(invite.token);
    expect(found?.id).toBe(invite.id);
    expect(found?.email).toBe(email);
  });

  it("returns null for an unknown token", async () => {
    const found = await findPendingInvitationByToken("this-token-does-not-exist");
    expect(found).toBeNull();
  });
});

describe("markInvitationAccepted", () => {
  it("flips status to accepted and records who accepted it", async () => {
    const email = `${TEST_EMAIL_PREFIX}e@example.test`;
    const invite = await createInvitation({ email, role: "member", invitedBy: inviterId });
    // acceptedBy is FK'd to a real user row — reuse the test inviter as the
    // acceptor here since only the write mechanics are under test, not
    // inviter/acceptor identity distinctness.
    const acceptorId = inviterId;

    await markInvitationAccepted(invite.id, acceptorId);

    // Once accepted, it must no longer resolve as pending — the accept page
    // and the signup gate both rely on this to reject token/email reuse.
    expect(await findPendingInvitationByToken(invite.token)).toBeNull();
    expect(await findPendingInvitationByEmail(email)).toBeNull();

    const [row] = await db.select().from(invitation).where(eq(invitation.id, invite.id));
    expect(row.status).toBe("accepted");
    expect(row.acceptedBy).toBe(acceptorId);
    expect(row.acceptedAt).not.toBeNull();
  });
});

describe("revokeInvitation", () => {
  it("flips a pending invite to revoked", async () => {
    const email = `${TEST_EMAIL_PREFIX}f@example.test`;
    const invite = await createInvitation({ email, role: "member", invitedBy: inviterId });

    await revokeInvitation(invite.id);

    expect(await findPendingInvitationByEmail(email)).toBeNull();
    expect(await findPendingInvitationByToken(invite.token)).toBeNull();
  });

  it("is a no-op on an invite that's already accepted (can't un-accept by revoking)", async () => {
    const email = `${TEST_EMAIL_PREFIX}g@example.test`;
    const invite = await createInvitation({ email, role: "member", invitedBy: inviterId });
    await markInvitationAccepted(invite.id, inviterId);

    await revokeInvitation(invite.id);

    const [row] = await db.select().from(invitation).where(eq(invitation.id, invite.id));
    expect(row.status).toBe("accepted");
  });

  it("allows re-inviting the same email after a revoke — the partial-unique index only blocks live pending rows", async () => {
    const email = `${TEST_EMAIL_PREFIX}h@example.test`;
    const first = await createInvitation({ email, role: "member", invitedBy: inviterId });
    await revokeInvitation(first.id);

    // If this throws (unique constraint violation), the partial index's
    // `WHERE status = 'pending'` predicate is broken.
    const second = await createInvitation({ email, role: "manager", invitedBy: inviterId });
    expect(second.id).not.toBe(first.id);

    const found = await findPendingInvitationByEmail(email);
    expect(found?.id).toBe(second.id);
    expect(found?.role).toBe("manager");
  });
});
