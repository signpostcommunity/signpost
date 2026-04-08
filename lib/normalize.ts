/**
 * Profile field normalization utilities.
 * Trims whitespace, applies Title Case to names/locations.
 */

export function titleCase(str: string): string {
  // Unicode-aware: split on whitespace and hyphens, capitalize first letter of each part.
  // The previous implementation used /\b\w/g which treats non-ASCII letters (e.g. ñ, é)
  // as non-word characters, corrupting names like "Cañas" into "CañAs".
  return str
    .trim()
    .toLocaleLowerCase()
    .split(/(\s+|-)/)
    .map(part => {
      if (!part || /^(\s+|-)$/.test(part)) return part;
      return part.charAt(0).toLocaleUpperCase() + part.slice(1);
    })
    .join('');
}

export function normalizeProfileFields(data: Record<string, unknown>): Record<string, unknown> {
  const fields = ['first_name', 'last_name', 'city', 'country'];
  const result = { ...data };
  for (const field of fields) {
    if (typeof result[field] === 'string' && (result[field] as string).trim()) {
      result[field] = titleCase(result[field] as string);
    }
  }
  // State: uppercase if 2 chars or less (abbreviation), title case otherwise
  if (typeof result.state === 'string' && (result.state as string).trim()) {
    const trimmed = (result.state as string).trim();
    result.state = trimmed.length <= 2 ? trimmed.toUpperCase() : titleCase(result.state as string);
  }
  // country_name: same as country (used by some profile tables)
  if (typeof result.country_name === 'string' && (result.country_name as string).trim()) {
    result.country_name = titleCase(result.country_name as string);
  }
  return result;
}
