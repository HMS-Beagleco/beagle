# Beagle — Wildlife Trail Intelligence

Find the best times and places to see specific wildlife in North American national parks.

**Live site:** https://beagle-guide.vercel.app

---

## Structure

```
Beagle/
├── web/          # Next.js 15 frontend (App Router, Tailwind, TypeScript)
├── pipeline/     # Python data pipeline (iNaturalist, eBird, NPS, OpenStreetMap)
└── supabase/     # Database schema and migrations (future use)
```

## Setup

### Web

```bash
cd web
cp .env.local.example .env.local
# Fill in your Supabase keys (maps use OpenStreetMap — no API key needed)
npm install
npm run dev
```

### Pipeline

```bash
cd pipeline
pip install -r requirements.txt

# API keys required:
export EBIRD_API_KEY=your_key
export NPS_API_KEY=your_key
# iNaturalist and OpenStreetMap Overpass are public — no keys required

# Run for specific parks
python run.py --parks yellowstone grand-teton glacier

# Run all 10 launch parks
python run.py --all
```

## Maps

Maps use **Leaflet + OpenStreetMap** tiles. No API key or account required.

## Phase Status

- [x] Phase 0 — Spec & Prototype
- [x] Phase 1 — Data Pipeline (iNat, eBird, NPS alerts, OSM trailheads)
- [x] Phase 2 — Core Site Build (park pages, species pages, trailhead map, scoring)
- [ ] Phase 3 — Conditions & Planning (weather, trail conditions, trip planner) ← *current*
- [ ] Phase 4 — Community & Iteration (user sightings, photo uploads)

## API Keys

| Service     | Where to get it                        | Used by       |
|-------------|----------------------------------------|---------------|
| eBird       | https://ebird.org/api/keygen           | Pipeline      |
| NPS         | https://www.nps.gov/subjects/developer | Pipeline      |
| Supabase    | https://supabase.com                   | Web + Pipeline|

iNaturalist and OpenStreetMap are public APIs — no keys needed.

## Deployment

**Deploy to production:**
```bash
# From the repo root (not from web/)
vercel --prod
```

The Vercel project Root Directory is set to `web`, so this must be run from the repo root (`Beagle/`), not from inside `web/`.
