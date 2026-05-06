# Beagle — Claude Context

> **How to use this file:** This is auto-loaded by Claude Code at session start. Read it fully before touching any code. When context gets compressed mid-session, re-read this file (`Read /Users/scottcarpenter/Documents/Beagle/CLAUDE.md`) to re-orient. Keep sessions focused on one feature at a time to minimize compression.

Beagle is a wildlife trail intelligence platform. Users pick a national park and a species (or browse what's active this month) and get probability scores for when and where to see that wildlife, down to individual trailheads.

Live site: **https://beagle-guide.vercel.app**
GitHub: **https://github.com/HMS-Beagleco/beagle**
Repo root: `/Users/scottcarpenter/Documents/Beagle`

---

## Repo layout

```
Beagle/
├── pipeline/          # Python data pipeline — runs locally, writes JSON to web/
│   ├── run.py         # Entry point: python run.py --all  or  --parks yellowstone
│   ├── config/parks.json
│   ├── ingest/        # inat.py, ebird.py, nps.py, overpass.py
│   ├── transform/     # normalize.py  (slug canonicalization, enrichment)
│   ├── score/         # probability.py, trailhead_probability.py
│   └── output/        # intermediate JSON (also written to web/src/data/parks/)
├── web/               # Next.js 15 App Router frontend
│   ├── src/app/       # pages
│   ├── src/components/
│   ├── src/lib/       # data.ts, parks.ts, spotlight.ts
│   ├── src/data/parks/  # ← pipeline writes here; git-committed; static at build time
│   └── vercel.json
└── supabase/          # Migrations (schema exists but not in active use yet)
```

---

## Tech stack

- **Frontend**: Next.js 15 App Router, TypeScript, Tailwind CSS
- **Maps**: Leaflet + react-leaflet (dynamic import `ssr: false`)
- **Pipeline**: Python 3.12, requests, python-dotenv
- **Database**: Supabase (PostgreSQL + PostGIS) — schema exists but the site currently reads from static JSON files committed to the repo, not from Supabase
- **Deployment**: Vercel (project: `beagle-guide`, team: `scott-carpenters-projects-a286617f`)

### Brand palette
- Forest `#1B4332` — headings, primary actions
- Sage `#52796F` — secondary text, labels
- Sand `#D4C5A9` — borders, dividers
- Cream `#F5F1EB` — backgrounds, hover states
- Green `#40916C` — high-score indicators, active states

### Next.js conventions used
- `PageProps<'/parks/[parkSlug]'>` generic for typed route params
- `params` is a Promise — always `await props.params`
- All pages are Server Components unless marked `'use client'`
- Map components use `dynamic(() => import(...), { ssr: false })` due to Leaflet's `window` dependency

---

## Data pipeline

### Running it
```bash
cd pipeline
python run.py --all                          # all 10 parks
python run.py --parks yellowstone glacier    # specific parks
python run.py --parks yellowstone --skip-ebird
```

Pipeline writes JSON to both `pipeline/output/<park>.json` and `web/src/data/parks/<park>.json`. The web data files are committed to git — the site reads them at build time as static data.

### Data sources
| Source | What we pull | Key detail |
|--------|-------------|------------|
| iNaturalist | Research-grade wildlife observations | Date range: **2024-01-01 to today** (not a 5-year lookback — user preference for fresher data). Chunked by year to stay under the 10k-per-query cap. 4-attempt retry with exponential backoff (10/20/40s) for timeouts. |
| eBird | Recent bird observations by state region | Uses `ebird_region` from parks.json (e.g. `US-WY`) |
| NPS Alerts API | Current park closures and notices | Uses `nps_code` from parks.json |
| OpenStreetMap Overpass | Trailhead locations | Multi-endpoint fallback; custom User-Agent header required (API returns 406 otherwise) |

### Scoring model (important — was overhauled)

**Park-level scores** (`pipeline/score/probability.py`):
```
score = weighted_obs(species, park, month) / weighted_total_wildlife_obs(park, month)
```
This is a detection rate: "of all wildlife observed in this park this month, what fraction are species X?" Observations from the last 2 years are weighted 2×.

**Trailhead-level scores** (`pipeline/score/trailhead_probability.py`):
```
affinity = (trail_annual_species_rate) / (park_annual_species_rate)
score    = park_monthly_rate(species, month) × affinity
```
- Hard floor: species never observed at a trail → score = 0
- Shoulder months: if seen in June and August, July gets a non-zero score via park rate × affinity
- Cap at 0.95

### Species canonicalization
iNaturalist returns regional subspecies (e.g. `shiras-moose`, `california-black-bear`). `pipeline/transform/normalize.py` has a `CANONICAL_SLUGS` dict that collapses these to trip-planner names (`moose`, `black-bear`). `None` means exclude entirely (taxonomic group nodes like `holarctic-bears`).

The same map is mirrored in `web/src/lib/data.ts` for the cross-park aggregation functions.

---

## Web app — page structure

| Route | What it does |
|-------|-------------|
| `/` | Landing page |
| `/parks` | Grid of all 10 parks |
| `/parks/[parkSlug]` | Park hub: NPS alerts, wildlife map with trailhead scores, browse by month, top species grid |
| `/parks/[parkSlug]/wildlife/[month]` | All species ranked for a given month |
| `/parks/[parkSlug]/[speciesSlug]` | Species × park: peak month, map pre-filtered to that species, seasonality chart, monthly table |
| `/wildlife` | Cross-park species search + "species of the day" featured cards |
| `/wildlife/[speciesSlug]` | Species across all parks: where and when to see it |

### Key components
- `ParkMapSection` (`components/maps/`) — client component wrapping Leaflet map. Month selector, species filter with spotlight pills + "More species ▼" dropdown. Props: `trailheads`, `trailheadScores`, `topSpecies`, `spotlightSlugs`, `parkCenter`, `parkZoom`, `initialMonth`, `initialSpecies?`.
- `ParkMap` — the actual Leaflet map, `ssr: false`.
- `WildlifeSearch` — client component: real-time search bar + featured species cards.
- `SeasonalityChart` — bar chart of monthly scores.
- `ScoreBadge` — color-coded probability display.

### Spotlight species
`web/src/lib/spotlight.ts` has a curated list of charismatic species (grizzly bear, moose, wolves, bald eagle, etc.) shown as primary pill-buttons on the park map. Parks only show species from this list that actually have data. `getSpotlightForPark(availableSlugs)` filters to what's present.

### Static data layer
`web/src/lib/data.ts` reads park JSON files from `web/src/data/parks/` at build time (Node `fs` reads, server-side only). Key functions:
- `getParkSpecies(parkId)` → sorted SpeciesSummary[]
- `getSpeciesSeasonality(parkId, speciesSlug)` → 12-month array
- `getParkTrailheads(parkId)` / `getTrailheadScores(parkId)`
- `getParkCenter(parkId)` → [lat, lng] from trailhead centroid
- `getAllSpecies(currentMonth, parkIds)` → cross-park CrossParkSpecies[]

---

## Deployment

**Vercel GitHub integration is broken** — pushes to GitHub do NOT auto-deploy. The Vercel project was previously connected to a non-existent repo (`HMS-Beagleco/beagle-guide` instead of `HMS-Beagleco/beagle`). This has been corrected via `vercel git connect` but auto-deploys may still not work reliably.

**To deploy manually** (the reliable method):
```bash
cd /Users/scottcarpenter/Documents/Beagle   # repo ROOT, not web/
vercel --prod
```
Must run from the repo root because Vercel's project Root Directory is set to `web`. Running from inside `web/` causes it to look for `web/web` and fail.

The Vercel CLI must be installed: `npm install -g vercel`

---

## Current state (as of May 2026)

**Built and live:**
- All 10 launch parks with full wildlife data: Yellowstone, Grand Teton, Glacier, Rocky Mountain, Great Smoky Mountains, Yosemite, Olympic, Denali, Everglades, Acadia
- Park hub pages with trailhead map, species toggles, NPS alerts, browse-by-month
- Species × park pages with seasonality chart, map pre-filtered to that species
- Cross-park wildlife search/discovery tab
- Affinity-based probability scoring (replaced naive observation counting)
- Species deduplication / canonicalization (subspecies collapsed)
- Charismatic species spotlight toggles on maps

**Pending / next up:**
1. **NOAA weather + trail conditions** — was built (weather.ts, WeatherSection.tsx) but reverted pending Vercel deploy issues. Ready to re-add: `fetchParkWeather(lat, lng)` calls `api.weather.gov/points/{lat},{lon}` then the returned forecast URL. No API key needed. `deriveTrailConditions(weather)` converts forecast to trail condition labels. Add `WeatherSection` component between NPS alerts and wildlife map on park hub page.
2. **Sighting tips per species** — ecology/behavior hints (best time of day, habitat, behavior to watch for). Discussed but not started.
3. **Trip planning component** — species + date → suggested trailhead itinerary with conditions. Discussed, not started.
4. **Real-time sightings / user uploads** — Phase 3, requires Supabase Auth.
5. **Fix Vercel auto-deploy** — GitHub integration connected to wrong repo for a long time. May need to be re-verified in Vercel dashboard Settings → Git.

---

## API keys (pipeline/.env)

The pipeline `.env` file has:
- `EBIRD_API_KEY`
- `NPS_API_KEY`

iNaturalist and Overpass APIs are public — no keys needed.
Vercel CLI auth is stored in the local Vercel config after `vercel login`.

---

## Common gotchas

- **Overpass API**: Must use `urllib.parse.urlencode` for the POST body and include a custom `User-Agent` header or get a 406. Three fallback endpoints are configured.
- **iNaturalist timeouts**: Long-running fetches (Rocky Mountain especially) hit timeouts. 4-attempt retry with 10/20/40s exponential backoff is in place.
- **Leaflet SSR**: Any component importing Leaflet must use `dynamic(() => import(...), { ssr: false })` — Leaflet accesses `window` directly.
- **Deploying from wrong directory**: `vercel --prod` must be run from `Beagle/` (repo root), not from `Beagle/web/`. The project Root Directory is `web` on Vercel's side.
- **Supabase is not in active use**: The schema and migrations exist but the site reads from committed JSON files. Supabase is there for future real-time features.
