create table beta_feedback (
  id uuid default gen_random_uuid() primary key,
  tester_email text,
  page text,
  notes text,
  specific_answer text,
  is_end_of_session boolean default false,
  end_of_session_data jsonb,
  created_at timestamptz default now()
);

alter table beta_feedback enable row level security;

create policy "Service role only" on beta_feedback for all using (false);
