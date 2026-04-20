import { getSupabaseAdmin } from '@/lib/supabase/admin'

/**
 * Shared fields that exist on all three profile tables and should be
 * copied when a user adds a new role.
 */
export interface SharedProfileFields {
  first_name: string
  last_name: string
  city: string
  state: string
  country: string
  country_name: string
  phone: string
  email: string
  photo_url: string
}

const EMPTY: SharedProfileFields = {
  first_name: '',
  last_name: '',
  city: '',
  state: '',
  country: '',
  country_name: '',
  phone: '',
  email: '',
  photo_url: '',
}

/**
 * Fetches shared profile fields from all existing profiles for the given user.
 * Queries all three tables in parallel, sorts by updated_at desc, and picks
 * the most-recent non-null value for each field.
 *
 * Uses the admin client to bypass RLS (cross-table read).
 */
export async function getExistingProfileData(
  userId: string,
): Promise<SharedProfileFields> {
  const admin = getSupabaseAdmin()

  const BASE_COLS = 'first_name, last_name, city, state, country, country_name, phone, email, updated_at'

  // Query all three tables in parallel (requester_profiles has no photo_url)
  const [interpResult, deafResult, reqResult] = await Promise.all([
    admin.from('interpreter_profiles')
      .select(`${BASE_COLS}, photo_url`)
      .eq('user_id', userId)
      .maybeSingle(),
    admin.from('deaf_profiles')
      .select(`${BASE_COLS}, photo_url`)
      .eq('user_id', userId)
      .maybeSingle(),
    admin.from('requester_profiles')
      .select(BASE_COLS)
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  type Row = Record<string, string | null>

  // Filter to rows that exist and have first_name, sort by updated_at desc
  const rows: Row[] = (
    [interpResult.data, deafResult.data, reqResult.data] as (Row | null)[]
  )
    .filter((r): r is Row => !!r && !!r.first_name)
    .sort((a, b) => {
      const ta = a.updated_at ? new Date(a.updated_at).getTime() : 0
      const tb = b.updated_at ? new Date(b.updated_at).getTime() : 0
      return tb - ta
    })

  if (rows.length === 0) {
    // No existing profile with a name -- try to get email from auth
    const { data: authUser } = await admin.auth.admin.getUserById(userId)
    return { ...EMPTY, email: authUser?.user?.email || '' }
  }

  // Pick first non-null value per field across sorted rows
  function pick(field: string): string {
    for (const row of rows) {
      if (row[field]) return row[field] as string
    }
    return ''
  }

  return {
    first_name: pick('first_name'),
    last_name: pick('last_name'),
    city: pick('city'),
    state: pick('state'),
    country: pick('country'),
    country_name: pick('country_name'),
    phone: pick('phone'),
    email: pick('email'),
    photo_url: pick('photo_url'),
  }
}
