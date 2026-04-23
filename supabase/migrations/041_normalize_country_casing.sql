-- Backfill: normalize country ISO codes to uppercase and fix country_name
-- Idempotent: safe to re-run without duplicating changes
-- Fixes 'Us' -> 'US' casing bug caused by titleCase() applied to ISO codes

-- interpreter_profiles: fix country code casing
UPDATE interpreter_profiles
SET country = UPPER(TRIM(country))
WHERE country IS NOT NULL
  AND country != UPPER(TRIM(country));

-- interpreter_profiles: fix country_name for rows where it was set to the malformed ISO code
UPDATE interpreter_profiles
SET country_name = CASE UPPER(TRIM(country))
  WHEN 'US' THEN 'United States'
  WHEN 'CA' THEN 'Canada'
  WHEN 'GB' THEN 'United Kingdom'
  WHEN 'AU' THEN 'Australia'
  WHEN 'JP' THEN 'Japan'
  WHEN 'BR' THEN 'Brazil'
  WHEN 'DE' THEN 'Germany'
  WHEN 'FR' THEN 'France'
  WHEN 'IN' THEN 'India'
  WHEN 'MX' THEN 'Mexico'
  WHEN 'NZ' THEN 'New Zealand'
  WHEN 'ZA' THEN 'South Africa'
  WHEN 'KR' THEN 'South Korea'
  WHEN 'IE' THEN 'Ireland'
  WHEN 'IT' THEN 'Italy'
  WHEN 'ES' THEN 'Spain'
  WHEN 'NL' THEN 'Netherlands'
  WHEN 'SE' THEN 'Sweden'
  WHEN 'NO' THEN 'Norway'
  WHEN 'DK' THEN 'Denmark'
  WHEN 'FI' THEN 'Finland'
  WHEN 'PH' THEN 'Philippines'
  WHEN 'GH' THEN 'Ghana'
  WHEN 'KE' THEN 'Kenya'
  WHEN 'NG' THEN 'Nigeria'
  ELSE INITCAP(TRIM(country_name))
END
WHERE country_name IS NOT NULL
  AND LENGTH(TRIM(country_name)) <= 3;

-- deaf_profiles: fix country code casing
UPDATE deaf_profiles
SET country = UPPER(TRIM(country))
WHERE country IS NOT NULL
  AND country != UPPER(TRIM(country));

-- deaf_profiles: fix country_name
UPDATE deaf_profiles
SET country_name = CASE UPPER(TRIM(country))
  WHEN 'US' THEN 'United States'
  WHEN 'CA' THEN 'Canada'
  WHEN 'GB' THEN 'United Kingdom'
  WHEN 'AU' THEN 'Australia'
  WHEN 'JP' THEN 'Japan'
  ELSE INITCAP(TRIM(country_name))
END
WHERE country_name IS NOT NULL
  AND LENGTH(TRIM(country_name)) <= 3;

-- requester_profiles: fix country code casing
UPDATE requester_profiles
SET country = UPPER(TRIM(country))
WHERE country IS NOT NULL
  AND country != UPPER(TRIM(country));

-- requester_profiles: fix country_name
UPDATE requester_profiles
SET country_name = CASE UPPER(TRIM(country))
  WHEN 'US' THEN 'United States'
  WHEN 'CA' THEN 'Canada'
  WHEN 'GB' THEN 'United Kingdom'
  WHEN 'AU' THEN 'Australia'
  WHEN 'JP' THEN 'Japan'
  ELSE INITCAP(TRIM(country_name))
END
WHERE country_name IS NOT NULL
  AND LENGTH(TRIM(country_name)) <= 3;
