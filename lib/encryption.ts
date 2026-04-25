import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_ENV = 'ENCRYPTION_KEY'

function getKey(): Buffer {
  const secret = process.env[KEY_ENV]
  if (!secret) {
    console.warn('[encryption] ENCRYPTION_KEY not set, encryption disabled')
    return Buffer.alloc(0)
  }
  // Derive a 32-byte key from the secret using scrypt
  return scryptSync(secret, 'signpost-salt', 32)
}

/**
 * Encrypt a plaintext string. Returns a combined string: iv:authTag:ciphertext (all base64).
 * If ENCRYPTION_KEY is not set, returns the plaintext unchanged (graceful degradation).
 */
export function encrypt(plaintext: string | null): string | null {
  if (!plaintext) return plaintext
  const key = getKey()
  if (key.length === 0) return plaintext // No key, skip encryption

  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  const authTag = cipher.getAuthTag()

  return `enc:${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`
}

/**
 * Decrypt an encrypted string. If the string doesn't start with 'enc:', returns it as-is
 * (handles legacy unencrypted data gracefully).
 */
export function decrypt(ciphertext: string | null): string | null {
  if (!ciphertext) return ciphertext
  if (!ciphertext.startsWith('enc:')) return ciphertext // Legacy unencrypted data

  const key = getKey()
  if (key.length === 0) {
    console.warn('[encryption] Cannot decrypt: ENCRYPTION_KEY not set')
    return '[encrypted]'
  }

  try {
    const parts = ciphertext.split(':')
    if (parts.length !== 4) return '[invalid encrypted data]'

    const iv = Buffer.from(parts[1], 'base64')
    const authTag = Buffer.from(parts[2], 'base64')
    const encrypted = parts[3]

    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    let decrypted = decipher.update(encrypted, 'base64', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (err) {
    console.error('[encryption] Decryption failed:', err)
    return '[decryption error]'
  }
}

/**
 * Encrypt specific fields on an object. Returns a new object with encrypted values.
 */
export function encryptFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const result = { ...obj }
  for (const field of fields) {
    if (typeof result[field] === 'string') {
      result[field] = encrypt(result[field] as string) as any
    }
  }
  return result
}

/**
 * Decrypt specific fields on an object. Returns a new object with decrypted values.
 */
export function decryptFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const result = { ...obj }
  for (const field of fields) {
    if (typeof result[field] === 'string') {
      result[field] = decrypt(result[field] as string) as any
    }
  }
  return result
}

// The fields on the bookings table that should be encrypted
export const BOOKING_ENCRYPTED_FIELDS = ['title', 'description'] as const

// The fields on direct_messages / messages tables that should be encrypted
export const MESSAGE_ENCRYPTED_FIELDS = ['body'] as const
