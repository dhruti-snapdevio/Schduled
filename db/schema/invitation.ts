import { createId } from '@paralleldrive/cuid2'
import { sql } from 'drizzle-orm'
import { index, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { user } from './auth'
import { invitationRoleEnum, invitationStatusEnum } from './enums'

export const invitation = pgTable('invitation', {
  id:         text('id').primaryKey().$defaultFn(createId),
  email:      text('email').notNull(),
  role:       invitationRoleEnum('role').notNull().default('member'),
  token:      text('token').notNull().unique(),
  status:     invitationStatusEnum('status').notNull().default('pending'),
  invitedBy:  text('invited_by').notNull().references(() => user.id, { onDelete: 'cascade' }),
  acceptedBy: text('accepted_by').references(() => user.id, { onDelete: 'set null' }),
  expiresAt:  timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
}, (t) => [
  // Only one *live* invite per email at a time — a revoked/expired/accepted
  // invite must not block re-inviting the same address.
  uniqueIndex('invitation_email_pending_idx').on(t.email).where(sql`status = 'pending'`),
  index('invitation_token_idx').on(t.token),
])
