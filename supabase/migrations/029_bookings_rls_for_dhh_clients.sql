-- Allow Deaf users to see bookings where they are listed in booking_dhh_clients
-- This supplements the existing "booking participants read" policy

DROP POLICY IF EXISTS "dhh_read_bookings_for_them" ON public.bookings;

CREATE POLICY "dhh_read_bookings_for_them" ON public.bookings
  FOR SELECT USING (
    id IN (
      SELECT bdc.booking_id FROM public.booking_dhh_clients bdc
      WHERE bdc.dhh_user_id IN (
        SELECT dp.id FROM public.deaf_profiles dp
        WHERE dp.id = auth.uid() OR dp.user_id = auth.uid()
      )
    )
  );
