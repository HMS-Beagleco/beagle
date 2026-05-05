-- Trailheads (sourced from OpenStreetMap Overpass API)
create table trailheads (
  id text primary key,
  park_id text references parks(id) on delete cascade,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  osm_id bigint,
  location geography(Point, 4326) generated always as (
    st_point(lng, lat)::geography
  ) stored,
  created_at timestamptz default now()
);

create index trailheads_park on trailheads(park_id);
create index trailheads_location on trailheads using gist(location);

-- Wildlife probability scores per trailhead × species × month
create table trailhead_probability (
  trailhead_id text references trailheads(id) on delete cascade,
  species_id text references species(id) on delete cascade,
  month smallint not null check (month between 1 and 12),
  score double precision not null check (score between 0 and 1),
  raw_count integer not null default 0,
  weighted_count double precision not null default 0,
  last_computed timestamptz default now(),
  primary key (trailhead_id, species_id, month)
);

create index trailhead_prob_trailhead on trailhead_probability(trailhead_id);
create index trailhead_prob_species on trailhead_probability(species_id, month);
