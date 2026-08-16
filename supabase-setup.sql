-- ============================================================
-- VASILIKI RACE — Supabase Database Setup
-- Run this in: supabase.com → your project → SQL Editor → New query
-- ============================================================

-- Profiles (auto-created on user signup)
create table if not exists public.profiles (
  id         uuid references auth.users on delete cascade primary key,
  email      text not null,
  full_name  text,
  phone      text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users view own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Registrations
create table if not exists public.registrations (
  id                     uuid default gen_random_uuid() primary key,
  user_id                uuid references auth.users on delete set null,
  race_year              integer not null default extract(year from now()),
  race_category          text not null check (race_category in ('road','mountain')),
  full_name              text not null,
  email                  text not null,
  phone                  text,
  date_of_birth          date,
  gender                 text check (gender in ('male','female','other')),
  tshirt_size            text check (tshirt_size in ('XS','S','M','L','XL','XXL')),
  emergency_contact_name  text,
  emergency_contact_phone text,
  medical_declaration    boolean default false,
  payment_status         text not null default 'pending'
                         check (payment_status in ('pending','paid','refunded','cancelled')),
  stripe_payment_id      text,
  notes                  text,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);
alter table public.registrations enable row level security;
create policy "Users view own registrations"   on public.registrations for select using (auth.uid() = user_id);
create policy "Users insert own registrations" on public.registrations for insert with check (auth.uid() = user_id);

-- Admin can see and update all (replace with your actual admin email)
create policy "Admin select all" on public.registrations for select
  using (auth.email() = 'YOUR_ADMIN_EMAIL');
create policy "Admin update all" on public.registrations for update
  using (auth.email() = 'YOUR_ADMIN_EMAIL');

-- Contact messages
create table if not exists public.contact_messages (
  id         uuid default gen_random_uuid() primary key,
  name       text not null,
  email      text not null,
  subject    text,
  message    text not null,
  created_at timestamptz default now()
);
alter table public.contact_messages enable row level security;
create policy "Anyone can insert contact" on public.contact_messages for insert with check (true);
create policy "Admin reads contacts" on public.contact_messages for select
  using (auth.email() = 'YOUR_ADMIN_EMAIL');
