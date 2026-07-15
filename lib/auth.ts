import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { admin } from "better-auth/plugins/admin";
import { adminAc, userAc } from "better-auth/plugins/admin/access";
import { magicLink } from "better-auth/plugins/magic-link";
import { eq } from "drizzle-orm";
import {
  MANAGER_ROLE,
  MAX_PASSWORD_LENGTH,
  MEMBER_ROLE,
  MIN_PASSWORD_LENGTH,
  OWNER_ROLE,
  PANEL_ROLES,
  PRODUCT_NAME,
} from "@/config/platform";
import * as schema from "@/db/schema";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { enqueueEmail } from "@/lib/email";
import { magicLinkTemplate } from "@/lib/email/templates/magic-link";
import { resetPasswordTemplate } from "@/lib/email/templates/reset-password";
import { env } from "@/lib/env";
import { findPendingInvitationByEmail, markInvitationAccepted } from "@/lib/invitations";
import { createNotification } from "@/lib/notifications/create";
import { getEffectiveSignInMethods } from "@/lib/settings/sign-in-methods";

// Password sign-in / sign-up / reset all funnel through these paths.
const PASSWORD_PATHS = new Set([
  "/sign-in/email",
  "/sign-up/email",
  "/request-password-reset",
]);

export const googleAuthEnabled = !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
export const passwordAuthEnabled = env.NEXT_PUBLIC_PASSWORD_AUTH_ENABLED;

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  secret: env.APP_SECRET,
  baseURL: env.NEXT_PUBLIC_APP_URL,
  trustedOrigins: [
    ...(env.NODE_ENV === "development" ? ["http://localhost:3000"] : []),
    env.NEXT_PUBLIC_APP_URL,
  ],
  // Throttle auth endpoints — without this, /sign-in/email is brute-forceable
  // and /request-password-reset + /sign-in/magic-link can be used to bomb any
  // address with unlimited outbound email. In-memory limiter (per node), which
  // is sufficient for a single-node self-hosted deployment.
  rateLimit: {
    enabled: true,
    window: 60,
    max: 30,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 300, max: 5 },
      "/request-password-reset": { window: 300, max: 3 },
      "/sign-in/magic-link": { window: 300, max: 3 },
    },
  },
  account: {
    accountLinking: {
      // Magic link never creates a row in the account table, so Google is
      // always the "only" account entry. Allow unlinking it — the user can
      // still sign in via magic link at any time.
      allowUnlinkingAll: true,
    },
  },
  ...(googleAuthEnabled
    ? {
        socialProviders: {
          google: {
            clientId: env.GOOGLE_CLIENT_ID as string,
            clientSecret: env.GOOGLE_CLIENT_SECRET as string,
          },
        },
      }
    : {}),
  emailAndPassword: {
    enabled: passwordAuthEnabled,
    minPasswordLength: MIN_PASSWORD_LENGTH,
    maxPasswordLength: MAX_PASSWORD_LENGTH,
    // Delivered the same way as magic links: enqueued to the outbox → worker →
    // SMTP (or logged to the server console if no SMTP is configured).
    sendResetPassword: async ({ user, url }) => {
      const { html, text } = await resetPasswordTemplate({
        email: user.email,
        resetUrl: url,
      });

      await enqueueEmail({
        to: user.email,
        subject: `Reset your ${PRODUCT_NAME} password`,
        html,
        text,
      });

      await audit({
        action: "auth.password_reset_requested",
        actorEmail: user.email,
        actorId: user.id,
        description: `Password reset link sent to ${user.email}`,
        entityType: "user",
        entityId: user.id,
        metadata: { email: user.email },
      });
    },
  },
  // Server-side enforcement of the admin's "Sign-in Methods" toggles. The UI
  // hides disabled methods, but this is what actually blocks a direct API call
  // to a disabled method (defense in depth, not just cosmetic).
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const path = ctx.path;
      const needsPassword = PASSWORD_PATHS.has(path);
      const needsMagicLink = path === "/sign-in/magic-link";
      const isGoogleSocial =
        path === "/sign-in/social" &&
        (ctx.body as { provider?: string } | undefined)?.provider === "google";
      if (!needsPassword && !needsMagicLink && !isGoogleSocial) return;

      // Fail open: a transient error reading the toggles must not turn into a
      // login outage. This is defense-in-depth over the UI, not the only gate.
      let methods: Awaited<ReturnType<typeof getEffectiveSignInMethods>>;
      try {
        methods = await getEffectiveSignInMethods();
      } catch {
        return;
      }
      if (needsPassword && !methods.password) {
        throw new APIError("FORBIDDEN", {
          message: "Email & password sign-in is currently disabled.",
        });
      }
      if (needsMagicLink && !methods.magicLink) {
        throw new APIError("FORBIDDEN", {
          message: "Magic link sign-in is currently disabled.",
        });
      }
      if (isGoogleSocial && !methods.google) {
        throw new APIError("FORBIDDEN", {
          message: "Google sign-in is currently disabled.",
        });
      }
    }),
  },
  plugins: [
    admin({
      // Better Auth's admin plugin defaults to a single "admin" role backed
      // by its own `roles` access-control map (keyed "admin"/"user") — our
      // workspace model uses three different role names, so `adminRoles`
      // must be paired with a matching `roles` map or the plugin rejects it
      // at boot ("Invalid admin roles"). Owner and manager both get full
      // admin-plugin permissions (ban/impersonate/etc. — panel access is
      // still gated separately by PANEL_ROLES in lib/authz.ts); member gets
      // none. See docs/self-hosting/boss-employee-flow.md §4.
      adminRoles: [...PANEL_ROLES],
      roles: {
        [OWNER_ROLE]: adminAc,
        [MANAGER_ROLE]: adminAc,
        [MEMBER_ROLE]: userAc,
      },
      impersonationSessionDuration: 3600,
      allowImpersonatingAdmins: false,
    }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        const { html, text } = await magicLinkTemplate({
          email,
          magicLinkUrl: url,
        });

        await enqueueEmail({
          to: email,
          subject: `Sign in to ${PRODUCT_NAME}`,
          html,
          text,
        });

        await audit({
          action: "auth.magic_link_sent",
          actorEmail: email,
          description: `Magic link sent to ${email}`,
          entityType: "user",
          metadata: { email },
        });
      },
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    // Magic-link auth has no re-authentication flow, so disable the freshness
    // gate that would block unlinkAccount / other sensitive ops for old sessions.
    freshAge: 0,
    cookieCache: {
      enabled: true,
      maxAge: 60,
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Gates ALL new-account creation (password sign-up, magic link
        // first-use, Google first-login all funnel through this hook) —
        // the bootstrap admin always gets through regardless of SIGNUP_ENABLED,
        // so it's safe to close signup from day one rather than "open then
        // close later". A pending, unexpired invitation for this exact email
        // also gets through — that's the only other door into the workspace
        // (invite-only, no public signup). Returning false blocks creation
        // (surfaces as a clean BAD_REQUEST to the client).
        before: async (user) => {
          if (env.SIGNUP_ENABLED) {
            return;
          }

          const isBootstrapAdmin =
            env.INITIAL_ADMIN_EMAIL &&
            user.email.toLowerCase() === env.INITIAL_ADMIN_EMAIL.toLowerCase();
          if (isBootstrapAdmin) {
            return;
          }

          const invitation = await findPendingInvitationByEmail(user.email);
          if (invitation) {
            return;
          }

          return false;
        },
        after: async (user) => {
          await audit({
            action: "user.created",
            actorEmail: user.email,
            actorId: user.id,
            description: `User created: ${user.email}`,
            entityId: user.id,
            entityType: "user",
          });

          // Self-hosted first-run bootstrap: auto-promote the operator's
          // designated admin email the moment that account is created.
          // Checked once at signup only — demoting later via the admin
          // panel is not overridden by a later sign-in.
          if (
            env.INITIAL_ADMIN_EMAIL &&
            user.email.toLowerCase() === env.INITIAL_ADMIN_EMAIL.toLowerCase()
          ) {
            await db
              .update(schema.user)
              .set({ role: OWNER_ROLE, updatedAt: new Date() })
              .where(eq(schema.user.id, user.id));

            await audit({
              action: "user.role_changed",
              actorEmail: user.email,
              actorId: user.id,
              description: `${user.email} auto-promoted to owner via INITIAL_ADMIN_EMAIL`,
              entityId: user.id,
              entityType: "user",
            });
            return;
          }

          // Invited account: the invitation — not the auth method used to
          // sign up — decides the role. Works the same whether they came in
          // via magic link, password, or Google.
          const invitation = await findPendingInvitationByEmail(user.email);
          if (invitation) {
            await db
              .update(schema.user)
              .set({ role: invitation.role, updatedAt: new Date() })
              .where(eq(schema.user.id, user.id));

            await markInvitationAccepted(invitation.id, user.id);

            await audit({
              action: "invitation.accepted",
              actorEmail: user.email,
              actorId: user.id,
              description: `${user.email} accepted an invitation as ${invitation.role}`,
              entityId: invitation.id,
              entityType: "invitation",
              metadata: { role: invitation.role, invitedBy: invitation.invitedBy },
            });

            await createNotification({
              userId: invitation.invitedBy,
              type: "member_joined",
              title: `${user.name || user.email} joined the workspace`,
              body: `Joined as ${invitation.role === MANAGER_ROLE ? "Manager" : "Member"}.`,
            });
          }
        },
      },
    },
  },
});
