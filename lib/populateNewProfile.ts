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
}

const SOURCE_TABLES = [
  'interpreter_profiles',
  'deaf_profiles',
  'requester_profiles',
] as const

/**
 * Fetches shared profile fields from an existing profile for the given user.
 * Tries each profile table in order and returns the first one that has a
 * first_name populated. Falls back to auth email if no profile has one.
 *
 * Uses the admin client to bypass RLS (cross-table read).
 */
export async function getExistingProfileData(
  userId: string,
): Promise<SharedProfileFields> {
  const admin = getSupabaseAdmin()

  for (const table of SOURCE_TABLES) {
    const { data } = await admin
      .from(table)
      .select('first_name, last_name, city, state, country, country_name, phone, email')
      .eq('user_id', userId)
      .maybeSingle()

    if (data?.first_name) {
      return {
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || '',
        country_name: data.country_name || '',
        phone: data.phone || '',
        email: data.email || '',
      }
    }
  }

  // No existing profile with a name — try to get email from auth
  const { data: authUser } = await admin.auth.admin.getUserById(userId)

  return {
    ...EMPTY,
    email: authUser?.user?.email || '',
  }
}
