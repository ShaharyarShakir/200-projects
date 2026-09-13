import { verifyPaddleSignature } from '../../utils/paddleWebhook'
import { isEventProcessed, recordWebhookEvent } from '../../services/webhook.service'
import { findProductByPaddleInfo, getFirstActiveProduct } from '../../services/product.service'
import { createOrder } from '../../services/order.service'
import { createDownloadToken } from '../../services/token.service'

interface PaddleWebhookPayload {
  event_id?: string
  event_type?: string
  data?: {
    id?: string
    customer_id?: string | null
    customer?: {
      id?: string
      email?: string
      name?: string
    }
    details?: {
      customer?: {
        email?: string
      }
      totals?: {
        total?: string | number
        grand_total?: string | number
        currency_code?: string
      }
      line_items?: Array<{
        price_id?: string
        product_id?: string
        price?: {
          id?: string
          product_id?: string
        }
      }>
    }
    totals?: {
      total?: string | number
    }
    custom_data?: {
      customer_email?: string
      slug?: string
    }
    currency_code?: string
    items?: Array<{
      price_id?: string
      product_id?: string
      price?: {
        id?: string
        product_id?: string
      }
    }>
  }
}

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

  // 2. Read Paddle-Signature header and verify if secret is set
  const signatureHeader = getHeader(event, 'paddle-signature')
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

  // 3. Parse JSON payload
  let payload: PaddleWebhookPayload
  try {
    payload = JSON.parse(rawBody) as PaddleWebhookPayload
  } catch {
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

  // 4. Idempotency check via WebhookService
  const alreadyProcessed = await isEventProcessed(eventId)
  if (alreadyProcessed) {
    console.log(`ℹ️ Webhook event "${eventId}" already processed. Skipping duplicate.`)
    return {
      received: true,
      status: 'already_processed',
    }
  }

  // 5. Handle payment completion events
  if (eventType === 'transaction.paid' || eventType === 'transaction.completed') {
    const transactionId = data.id
    const customerId = data.customer_id || data.customer?.id || null
    const customerEmail =
      data.customer?.email ||
      data.details?.customer?.email ||
      data.custom_data?.customer_email ||
      'unknown@customer.local'

    // Extract amount in cents
    const rawAmount =
      data.details?.totals?.total ||
      data.details?.totals?.grand_total ||
      data.totals?.total ||
      data.details?.totals?.subtotal ||
      500

    const amountCents =
      typeof rawAmount === 'string'
        ? Math.round(Number.parseFloat(rawAmount) * (rawAmount.includes('.') ? 100 : 1))
        : Number(rawAmount)

    const currency = data.currency_code || data.details?.totals?.currency_code || 'USD'

    const firstItem = data.items?.[0] || data.details?.line_items?.[0]
    const priceId = firstItem?.price?.id || firstItem?.price_id || null
    const paddleProductId = firstItem?.price?.product_id || firstItem?.product_id || null
    const customSlug = data.custom_data?.slug

    // Match product in database
    let matchedProduct = await findProductByPaddleInfo({
      priceId,
      paddleProductId,
      slug: customSlug,
    })

    if (!matchedProduct) {
      matchedProduct = await getFirstActiveProduct()
    }

    if (!matchedProduct) {
      console.error('❌ No products found in database to associate order.')
      throw createError({
        statusCode: 500,
        statusMessage: 'No product record available for fulfillment',
      })
    }

    // Create Order
    const newOrder = await createOrder({
      productId: matchedProduct.id,
      customerEmail,
      paddleTransactionId: transactionId,
      paddleCustomerId: customerId,
      amountCents,
      currency,
    })

    // Generate Secure Download Token
    await createDownloadToken(newOrder.id)

    console.log(
      `✅ Order created: ${newOrder.orderNumber} for ${customerEmail} (Transaction: ${transactionId})`,
    )
  }

  // 6. Record audit event in database
  await recordWebhookEvent(eventId, eventType)

  return {
    received: true,
    eventId,
    eventType,
  }
})
