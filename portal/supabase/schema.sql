-- Optional production schema (Supabase). Local demo uses data/db.json.

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  phone text,
  college text,
  department text,
  year text,
  student_id text unique,
  created_at timestamptz default now()
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  team_code text unique not null,
  team_name text not null,
  college text,
  department text,
  leader_id uuid references profiles(id),
  team_size int check (team_size between 2 and 4),
  challenge_id text,
  created_at timestamptz default now()
);

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  participant_code text unique not null,
  team_id uuid references teams(id),
  profile_id uuid references profiles(id),
  role text,
  created_at timestamptz default now()
);

create table if not exists challenges (
  id text primary key,
  code text,
  title text,
  description text
);

create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id),
  status text,
  secure_checkin_token text unique,
  created_at timestamptz default now()
);

create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references participants(id),
  checked_in_at timestamptz default now(),
  checked_in_by text
);

alter table profiles enable row level security;
alter table teams enable row level security;
alter table participants enable row level security;
alter table registrations enable row level security;
alter table checkins enable row level security;
