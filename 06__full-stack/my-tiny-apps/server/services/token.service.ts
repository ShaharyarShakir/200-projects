import crypto from 'node:crypto'
import { db } from '../db'
import { downloadTokens, type DownloadTokenRecord } from '../db/schema'

export interface GeneratedTokenResult {
  rawToken: string
  tokenRecord: DownloadTokenRecord
}

/**
 * Generates a cryptographically secure 32-byte download token, hashes it with SHA-256,
 * and persists the token hash and expiration date to the database.
 */
export async function createDownloadToken(
  orderId: number,
  expiryDays = 30,
): Promise<GeneratedTokenResult> {
  const rawToken = crypto.randomBytes(32).toString('base64url')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const now = new Date()
  const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)

  const [tokenRecord] = await db
    .insert(downloadTokens)
    .values({
      orderId,
      tokenHash,
      expiresAt,
      downloadCount: 0,
      createdAt: now,
    })
    .returning()

  return {
    rawToken,
    tokenRecord,
  }
}
