-- RLS smoke test helper function
-- Executes a SELECT count(*) query as a specific authenticated user to test RLS policies.
-- Uses function-level SET role = 'authenticated' to properly impersonate users.
-- Only allows SELECT count queries for safety. Called from admin smoke test API route.

CREATE OR REPLACE FUNCTION rls_test_count(
  p_user_id uuid,
  p_sql text
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY INVOKER
SET role = 'authenticated'
AS $$
DECLARE
  result bigint;
BEGIN
  -- Only allow SELECT count queries
  IF NOT (lower(trim(p_sql)) LIKE 'select count%') THEN
    RAISE EXCEPTION 'Only SELECT count queries are allowed';
  END IF;

  -- Set JWT claims so auth.uid() returns the test user
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', p_user_id::text, 'role', 'authenticated')::text, true);

  -- Execute the count query — RLS policies will apply
  EXECUTE p_sql INTO result;

  RETURN COALESCE(result, 0);
END;
$$;
