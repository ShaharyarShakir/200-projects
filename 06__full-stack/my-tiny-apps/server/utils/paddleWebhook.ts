import crypto from 'node:crypto'

/**
 * Verifies a Paddle Billing webhook signature.
 *
 * Paddle-Signature format: `ts=1671552777;h1=eb310467911...`
 * The signed payload is: `${ts}:${rawBody}`
 * The signature is computed using HMAC-SHA256 with the webhook secret.
 */
export function verifyPaddleSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secret: string,
): boolean {
  if (!signatureHeader || !secret) {
    return false
  }

  try {
    const parts = signatureHeader.split(';')
    let timestamp = ''
    const signatures: string[] = []

    for (const part of parts) {
      const [key, value] = part.split('=')
      if (key === 'ts') {
        timestamp = value
      } else if (key === 'h1') {
        signatures.push(value)
      }
    }

    if (!timestamp || signatures.length === 0) {
      return false
    }

    const payloadToSign = `${timestamp}:${rawBody}`
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadToSign)
      .digest('hex')

    const computedBuffer = Buffer.from(computedSignature, 'hex')

    for (const signature of signatures) {
      try {
        const signatureBuffer = Buffer.from(signature, 'hex')
        if (
          computedBuffer.length === signatureBuffer.length &&
          crypto.timingSafeEqual(computedBuffer, signatureBuffer)
        ) {
          return true
        }
      } catch {
        // Continue checking other signatures if any
      }
    }

    return false
  } catch (error) {
    console.error('Error verifying Paddle signature:', error)
    return false
  }
}

/**
 * Helper to generate a Paddle webhook signature for testing / simulation.
 */
export function generatePaddleSignature(rawBody: string, secret: string, timestamp?: number): string {
  const ts = timestamp || Math.floor(Date.now() / 1000)
  const payloadToSign = `${ts}:${rawBody}`
  const h1 = crypto
    .createHmac('sha256', secret)
    .update(payloadToSign)
    .digest('hex')

  return `ts=${ts};h1=${h1}`
}

