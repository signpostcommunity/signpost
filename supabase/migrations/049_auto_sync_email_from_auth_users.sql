-- Forward fix: BEFORE INSERT trigger on each profile table ensures email
-- is always populated from auth.users if the application code omits it.
-- This prevents the OAuth email gap from recurring regardless of signup path.

-- user_profiles: id = auth.users.id
CREATE OR REPLACE FUNCTION sync_email_from_auth_user_profiles()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NULL THEN
    SELECT email INTO NEW.email FROM auth.users WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_email_user_profiles
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_email_from_auth_user_profiles();

-- interpreter_profiles: user_id = auth.users.id
CREATE OR REPLACE FUNCTION sync_email_from_auth_interpreter_profiles()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NULL THEN
    SELECT email INTO NEW.email FROM auth.users WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_email_interpreter_profiles
  BEFORE INSERT ON interpreter_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_email_from_auth_interpreter_profiles();

-- deaf_profiles: dual-ID pattern (id or user_id = auth.users.id)
CREATE OR REPLACE FUNCTION sync_email_from_auth_deaf_profiles()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NULL THEN
    SELECT email INTO NEW.email FROM auth.users WHERE id = COALESCE(NEW.user_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_email_deaf_profiles
  BEFORE INSERT ON deaf_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_email_from_auth_deaf_profiles();

-- requester_profiles: user_id or id = auth.users.id
CREATE OR REPLACE FUNCTION sync_email_from_auth_requester_profiles()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NULL THEN
    SELECT email INTO NEW.email FROM auth.users WHERE id = COALESCE(NEW.user_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_email_requester_profiles
  BEFORE INSERT ON requester_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_email_from_auth_requester_profiles();
