import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins/admin";
import { magicLink } from "better-auth/plugins/magic-link";
import { eq } from "drizzle-orm";
import { ADMIN_ROLE, PRODUCT_NAME } from "@/config/platform";
import * as schema from "@/db/schema";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { enqueueEmail } from "@/lib/email";
import { magicLinkTemplate } from "@/lib/email/templates/magic-link";
import { env } from "@/lib/env";

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
  },
  plugins: [
    admin({
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
        // close later". Returning false blocks creation (surfaces as a clean
        // BAD_REQUEST to the client).
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
              .set({ role: ADMIN_ROLE, updatedAt: new Date() })
              .where(eq(schema.user.id, user.id));

            await audit({
              action: "user.role_changed",
              actorEmail: user.email,
              actorId: user.id,
              description: `${user.email} auto-promoted to admin via INITIAL_ADMIN_EMAIL`,
              entityId: user.id,
              entityType: "user",
            });
          }
        },
      },
    },
  },
});
