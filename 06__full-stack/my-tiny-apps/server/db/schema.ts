import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  priceCents: integer('price_cents').notNull(),
  currency: text('currency').notNull().default('USD'),
  paddleProductId: text('paddle_product_id'),
  paddlePriceId: text('paddle_price_id'),
  gitlabProjectId: text('gitlab_project_id'),
  gitlabReleaseTag: text('gitlab_release_tag'),
  status: text('status').notNull().default('coming-soon'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderNumber: text('order_number').notNull().unique(),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  customerEmail: text('customer_email').notNull(),
  paddleTransactionId: text('paddle_transaction_id').notNull().unique(),
  paddleCustomerId: text('paddle_customer_id'),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  paidAt: integer('paid_at', { mode: 'timestamp' }),
})

export const webhookEvents = sqliteTable('webhook_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  eventId: text('event_id').notNull().unique(),
  eventType: text('event_type').notNull(),
  processedAt: integer('processed_at', { mode: 'timestamp' }).notNull(),
})

export const downloadTokens = sqliteTable('download_tokens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  downloadCount: integer('download_count').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export type ProductRecord = typeof products.$inferSelect
export type NewProductRecord = typeof products.$inferInsert

export type OrderRecord = typeof orders.$inferSelect
export type NewOrderRecord = typeof orders.$inferInsert

export type WebhookEventRecord = typeof webhookEvents.$inferSelect
export type NewWebhookEventRecord = typeof webhookEvents.$inferInsert

export type DownloadTokenRecord = typeof downloadTokens.$inferSelect
export type NewDownloadTokenRecord = typeof downloadTokens.$inferInsert

