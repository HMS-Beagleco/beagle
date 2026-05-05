"""
OpenStreetMap Overpass API — trailhead ingestion.

Fetches named trailheads within a park bounding box.
No API key required. Rate limit: 1 req/2s recommended.

Overpass API docs: https://wiki.openstreetmap.org/wiki/Overpass_API
"""

import hashlib
import logging
import time
import urllib.parse

import requests

OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.openstreetmap.ru/api/interpreter",
]

_HEADERS = {
    "User-Agent": "BeagleWildlifeApp/1.0 (wildlife trail intelligence)",
    "Accept": "*/*",
    "Content-Type": "application/x-www-form-urlencoded",
}

logger = logging.getLogger(__name__)


def _post_query(query: str) -> dict:
    """POST an Overpass QL query, trying each endpoint until one succeeds."""
    payload = urllib.parse.urlencode({"data": query.strip()})
    for url in OVERPASS_ENDPOINTS:
        try:
            resp = requests.post(url, data=payload, headers=_HEADERS, timeout=90)
            resp.raise_for_status()
            return resp.json()
        except requests.exceptions.HTTPError as e:
            logger.warning("Overpass endpoint %s returned %s, trying next", url, e.response.status_code)
            time.sleep(2)
        except requests.exceptions.RequestException as e:
            logger.warning("Overpass endpoint %s failed: %s, trying next", url, e)
            time.sleep(2)
    raise RuntimeError("All Overpass endpoints failed")


def fetch_trailheads(bbox: dict, park_id: str) -> list[dict]:
    """
    Return trailhead dicts for a park bounding box.

    Queries for OSM nodes tagged as trailheads or trail starts.
    Falls back to prominent named path/track nodes if sparse results.
    """
    south, west, north, east = bbox["south"], bbox["west"], bbox["north"], bbox["east"]
    bounds = f"{south},{west},{north},{east}"

    query = f"""[out:json][timeout:60];
(
  node["tourism"="trailhead"]({bounds});
  node["highway"="trailhead"]({bounds});
  node["trailhead"="yes"]({bounds});
  node["amenity"="trailhead"]({bounds});
);
out body;"""
    data = _post_query(query)
    elements = data.get("elements", [])

    trailheads = []
    for el in elements:
        tags = el.get("tags", {})
        name = (
            tags.get("name")
            or tags.get("trailhead:name")
            or tags.get("ref")
        )
        if not name:
            continue

        osm_id = el["id"]
        th_id = f"{park_id}-{hashlib.md5(f'{osm_id}'.encode()).hexdigest()[:8]}"

        trailheads.append({
            "id": th_id,
            "park_id": park_id,
            "name": name,
            "lat": el["lat"],
            "lng": el["lon"],
            "osm_id": osm_id,
        })

    logger.info("  %d trailheads found for %s", len(trailheads), park_id)

    # If OSM has sparse trailhead data for this park, supplement with
    # trail access points (highway=path nodes with names near park entrances)
    if len(trailheads) < 3:
        logger.info("  Sparse results — querying named trail access points")
        trailheads.extend(_fetch_trail_access_points(bounds, park_id, existing=trailheads))

    return trailheads


def _fetch_trail_access_points(bounds: str, park_id: str, existing: list) -> list[dict]:
    """Fallback: named nodes on hiking paths near park boundaries."""
    query = f"""[out:json][timeout:60];
node["highway"="path"]["name"]({bounds});
out body 30;"""
    time.sleep(2)
    try:
        data = _post_query(query)
    except RuntimeError:
        return []

    existing_names = {t["name"] for t in existing}
    elements = data.get("elements", [])
    results = []

    for el in elements[:20]:
        name = el.get("tags", {}).get("name", "")
        if not name or name in existing_names:
            continue
        osm_id = el["id"]
        th_id = f"{park_id}-{hashlib.md5(f'ap-{osm_id}'.encode()).hexdigest()[:8]}"
        results.append({
            "id": th_id,
            "park_id": park_id,
            "name": name,
            "lat": el["lat"],
            "lng": el["lon"],
            "osm_id": osm_id,
        })

    return results
