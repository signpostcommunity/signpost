/**
 * Keeps name, first_name, and last_name columns in sync on profile tables.
 * Apply before every .upsert() or .update() on interpreter_profiles or deaf_profiles
 * that touches any name field.
 *
 * TODO: Tech debt — remove interpreter_profiles.name column, derive from first_name + last_name
 */
export function syncNameFields(data: Record<string, any>): Record<string, any> {
  const result = { ...data };

  // If first_name or last_name changed, update name
  if ('first_name' in result || 'last_name' in result) {
    const first = (result.first_name ?? '').trim();
    const last = (result.last_name ?? '').trim();
    result.name = [first, last].filter(Boolean).join(' ');
  }
  // If only name changed, update first_name and last_name
  else if ('name' in result && !('first_name' in result)) {
    const parts = (result.name ?? '').trim().split(/\s+/);
    result.first_name = parts[0] ?? '';
    result.last_name = parts.slice(1).join(' ') ?? '';
  }

  return result;
}
