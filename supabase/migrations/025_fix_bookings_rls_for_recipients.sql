-- Fix bookings RLS to allow interpreters linked via booking_recipients
-- (not just via the legacy bookings.interpreter_id column)
--
-- The original policy only checked bookings.interpreter_id, but the new
-- multi-recipient model links interpreters through booking_recipients.
-- This caused nested embed queries and even direct .in('id', [...]) queries
-- to silently return no rows for interpreters.

-- Drop existing select policy
drop policy if exists "booking participants read" on public.bookings;

-- Recreate with booking_recipients check
create policy "booking participants read"
  on public.bookings for select
  using (
    requester_id = auth.uid()
    or interpreter_id in (select id from public.interpreter_profiles where user_id = auth.uid())
    or id in (
      select booking_id from public.booking_recipients
      where interpreter_id in (select id from public.interpreter_profiles where user_id = auth.uid())
    )
  );

-- Also fix the update policy
drop policy if exists "booking participants update" on public.bookings;

create policy "booking participants update"
  on public.bookings for update
  using (
    requester_id = auth.uid()
    or interpreter_id in (select id from public.interpreter_profiles where user_id = auth.uid())
    or id in (
      select booking_id from public.booking_recipients
      where interpreter_id in (select id from public.interpreter_profiles where user_id = auth.uid())
    )
  );
