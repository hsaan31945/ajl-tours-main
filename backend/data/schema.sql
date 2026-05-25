-- Supabase SQL Schema for Project Migration

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: divisions
create table if not exists divisions (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  banner_image text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Table: users (extends or complements Supabase Auth)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text unique not null,
  phone text,
  role text check (role in ('user', 'admin')) default 'user',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Table: tours
create table if not exists tours (
  id uuid default uuid_generate_v4() primary key,
  division_id uuid references divisions(id),
  name text not null,
  description text,
  price numeric not null check (price >= 0),
  start_date timestamptz not null,
  end_date timestamptz not null,
  start_location text not null,
  end_location text not null,
  route_details text,
  min_tickets_per_booking integer default 1 check (min_tickets_per_booking >= 1),
  max_total_tickets integer check (max_total_tickets >= 1),
  images text[],
  is_active boolean default true,
  metadata jsonb default '{}'::jsonb,
  itinerary jsonb default '[]'::jsonb,
  date_prices jsonb default '{}'::jsonb,
  duration text default '12 hours',
  tour_type text default 'Day Tour, Private Tour',
  review_text text default 'No reviews yet',
  highlights text[],
  included text[],
  excluded text[],
  overview text,
  pickup_locations jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Table: bookings
create table if not exists bookings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid, -- Reference to profiles(id)
  tour_id uuid references tours(id),
  name text not null,
  email text not null,
  phone text,
  travelers integer default 1,
  special_requests text,
  tour_title text,
  total_price numeric not null,
  trip_date timestamptz not null,
  address text,
  location jsonb, -- {lat, lng}
  payment_status text default 'unpaid',
  stripe_payment_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Table: homepage_content
create table if not exists homepage_content (
  id uuid default uuid_generate_v4() primary key,
  section text unique not null,
  content jsonb default '{}'::jsonb,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Table: admins
create table if not exists admins (
  id uuid default uuid_generate_v4() primary key,
  username text unique not null,
  email text unique not null,
  password text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Table: tour_highlights
create table if not exists tour_highlights (
  id uuid default uuid_generate_v4() primary key,
  tour_id uuid references tours(id) on delete cascade,
  value text not null,
  "order" integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Table: tour_included
create table if not exists tour_included (
  id uuid default uuid_generate_v4() primary key,
  tour_id uuid references tours(id) on delete cascade,
  value text not null,
  "order" integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Table: tour_excluded
create table if not exists tour_excluded (
  id uuid default uuid_generate_v4() primary key,
  tour_id uuid references tours(id) on delete cascade,
  value text not null,
  "order" integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Table: tour_itinerary
create table if not exists tour_itinerary (
  id uuid default uuid_generate_v4() primary key,
  tour_id uuid references tours(id) on delete cascade,
  title text,
  description text,
  duration text,
  location text,
  activities text[],
  "order" integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_divisions_updated_at before update on divisions for each row execute procedure update_updated_at_column();
create trigger update_profiles_updated_at before update on profiles for each row execute procedure update_updated_at_column();
create trigger update_tours_updated_at before update on tours for each row execute procedure update_updated_at_column();
create trigger update_bookings_updated_at before update on bookings for each row execute procedure update_updated_at_column();
create trigger update_homepage_content_updated_at before update on homepage_content for each row execute procedure update_updated_at_column();
create trigger update_admins_updated_at before update on admins for each row execute procedure update_updated_at_column();
create trigger update_tour_highlights_updated_at before update on tour_highlights for each row execute procedure update_updated_at_column();
create trigger update_tour_included_updated_at before update on tour_included for each row execute procedure update_updated_at_column();
create trigger update_tour_excluded_updated_at before update on tour_excluded for each row execute procedure update_updated_at_column();
create trigger update_tour_itinerary_updated_at before update on tour_itinerary for each row execute procedure update_updated_at_column();

-- Row Level Security (RLS)
alter table divisions enable row level security;
alter table profiles enable row level security;
alter table tours enable row level security;
alter table bookings enable row level security;
alter table homepage_content enable row level security;
alter table admins enable row level security;
alter table tour_highlights enable row level security;
alter table tour_included enable row level security;
alter table tour_excluded enable row level security;
alter table tour_itinerary enable row level security;

create policy "Allow all access to everyone for now" on divisions for all using (true);
create policy "Allow all access to everyone for now" on profiles for all using (true);
create policy "Allow all access to everyone for now" on tours for all using (true);
create policy "Allow all access to everyone for now" on bookings for all using (true);
create policy "Allow all access to everyone for now" on homepage_content for all using (true);
create policy "Allow all access to everyone for now" on admins for all using (true);
create policy "Allow all access to everyone for now" on tour_highlights for all using (true);
create policy "Allow all access to everyone for now" on tour_included for all using (true);
create policy "Allow all access to everyone for now" on tour_excluded for all using (true);
create policy "Allow all access to everyone for now" on tour_itinerary for all using (true);
