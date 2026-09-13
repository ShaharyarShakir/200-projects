import { eq } from 'drizzle-orm'
import { db } from '../db'
import { webhookEvents, type WebhookEventRecord } from '../db/schema'

/**
 * Checks whether a webhook event has already been processed (idempotency check).
 */
export async function isEventProcessed(eventId: string): Promise<boolean> {
  const existingEvent = await db
    .select()
    .from(webhookEvents)
    .where(eq(webhookEvents.eventId, eventId))
    .get()

  return Boolean(existingEvent)
}

/**
 * Records a processed webhook event to the database audit log.
 */
export async function recordWebhookEvent(
  eventId: string,
  eventType: string,
): Promise<WebhookEventRecord> {
  const [recorded] = await db
    .insert(webhookEvents)
    .values({
      eventId,
      eventType,
      processedAt: new Date(),
    })
    .returning()

  return recorded
}
