/**
 * Seed script — populates Supabase with the 10 demo interpreters.
 *
 * Run with:
 *   npx tsx lib/data/seed-script.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * (or a service role key for SUPABASE_SERVICE_ROLE_KEY) in environment.
 *
 * NOTE: This script uses a service role key so it can bypass RLS.
 * Set SUPABASE_SERVICE_ROLE_KEY in your .env.local before running.
 */

import { createClient } from '@supabase/supabase-js';
import { interpreters } from './seed';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  console.log('Seeding interpreters...');

  for (const interp of interpreters) {
    // Create a placeholder auth user for each demo interpreter
    const email = `demo-${interp.initials.toLowerCase()}@signpost.demo`;
    const password = 'signpost-demo-2025';

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.warn(`Skipping ${interp.name}: ${authError.message}`);
      continue;
    }

    const userId = authData.user!.id;

    // user_profiles
    await supabase.from('user_profiles').insert({ id: userId, role: 'interpreter' });

    // interpreter_profiles
    const { data: interpData, error: interpError } = await supabase
      .from('interpreter_profiles')
      .insert({
        user_id: userId,
        name: interp.name,
        location: interp.location,
        state: interp.state,
        country: interp.location.split(', ').pop() || '',
        city: interp.location.split(', ')[0] || '',
        bio: interp.bio,
        available: interp.available,
        avatar_color: interp.color,
        rating: interp.rating,
        review_count: interp.reviews,
        status: 'approved',  // demo interpreters are pre-approved
      })
      .select()
      .single();

    if (interpError || !interpData) {
      console.warn(`Failed to insert profile for ${interp.name}: ${interpError?.message}`);
      continue;
    }

    const interpId = interpData.id;

    // Sub-tables
    await Promise.all([
      supabase.from('interpreter_sign_languages').insert(
        interp.signLangs.map((l) => ({ interpreter_id: interpId, language: l }))
      ),
      supabase.from('interpreter_spoken_languages').insert(
        interp.spokenLangs.map((l) => ({ interpreter_id: interpId, language: l }))
      ),
      supabase.from('interpreter_specializations').insert(
        interp.specs.map((s) => ({ interpreter_id: interpId, specialization: s }))
      ),
      supabase.from('interpreter_regions').insert(
        interp.regions.map((r) => ({ interpreter_id: interpId, region: r }))
      ),
      supabase.from('interpreter_certifications').insert(
        interp.certs.map((c) => ({ interpreter_id: interpId, name: c, verified: true }))
      ),
    ]);

    console.log(`✓ Seeded: ${interp.name}`);
  }

  console.log('\nSeed complete!');
}

seed().catch(console.error);
