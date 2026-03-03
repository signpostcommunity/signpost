-- ============================================================
-- signpost — Initial Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- User Profiles (extends auth.users)
-- ============================================================
create table public.user_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('interpreter', 'deaf', 'org', 'requester')),
  created_at  timestamptz not null default now()
);

-- ============================================================
-- Interpreter Profiles
-- ============================================================
create table public.interpreter_profiles (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null references public.user_profiles(id) on delete cascade,
  name                    text not null,
  location                text,
  state                   text,
  country                 text,
  city                    text,
  interpreter_type        text,                    -- 'freelance' | 'agency' | 'staff'
  work_mode               text,                    -- 'in_person' | 'remote' | 'both'
  years_experience        int,
  bio                     text,
  website_url             text,
  linkedin_url            text,
  event_coordination      boolean default false,
  event_coordination_desc text,
  available               boolean default true,
  avatar_color            text default 'linear-gradient(135deg,#7b61ff,#00e5ff)',
  video_url               text,
  video_desc              text,
  rating                  numeric(3,1) default 0,
  review_count            int default 0,
  status                  text not null default 'pending' check (status in ('pending', 'approved', 'suspended')),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create table public.interpreter_sign_languages (
  interpreter_id  uuid not null references public.interpreter_profiles(id) on delete cascade,
  language        text not null,
  primary key (interpreter_id, language)
);

create table public.interpreter_spoken_languages (
  interpreter_id  uuid not null references public.interpreter_profiles(id) on delete cascade,
  language        text not null,
  primary key (interpreter_id, language)
);

create table public.interpreter_specializations (
  interpreter_id  uuid not null references public.interpreter_profiles(id) on delete cascade,
  specialization  text not null,
  primary key (interpreter_id, specialization)
);

create table public.interpreter_regions (
  interpreter_id  uuid not null references public.interpreter_profiles(id) on delete cascade,
  region          text not null,
  primary key (interpreter_id, region)
);

create table public.interpreter_certifications (
  id                uuid primary key default uuid_generate_v4(),
  interpreter_id    uuid not null references public.interpreter_profiles(id) on delete cascade,
  name              text not null,
  issuing_body      text,
  year              int,
  verification_url  text,
  verified          boolean default false
);

create table public.interpreter_education (
  id              uuid primary key default uuid_generate_v4(),
  interpreter_id  uuid not null references public.interpreter_profiles(id) on delete cascade,
  degree          text not null,
  institution     text,
  year            int
);

create table public.interpreter_rate_profiles (
  id                    uuid primary key default uuid_generate_v4(),
  interpreter_id        uuid not null references public.interpreter_profiles(id) on delete cascade,
  label                 text not null,
  is_default            boolean default false,
  color                 text default 'var(--accent)',
  hourly_rate           numeric(10,2),
  currency              text default 'USD',
  after_hours_diff      numeric(5,2),             -- additional % or flat amount
  min_booking           int,                      -- minutes
  cancellation_policy   text,
  late_cancel_fee       numeric(10,2),
  travel_expenses       jsonb,
  eligibility_criteria  text,
  additional_terms      text
);

create table public.interpreter_availability (
  interpreter_id  uuid not null references public.interpreter_profiles(id) on delete cascade,
  day_of_week     int not null check (day_of_week between 0 and 6),  -- 0=Sun, 6=Sat
  start_time      time not null,
  end_time        time not null,
  primary key (interpreter_id, day_of_week, start_time)
);

-- ============================================================
-- Deaf / HoH Profiles
-- ============================================================
create table public.deaf_profiles (
  id           uuid primary key references public.user_profiles(id) on delete cascade,
  name         text not null,
  phone        text,
  country      text,
  city         text,
  comm_prefs   jsonb default '{}'
);

create table public.deaf_roster (
  id               uuid primary key default uuid_generate_v4(),
  deaf_user_id     uuid not null references public.deaf_profiles(id) on delete cascade,
  interpreter_id   uuid not null references public.interpreter_profiles(id) on delete cascade,
  tier             text default 'preferred' check (tier in ('top', 'preferred', 'backup')),
  approve_work     boolean default true,
  approve_personal boolean default false,
  notes            text,
  created_at       timestamptz not null default now(),
  unique (deaf_user_id, interpreter_id)
);

-- ============================================================
-- Requester / Org Profiles
-- ============================================================
create table public.requester_profiles (
  id          uuid primary key references public.user_profiles(id) on delete cascade,
  name        text not null,
  phone       text,
  country     text,
  city        text,
  org_name    text,
  org_type    text,
  comm_prefs  jsonb default '{}'
);

-- ============================================================
-- Bookings
-- ============================================================
create table public.bookings (
  id                  uuid primary key default uuid_generate_v4(),
  requester_id        uuid not null references public.user_profiles(id) on delete cascade,
  interpreter_id      uuid not null references public.interpreter_profiles(id) on delete cascade,
  status              text not null default 'pending' check (status in ('pending', 'confirmed', 'declined', 'cancelled', 'completed')),
  date                date,
  time_start          time,
  time_end            time,
  location            text,
  format              text check (format in ('in_person', 'remote')),
  interpreter_count   int default 1,
  description         text,
  rate_profile_id     uuid references public.interpreter_rate_profiles(id),
  created_at          timestamptz not null default now()
);

-- ============================================================
-- Reviews
-- ============================================================
create table public.reviews (
  id            uuid primary key default uuid_generate_v4(),
  booking_id    uuid not null references public.bookings(id) on delete cascade,
  interpreter_id uuid not null references public.interpreter_profiles(id) on delete cascade,
  reviewer_id   uuid not null references public.user_profiles(id) on delete cascade,
  rating        int not null check (rating between 1 and 5),
  body          text,
  created_at    timestamptz not null default now(),
  unique (booking_id, reviewer_id)
);

-- ============================================================
-- Messages
-- ============================================================
create table public.messages (
  id          uuid primary key default uuid_generate_v4(),
  booking_id  uuid not null references public.bookings(id) on delete cascade,
  sender_id   uuid not null references public.user_profiles(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================
create index on public.interpreter_profiles(status);
create index on public.interpreter_profiles(available);
create index on public.bookings(requester_id);
create index on public.bookings(interpreter_id);
create index on public.bookings(status);
create index on public.deaf_roster(deaf_user_id);
create index on public.messages(booking_id);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.user_profiles enable row level security;
alter table public.interpreter_profiles enable row level security;
alter table public.interpreter_sign_languages enable row level security;
alter table public.interpreter_spoken_languages enable row level security;
alter table public.interpreter_specializations enable row level security;
alter table public.interpreter_regions enable row level security;
alter table public.interpreter_certifications enable row level security;
alter table public.interpreter_education enable row level security;
alter table public.interpreter_rate_profiles enable row level security;
alter table public.interpreter_availability enable row level security;
alter table public.deaf_profiles enable row level security;
alter table public.deaf_roster enable row level security;
alter table public.requester_profiles enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.messages enable row level security;

-- user_profiles: users can read/write their own row
create policy "users read own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "users insert own profile"
  on public.user_profiles for insert
  with check (auth.uid() = id);

create policy "users update own profile"
  on public.user_profiles for update
  using (auth.uid() = id);

-- interpreter_profiles: public read for approved, write own row
create policy "public read approved interpreters"
  on public.interpreter_profiles for select
  using (status = 'approved' or user_id = auth.uid());

create policy "interpreters insert own profile"
  on public.interpreter_profiles for insert
  with check (user_id = auth.uid());

create policy "interpreters update own profile"
  on public.interpreter_profiles for update
  using (user_id = auth.uid());

-- interpreter sub-tables: public read, interpreter write own
create policy "public read interpreter sign langs"
  on public.interpreter_sign_languages for select using (true);
create policy "interpreter write own sign langs"
  on public.interpreter_sign_languages for all
  using (interpreter_id in (select id from public.interpreter_profiles where user_id = auth.uid()));

create policy "public read interpreter spoken langs"
  on public.interpreter_spoken_languages for select using (true);
create policy "interpreter write own spoken langs"
  on public.interpreter_spoken_languages for all
  using (interpreter_id in (select id from public.interpreter_profiles where user_id = auth.uid()));

create policy "public read interpreter specs"
  on public.interpreter_specializations for select using (true);
create policy "interpreter write own specs"
  on public.interpreter_specializations for all
  using (interpreter_id in (select id from public.interpreter_profiles where user_id = auth.uid()));

create policy "public read interpreter regions"
  on public.interpreter_regions for select using (true);
create policy "interpreter write own regions"
  on public.interpreter_regions for all
  using (interpreter_id in (select id from public.interpreter_profiles where user_id = auth.uid()));

create policy "public read interpreter certs"
  on public.interpreter_certifications for select using (true);
create policy "interpreter write own certs"
  on public.interpreter_certifications for all
  using (interpreter_id in (select id from public.interpreter_profiles where user_id = auth.uid()));

create policy "public read interpreter education"
  on public.interpreter_education for select using (true);
create policy "interpreter write own education"
  on public.interpreter_education for all
  using (interpreter_id in (select id from public.interpreter_profiles where user_id = auth.uid()));

create policy "public read rate profiles"
  on public.interpreter_rate_profiles for select using (true);
create policy "interpreter write own rate profiles"
  on public.interpreter_rate_profiles for all
  using (interpreter_id in (select id from public.interpreter_profiles where user_id = auth.uid()));

create policy "public read availability"
  on public.interpreter_availability for select using (true);
create policy "interpreter write own availability"
  on public.interpreter_availability for all
  using (interpreter_id in (select id from public.interpreter_profiles where user_id = auth.uid()));

-- deaf_profiles: own rows only
create policy "deaf users read own profile"
  on public.deaf_profiles for select using (id = auth.uid());
create policy "deaf users insert own profile"
  on public.deaf_profiles for insert with check (id = auth.uid());
create policy "deaf users update own profile"
  on public.deaf_profiles for update using (id = auth.uid());

-- deaf_roster: own rows only
create policy "deaf users read own roster"
  on public.deaf_roster for select using (deaf_user_id = auth.uid());
create policy "deaf users write own roster"
  on public.deaf_roster for all using (deaf_user_id = auth.uid());

-- requester_profiles: own rows only
create policy "requesters read own profile"
  on public.requester_profiles for select using (id = auth.uid());
create policy "requesters insert own profile"
  on public.requester_profiles for insert with check (id = auth.uid());
create policy "requesters update own profile"
  on public.requester_profiles for update using (id = auth.uid());

-- bookings: visible to requester or interpreter
create policy "booking participants read"
  on public.bookings for select
  using (
    requester_id = auth.uid()
    or interpreter_id in (select id from public.interpreter_profiles where user_id = auth.uid())
  );

create policy "requesters create bookings"
  on public.bookings for insert
  with check (requester_id = auth.uid());

create policy "booking participants update"
  on public.bookings for update
  using (
    requester_id = auth.uid()
    or interpreter_id in (select id from public.interpreter_profiles where user_id = auth.uid())
  );

-- reviews: booking participants can create/read
create policy "booking participants read reviews"
  on public.reviews for select
  using (
    reviewer_id = auth.uid()
    or interpreter_id in (select id from public.interpreter_profiles where user_id = auth.uid())
  );

create policy "booking participants create reviews"
  on public.reviews for insert
  with check (reviewer_id = auth.uid());

-- messages: booking participants can read/write
create policy "booking participants read messages"
  on public.messages for select
  using (
    booking_id in (
      select id from public.bookings
      where requester_id = auth.uid()
      or interpreter_id in (select id from public.interpreter_profiles where user_id = auth.uid())
    )
  );

create policy "booking participants send messages"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and booking_id in (
      select id from public.bookings
      where requester_id = auth.uid()
      or interpreter_id in (select id from public.interpreter_profiles where user_id = auth.uid())
    )
  );
