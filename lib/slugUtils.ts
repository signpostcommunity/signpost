export const RESERVED_SLUGS = [
  'admin', 'support', 'help', 'about', 'directory', 'book', 'booking',
  'signup', 'login', 'signin', 'register', 'settings', 'profile',
  'dashboard', 'api', 'auth', 'callback', 'interpreter', 'deaf',
  'dhh', 'requester', 'org', 'search', 'browse', 'home', 'index',
  'signpost', 'team', 'inbox', 'messages', 'notifications',
  'privacy', 'terms', 'policies', 'contact', 'feedback', 'd',
]

export function generateSlug(firstName: string, lastName: string): string {
  const combined = `${firstName} ${lastName}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')   // remove special chars except spaces/hyphens
    .trim()
    .replace(/[\s]+/g, '-')         // spaces to hyphens
    .replace(/-{2,}/g, '-')         // no consecutive hyphens
    .replace(/^-|-$/g, '')          // trim hyphens from ends

  return combined || ''
}

export function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug || slug.length < 3) {
    return { valid: false, error: 'Must be at least 3 characters' }
  }
  if (slug.length > 50) {
    return { valid: false, error: 'Must be 50 characters or fewer' }
  }
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) && slug.length >= 3) {
    if (/^-/.test(slug) || /-$/.test(slug)) {
      return { valid: false, error: 'Cannot start or end with a hyphen' }
    }
    return { valid: false, error: 'Can only contain lowercase letters, numbers, and hyphens' }
  }
  if (/--/.test(slug)) {
    return { valid: false, error: 'Cannot contain consecutive hyphens' }
  }
  if (RESERVED_SLUGS.includes(slug)) {
    return { valid: false, error: 'This URL is reserved' }
  }
  return { valid: true }
}
