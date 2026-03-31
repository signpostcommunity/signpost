/**
 * Defense-in-depth sanitization for user-provided text.
 * React already escapes output, but we strip dangerous patterns
 * before storing in the database so raw HTML never persists.
 */

/**
 * Strip HTML tags and dangerous patterns from a single string.
 * Preserves newlines (for textarea content) and normal punctuation.
 */
export function sanitizeText(input: string): string {
  if (!input) return input

  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove javascript: protocol (case-insensitive, whitespace-tolerant)
    .replace(/javascript\s*:/gi, '')
    // Remove on* event handler attributes
    .replace(/on\w+\s*=/gi, '')
    // Remove data: URIs that could embed scripts
    .replace(/data\s*:\s*text\/html/gi, '')
    // Collapse tabs to spaces (preserve newlines for textareas)
    .replace(/\t/g, ' ')
    .trim()
}

/**
 * Sanitize all string values in an object. Non-string values are
 * passed through untouched (numbers, booleans, arrays, JSON, null).
 */
export function sanitizeFields<T extends Record<string, unknown>>(data: T): T {
  const result = { ...data }
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string') {
      (result as Record<string, unknown>)[key] = sanitizeText(value)
    }
  }
  return result
}
