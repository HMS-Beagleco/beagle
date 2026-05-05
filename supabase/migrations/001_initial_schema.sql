-- Enable PostGIS for geospatial queries
create extension if not exists postgis;

-- Parks
create table parks (
  id text primary key,
  slug text unique not null,
  name text not null,
  state text not null,
  description text,
  nps_park_code text unique not null,
  bbox_north double precision not null,
  bbox_south double precision not null,
  bbox_east double precision not null,
  bbox_west double precision not null,
  image_url text,
  created_at timestamptz default now()
);

-- Species
create table species (
  id text primary key,
  slug text unique not null,
  common_name text not null,
  scientific_name text not null,
  taxon_id_inat integer,
  ebird_species_code text,
  taxon_group text not null check (
    taxon_group in ('mammal','bird','reptile','amphibian','fish','invertebrate','plant','fungi','other')
  ),
  description text,
  image_url text,
  created_at timestamptz default now()
);

-- Observations (raw, de-duplicated across sources)
create table observations (
  id uuid primary key default gen_random_uuid(),
  park_id text references parks(id) on delete cascade,
  species_id text references species(id) on delete cascade,
  source text not null check (source in ('inat','ebird','community')),
  source_id text,
  observed_on date not null,
  month smallint generated always as (extract(month from observed_on)::smallint) stored,
  year smallint generated always as (extract(year from observed_on)::smallint) stored,
  location geography(Point, 4326),
  quality_grade text,
  photo_url text,
  trail_name text,
  place_guess text,
  created_at timestamptz default now(),
  unique (source, source_id)
);

create index observations_park_species on observations(park_id, species_id);
create index observations_month on observations(month);
create index observations_location on observations using gist(location);

-- Wildlife Probability Matrix (pre-computed scores)
create table wildlife_probability (
  park_id text references parks(id) on delete cascade,
  species_id text references species(id) on delete cascade,
  month smallint not null check (month between 1 and 12),
  score double precision not null check (score between 0 and 1),
  raw_count integer not null default 0,
  weighted_count double precision not null default 0,
  last_computed timestamptz default now(),
  primary key (park_id, species_id, month)
);

-- Trail reports (NPS + community)
create table trail_reports (
  id uuid primary key default gen_random_uuid(),
  park_id text references parks(id) on delete cascade,
  trail_name text not null,
  trail_slug text not null,
  conditions text not null check (conditions in ('open','closed','caution','unknown')),
  source text not null check (source in ('nps','community')),
  notes text,
  reported_at timestamptz not null,
  created_at timestamptz default now()
);

create index trail_reports_park on trail_reports(park_id);

-- Community sighting reports (Phase 4)
create table sighting_reports (
  id uuid primary key default gen_random_uuid(),
  park_id text references parks(id) on delete cascade,
  species_id text references species(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  observed_at timestamptz not null,
  location geography(Point, 4326),
  trail_name text,
  notes text,
  photo_url text,
  verified boolean default false,
  created_at timestamptz default now()
);

-- Row-level security: sighting reports are public read, authenticated write
alter table sighting_reports enable row level security;

create policy "Anyone can read sighting reports"
  on sighting_reports for select using (true);

create policy "Authenticated users can insert sighting reports"
  on sighting_reports for insert
  with check (auth.uid() = user_id);
