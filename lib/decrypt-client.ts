/**
 * Client-side decryption helper.
 * Calls the /api/decrypt server route to decrypt encrypted field values.
 * Fields that don't start with 'enc:' are returned unchanged without a server call.
 */
export async function decryptFieldsClient<T extends Record<string, any>>(
  obj: T,
  fieldNames: (keyof T)[]
): Promise<T> {
  const fieldsToDecrypt: Record<string, string> = {}
  let needsDecryption = false

  for (const field of fieldNames) {
    const value = obj[field]
    if (typeof value === 'string' && value.startsWith('enc:')) {
      fieldsToDecrypt[field as string] = value
      needsDecryption = true
    }
  }

  if (!needsDecryption) return obj

  try {
    const res = await fetch('/api/decrypt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: fieldsToDecrypt }),
    })

    if (!res.ok) return obj

    const { fields: decrypted } = await res.json()
    const result = { ...obj }
    for (const [key, value] of Object.entries(decrypted)) {
      (result as any)[key] = value
    }
    return result
  } catch {
    return obj
  }
}

/**
 * Batch decrypt an array of objects.
 */
export async function decryptBatchClient<T extends Record<string, any>>(
  items: T[],
  fieldNames: (keyof T)[]
): Promise<T[]> {
  // Collect all encrypted fields across all items
  const allFields: Record<string, string> = {}
  const fieldMap: { itemIndex: number; field: string; fieldKey: string }[] = []

  for (let i = 0; i < items.length; i++) {
    for (const field of fieldNames) {
      const value = items[i][field]
      if (typeof value === 'string' && value.startsWith('enc:')) {
        const key = `${i}_${field as string}`
        allFields[key] = value
        fieldMap.push({ itemIndex: i, field: field as string, fieldKey: key })
      }
    }
  }

  if (fieldMap.length === 0) return items

  try {
    const res = await fetch('/api/decrypt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: allFields }),
    })

    if (!res.ok) return items

    const { fields: decrypted } = await res.json()
    const result = items.map(item => ({ ...item }))

    for (const { itemIndex, field, fieldKey } of fieldMap) {
      if (decrypted[fieldKey] !== undefined) {
        (result[itemIndex] as any)[field] = decrypted[fieldKey]
      }
    }

    return result
  } catch {
    return items
  }
}
