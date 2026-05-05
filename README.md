# Beagle — Wildlife Trail Intelligence

Find the best times and places to see specific wildlife in North American national parks.

## Structure

```
Beagle/
├── web/          # Next.js 15 frontend (App Router, Tailwind, TypeScript)
├── pipeline/     # Python data pipeline (iNaturalist, eBird, NPS ingestion)
└── supabase/     # Database schema and migrations
```

## Setup

### Web

```bash
cd web
cp .env.local.example .env.local
# Fill in your Supabase and Mapbox keys
npm install
npm run dev
```

### Pipeline

```bash
cd pipeline
pip install -r requirements.txt

# Set API keys
export EBIRD_API_KEY=your_key
export NPS_API_KEY=your_key
# iNaturalist API is public — no key required for read access

# Run for 3 test parks
python run.py --parks yellowstone grand-teton glacier
```

## Phase Status

- [x] Phase 0 — Spec & Prototype
- [ ] Phase 1 — Data Pipeline ← *current*
- [ ] Phase 2 — Core Site Build
- [ ] Phase 3 — Content & Launch
- [ ] Phase 4 — Community & Iteration

## API Keys Needed

| Service     | Where to get it                          | Required by  |
|-------------|------------------------------------------|--------------|
| eBird       | https://ebird.org/api/keygen             | Pipeline     |
| NPS         | https://www.nps.gov/subjects/developer   | Pipeline     |
| Supabase    | https://supabase.com                     | Web + Pipeline|
| Mapbox      | https://account.mapbox.com               | Web          |

iNaturalist read API is public — no key needed.
