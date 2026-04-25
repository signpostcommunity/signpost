-- Atomic gate for confirming a booking recipient.
-- Locks the booking row, checks confirmed count vs interpreter_count,
-- and only performs the update if the booking is not yet filled.
-- Returns TRUE if confirmation succeeded, FALSE if booking already filled.

CREATE OR REPLACE FUNCTION confirm_recipient_if_available(
  p_booking_id UUID,
  p_recipient_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_interpreter_count INT;
  v_booking_status TEXT;
  v_confirmed_count INT;
  v_recipient_status TEXT;
BEGIN
  -- Lock the booking row to prevent concurrent confirmations
  SELECT interpreter_count, status
  INTO v_interpreter_count, v_booking_status
  FROM bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Already filled at the booking level
  IF v_booking_status = 'filled' THEN
    RETURN FALSE;
  END IF;

  -- Count current confirmed recipients
  SELECT COUNT(*)
  INTO v_confirmed_count
  FROM booking_recipients
  WHERE booking_id = p_booking_id AND status = 'confirmed';

  IF v_confirmed_count >= v_interpreter_count THEN
    RETURN FALSE;
  END IF;

  -- Lock and check the specific recipient
  SELECT status
  INTO v_recipient_status
  FROM booking_recipients
  WHERE id = p_recipient_id AND booking_id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Already confirmed (idempotent)
  IF v_recipient_status = 'confirmed' THEN
    RETURN FALSE;
  END IF;

  -- Gate passed: perform the atomic confirmation
  UPDATE booking_recipients
  SET status = 'confirmed', confirmed_at = NOW()
  WHERE id = p_recipient_id AND booking_id = p_booking_id;

  RETURN TRUE;
END;
$$;
