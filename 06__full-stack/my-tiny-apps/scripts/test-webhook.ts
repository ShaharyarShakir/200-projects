import { eq } from 'drizzle-orm'
import { db } from '../server/db'
import { products } from '../server/db/schema'
import { generatePaddleSignature, verifyPaddleSignature } from '../server/utils/paddleWebhook'
import { isEventProcessed, recordWebhookEvent } from '../server/services/webhook.service'
import { createOrder } from '../server/services/order.service'
import { createDownloadToken } from '../server/services/token.service'
import { findProductByPaddleInfo } from '../server/services/product.service'

async function runTests() {
  console.log('🧪 Running Webhook & Modular Services Tests...\n')

  // 1. Signature Verification Test
  const testSecret = 'pdl_ntfset_test_secret_key_12345'
  const sampleBody = JSON.stringify({
    event_id: `evt_test_${Date.now()}`,
    event_type: 'transaction.paid',
    data: { id: 'txn_sample_123' },
  })

  const validSignature = generatePaddleSignature(sampleBody, testSecret)
  const isValid = verifyPaddleSignature(sampleBody, validSignature, testSecret)
  const isInvalid = verifyPaddleSignature(sampleBody, 'ts=12345;h1=badhash', testSecret)

  console.log(`1. Signature Verification (valid): ${isValid ? 'PASSED ✅' : 'FAILED ❌'}`)
  console.log(`2. Signature Verification (invalid): ${!isInvalid ? 'PASSED ✅' : 'FAILED ❌'}`)

  if (!isValid || isInvalid) {
    throw new Error('Signature verification tests failed')
  }

  // 2. Ensure product exists in DB
  let product = await db
    .select()
    .from(products)
    .where(eq(products.slug, 'tiny-compressor'))
    .get()

  if (!product) {
    console.log('Creating test product...')
    const now = new Date()
    const [inserted] = await db
      .insert(products)
      .values({
        slug: 'tiny-compressor',
        name: 'Tiny Compressor',
        description: 'Minimal, fast, on-device image and PDF compression utility for Android.',
        priceCents: 700,
        currency: 'USD',
        status: 'available',
        paddleProductId: 'pro_test_123',
        paddlePriceId: 'pri_test_123',
        createdAt: now,
        updatedAt: now,
      })
      .returning()
    product = inserted
  }

  console.log(`3. Database Product loaded: ${product.name} (ID: ${product.id}) ✅`)

  // 3. Test findProductByPaddleInfo service
  const matchedProduct = await findProductByPaddleInfo({
    priceId: product.paddlePriceId,
    slug: 'tiny-compressor',
  })
  if (!matchedProduct || matchedProduct.id !== product.id) {
    throw new Error('findProductByPaddleInfo failed to find matching product')
  }
  console.log(`4. Product Service findProductByPaddleInfo: PASSED ✅`)

  // 4. Webhook Simulation & Idempotency Test
  const testEventId = `evt_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const testTransactionId = `txn_sim_${Date.now()}`
  const customerEmail = 'customer.test@example.com'

  const alreadyProcessed = await isEventProcessed(testEventId)
  if (!alreadyProcessed) {
    const newOrder = await createOrder({
      productId: product.id,
      customerEmail,
      paddleTransactionId: testTransactionId,
      paddleCustomerId: 'ctm_test_999',
      amountCents: 700,
      currency: 'USD',
    })

    const { rawToken, tokenRecord } = await createDownloadToken(newOrder.id)
    await recordWebhookEvent(testEventId, 'transaction.paid')

    console.log(`5. Order Service Created Order: ${newOrder.orderNumber} (ID: ${newOrder.id}) ✅`)
    console.log(
      `6. Token Service Generated Token (raw: ${rawToken.substring(0, 8)}..., hash: ${tokenRecord.tokenHash.substring(0, 16)}...) ✅`,
    )
  }

  // Test Idempotency: try to check processed event again
  const duplicateCheck = await isEventProcessed(testEventId)
  if (duplicateCheck) {
    console.log('7. Webhook Service Idempotency Check: Duplicate event detected and safely handled ✅')
  } else {
    throw new Error('Idempotency check failed')
  }

  console.log('\n🎉 All Modular Server Services & Webhook Tests Passed Successfully!\n')
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test execution failed:', err)
    process.exit(1)
  })
