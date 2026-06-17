import { createId } from '@paralleldrive/cuid2'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const idempotencyKey = pgTable('idempotency_key', {
  id:        text('id').primaryKey().$defaultFn(createId),
  key:       text('key').notNull().unique(),
  result:    text('result'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
