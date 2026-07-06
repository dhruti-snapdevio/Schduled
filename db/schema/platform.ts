import { createId } from '@paralleldrive/cuid2'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const idempotencyKey = pgTable('idempotency_key', {
  id:        text('id').primaryKey().$defaultFn(createId),
  key:       text('key').notNull().unique(),
  result:    text('result'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const newsletterSubscriber = pgTable('newsletter_subscriber', {
  id:        text('id').primaryKey().$defaultFn(createId),
  email:     text('email').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Admin-editable global platform settings (single-org, one admin). Key-value so
// new toggles don't need a migration each time; values are stored as text.
export const appSetting = pgTable('app_setting', {
  key:       text('key').primaryKey(),
  value:     text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
