"""
iNaturalist ingestion script.

Pulls research-grade observations for a park's bounding box over a date range
and returns normalized records ready for the scoring pipeline.

API docs: https://api.inaturalist.org/v1/docs/
Rate limit: 100 req/min unauthenticated, 1000/min authenticated.
iNaturalist caps results at 10,000 per query (page 1–50 × 200/page).
We work around this by chunking requests into yearly windows.
"""

import time
import logging
from datetime import date
from typing import Iterator

import requests

BASE_URL = "https://api.inaturalist.org/v1"
PAGE_SIZE = 200
MAX_PAGE = 50  # hard API limit

logger = logging.getLogger(__name__)


def fetch_observations(
    bbox: dict,
    taxon_ids: list[int] | None = None,
    d1: date | None = None,
    d2: date | None = None,
    quality_grade: str = "research",
) -> Iterator[dict]:
    """
    Yield normalized iNaturalist observation dicts for a bounding box.

    Automatically chunks by year to work around the API's 10,000-result cap.
    """
    if d1 is None:
        d1 = date.today().replace(year=date.today().year - 5)
    if d2 is None:
        d2 = date.today()

    # Build year-by-year chunks so no single query exceeds 10k results
    chunks: list[tuple[date, date]] = []
    chunk_start = d1
    while chunk_start <= d2:
        chunk_end = min(date(chunk_start.year, 12, 31), d2)
        chunks.append((chunk_start, chunk_end))
        chunk_start = date(chunk_start.year + 1, 1, 1)

    seen_ids: set[str] = set()

    for chunk_d1, chunk_d2 in chunks:
        logger.info("iNat chunk %s → %s", chunk_d1, chunk_d2)
        yield from _fetch_window(
            bbox, chunk_d1, chunk_d2, quality_grade, taxon_ids, seen_ids
        )


def _fetch_window(
    bbox: dict,
    d1: date,
    d2: date,
    quality_grade: str,
    taxon_ids: list[int] | None,
    seen_ids: set[str],
) -> Iterator[dict]:
    params: dict = {
        "nelat": bbox["north"],
        "nelng": bbox["east"],
        "swlat": bbox["south"],
        "swlng": bbox["west"],
        "quality_grade": quality_grade,
        "d1": d1.isoformat(),
        "d2": d2.isoformat(),
        "per_page": PAGE_SIZE,
        "order": "desc",
        "order_by": "observed_on",
    }
    if taxon_ids:
        params["taxon_id"] = ",".join(str(t) for t in taxon_ids)

    page = 1
    window_fetched = 0

    while page <= MAX_PAGE:
        params["page"] = page
        resp = requests.get(f"{BASE_URL}/observations", params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()

        results = data.get("results", [])
        if not results:
            break

        for obs in results:
            obs_id = str(obs["id"])
            if obs_id not in seen_ids:
                seen_ids.add(obs_id)
                yield _normalize(obs)

        window_fetched += len(results)
        total_available = data.get("total_results", 0)
        logger.info(
            "  page %d — window %d / %d (total available)",
            page, window_fetched, total_available,
        )

        if window_fetched >= total_available or window_fetched >= MAX_PAGE * PAGE_SIZE:
            break

        page += 1
        time.sleep(0.7)  # stay well under 100 req/min


def _normalize(obs: dict) -> dict:
    loc = obs.get("location", "")
    lat, lng = (float(x) for x in loc.split(",")) if loc else (None, None)
    taxon = obs.get("taxon") or {}

    return {
        "source": "inat",
        "source_id": str(obs["id"]),
        "taxon_id": taxon.get("id"),
        "taxon_name": taxon.get("name"),
        "common_name": taxon.get("preferred_common_name"),
        "taxon_rank": taxon.get("rank"),
        "iconic_taxon": taxon.get("iconic_taxon_name"),
        "observed_on": obs.get("observed_on"),
        "lat": lat,
        "lng": lng,
        "quality_grade": obs.get("quality_grade"),
        "photo_url": _first_photo(obs),
        "place_guess": obs.get("place_guess"),
    }


def _first_photo(obs: dict) -> str | None:
    photos = obs.get("photos", [])
    if not photos:
        return None
    url = photos[0].get("url", "")
    return url.replace("square", "medium") if url else None
