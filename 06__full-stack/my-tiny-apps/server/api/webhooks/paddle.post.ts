import crypto from 'node:crypto'
import { eq, or } from 'drizzle-orm'
import { db } from '../../db'
import { downloadTokens, orders, products, webhookEvents } from '../../db/schema'
import { verifyPaddleSignature } from '../../utils/paddleWebhook'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const webhookSecret = config.paddleWebhookSecret

  // 1. Read raw request body
  const rawBody = await readRawBody(event)

  if (!rawBody) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing request body',
    })
  }

  // 2. Read Paddle-Signature header
  const signatureHeader = getHeader(event, 'paddle-signature')

  // 3. Verify signature if webhook secret is configured
  if (webhookSecret) {
    const isValid = verifyPaddleSignature(rawBody, signatureHeader, webhookSecret)
    if (!isValid) {
      console.warn('⚠️ Webhook signature verification failed.')
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid webhook signature',
      })
    }
  } else {
    console.warn(
      '⚠️ PADDLE_WEBHOOK_SECRET is not configured. Skipping signature verification in dev mode.',
    )
  }

  // 4. Parse event
  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid JSON payload',
    })
  }

  const { event_id: eventId, event_type: eventType, data } = payload

  if (!eventId || !eventType) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing event_id or event_type in payload',
    })
  }

  // 5 & 6. Check event_id for idempotency
  const existingEvent = await db
    .select()
    .from(webhookEvents)
    .where(eq(webhookEvents.eventId, eventId))
    .get()

  if (existingEvent) {
    console.log(`ℹ️ Webhook event "${eventId}" already processed. Skipping duplicate.`)
    return {
      received: true,
      status: 'already_processed',
    }
  }

  // 7. Handle transaction.paid (and transaction.completed)
  if (eventType === 'transaction.paid' || eventType === 'transaction.completed') {
    const transactionId = data.id
    const customerId = data.customer_id || data.customer?.id || null
    const customerEmail =
      data.customer?.email ||
      data.details?.customer?.email ||
      data.custom_data?.customer_email ||
      'unknown@customer.local'

    // Parse amount in cents
    const rawAmount =
      data.details?.totals?.total ||
      data.details?.totals?.grand_total ||
      data.totals?.total ||
      data.details?.totals?.subtotal ||
      500

    const amountCents = typeof rawAmount === 'string' ? Math.round(Number.parseFloat(rawAmount) * (rawAmount.includes('.') ? 100 : 1)) : Number(rawAmount)
    const currency = data.currency_code || data.details?.totals?.currency_code || 'USD'

    // Extract item priceId or productId
    const firstItem = data.items?.[0] || data.details?.line_items?.[0]
    const priceId = firstItem?.price?.id || firstItem?.price_id || null
    const paddleProductId = firstItem?.price?.product_id || firstItem?.product_id || null
    const customSlug = data.custom_data?.slug

    // 8. Find matching product in database
    let matchedProduct = await db
      .select()
      .from(products)
      .where(
        or(
          priceId ? eq(products.paddlePriceId, priceId) : undefined,
          paddleProductId ? eq(products.paddleProductId, paddleProductId) : undefined,
          customSlug ? eq(products.slug, customSlug) : undefined,
        ),
      )
      .get()

    // Fallback: If no matching product found, attach to first available product
    if (!matchedProduct) {
      matchedProduct = await db.select().from(products).get()
    }

    if (!matchedProduct) {
      console.error('❌ No products found in database to associate order.')
      throw createError({
        statusCode: 500,
        statusMessage: 'No product record available for fulfillment',
      })
    }

    // 9. Create order
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase()
    const orderNumber = `MTA-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`
    const now = new Date()

    const [newOrder] = await db
      .insert(orders)
      .values({
        orderNumber,
        productId: matchedProduct.id,
        customerEmail,
        paddleTransactionId: transactionId,
        paddleCustomerId: customerId,
        amountCents,
        currency,
        status: 'paid',
        createdAt: now,
        paidAt: now,
      })
      .returning()

    // 10. Generate cryptographically secure download token and hash it
    const rawToken = crypto.randomBytes(32).toString('base64url')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days expiry

    await db.insert(downloadTokens).values({
      orderId: newOrder.id,
      tokenHash,
      expiresAt,
      downloadCount: 0,
      createdAt: now,
    })

    console.log(
      `✅ Order created: ${orderNumber} for ${customerEmail} (Transaction: ${transactionId})`,
    )
  }

  // 11. Record webhook event in webhook_events
  await db.insert(webhookEvents).values({
    eventId,
    eventType,
    processedAt: new Date(),
  })

  // 12. Return HTTP 200
  return {
    received: true,
    eventId,
    eventType,
  }
})

