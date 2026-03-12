-- Migration 010: Backfill interpreter_profiles columns from draft_data
-- Fixes profiles where signup saved draft_data but didn't copy to individual columns

UPDATE interpreter_profiles
SET
  first_name    = COALESCE(first_name,    draft_data->>'firstName'),
  last_name     = COALESCE(last_name,     draft_data->>'lastName'),
  name          = COALESCE(
                    NULLIF(TRIM(COALESCE(first_name, draft_data->>'firstName', '') || ' ' || COALESCE(last_name, draft_data->>'lastName', '')), ''),
                    name
                  ),
  email         = COALESCE(email,         draft_data->>'email'),
  phone         = COALESCE(phone,         draft_data->>'phone'),
  city          = COALESCE(city,          draft_data->>'city'),
  state         = COALESCE(state,         draft_data->>'state'),
  country       = COALESCE(country,       draft_data->>'country'),
  interpreter_type = COALESCE(interpreter_type, draft_data->>'interpreterType'),
  work_mode     = COALESCE(work_mode,     draft_data->>'modeOfWork'),
  years_experience = COALESCE(years_experience, draft_data->>'yearsExperience'),
  bio           = COALESCE(bio,           draft_data->>'bio'),
  bio_specializations = COALESCE(bio_specializations, draft_data->>'bioSpecializations'),
  bio_extra     = COALESCE(bio_extra,     draft_data->>'bioExtra'),
  video_url     = COALESCE(video_url,     draft_data->>'videoUrl'),
  video_desc    = COALESCE(video_desc,    draft_data->>'videoDescription'),
  photo_url     = COALESCE(photo_url,     draft_data->>'avatarUrl'),
  gender_identity = COALESCE(gender_identity, draft_data->>'genderIdentity'),
  event_coordination = COALESCE(event_coordination, (draft_data->>'eventCoordination')::boolean),
  event_coordination_desc = COALESCE(event_coordination_desc, draft_data->>'coordinationBio'),
  lgbtq         = COALESCE(lgbtq,         (draft_data->>'lgbtq')::boolean),
  deaf_parented = COALESCE(deaf_parented, (draft_data->>'deafParented')::boolean),
  bipoc         = COALESCE(bipoc,         (draft_data->>'bipoc')::boolean),
  religious_affiliation = COALESCE(religious_affiliation, (draft_data->>'religiousAffiliation')::boolean),
  religious_details = COALESCE(religious_details, CASE
    WHEN draft_data->'religiousDetails' IS NOT NULL AND jsonb_typeof(draft_data->'religiousDetails') = 'array'
    THEN ARRAY(SELECT jsonb_array_elements_text(draft_data->'religiousDetails'))
    ELSE religious_details
  END),
  sign_languages = COALESCE(sign_languages, CASE
    WHEN draft_data->'signLanguages' IS NOT NULL AND jsonb_typeof(draft_data->'signLanguages') = 'array'
    THEN ARRAY(SELECT jsonb_array_elements_text(draft_data->'signLanguages'))
    ELSE sign_languages
  END),
  spoken_languages = COALESCE(spoken_languages, CASE
    WHEN draft_data->'spokenLanguages' IS NOT NULL AND jsonb_typeof(draft_data->'spokenLanguages') = 'array'
    THEN ARRAY(SELECT jsonb_array_elements_text(draft_data->'spokenLanguages'))
    ELSE spoken_languages
  END),
  specializations = COALESCE(specializations, CASE
    WHEN draft_data->'specializations' IS NOT NULL AND jsonb_typeof(draft_data->'specializations') = 'array'
    THEN ARRAY(SELECT jsonb_array_elements_text(draft_data->'specializations'))
    ELSE specializations
  END),
  specialized_skills = COALESCE(specialized_skills, CASE
    WHEN draft_data->'specializedSkills' IS NOT NULL AND jsonb_typeof(draft_data->'specializedSkills') = 'array'
    THEN ARRAY(SELECT jsonb_array_elements_text(draft_data->'specializedSkills'))
    ELSE specialized_skills
  END),
  regions = COALESCE(regions, CASE
    WHEN draft_data->'regions' IS NOT NULL AND jsonb_typeof(draft_data->'regions') = 'array'
    THEN ARRAY(SELECT jsonb_array_elements_text(draft_data->'regions'))
    ELSE regions
  END),
  bipoc_details = COALESCE(bipoc_details, CASE
    WHEN draft_data->'bipocDetails' IS NOT NULL AND jsonb_typeof(draft_data->'bipocDetails') = 'array'
    THEN ARRAY(SELECT jsonb_array_elements_text(draft_data->'bipocDetails'))
    ELSE bipoc_details
  END),
  updated_at = NOW()
WHERE draft_data IS NOT NULL
  AND draft_data->>'firstName' IS NOT NULL
  AND (first_name IS NULL OR bio IS NULL OR last_name IS NULL);
