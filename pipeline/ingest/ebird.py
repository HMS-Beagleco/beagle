"""
eBird ingestion script.

Pulls species frequency data by region and recent notable sightings.
Uses eBird API 2.0 — requires a free API key from Cornell Lab.

API docs: https://documenter.getpostman.com/view/664302/S1ENwy59
"""

import logging
import os
import time
from typing import Iterator

import requests

BASE_URL = "https://api.ebird.org/v2"

logger = logging.getLogger(__name__)


def _headers() -> dict:
    key = os.environ.get("EBIRD_API_KEY")
    if not key:
        raise EnvironmentError("EBIRD_API_KEY environment variable not set")
    return {"X-eBirdApiToken": key}


def fetch_species_frequency(region_code: str) -> list[dict]:
    """
    Return species frequency records for a region.

    region_code examples: "US-WY", "US-MT-049"
    Returns a list of {speciesCode, comName, sciName, ...} dicts.
    """
    url = f"{BASE_URL}/product/spplist/{region_code}"
    resp = requests.get(url, headers=_headers(), timeout=30)
    resp.raise_for_status()
    return resp.json()


def fetch_recent_observations(
    region_code: str,
    days_back: int = 30,
) -> Iterator[dict]:
    """
    Yield recent eBird observations for a region.

    Useful for "what's been spotted lately" trail report sections.
    """
    params = {"back": days_back, "maxResults": 10000}
    url = f"{BASE_URL}/data/obs/{region_code}/recent"
    resp = requests.get(url, headers=_headers(), params=params, timeout=30)
    resp.raise_for_status()

    for obs in resp.json():
        yield _normalize(obs)


def fetch_hotspot_frequency(
    lat: float,
    lng: float,
    dist_km: int = 25,
) -> list[dict]:
    """
    Return species+frequency records for eBird hotspots near a point.

    Used to supplement regional data with hotspot-level density.
    """
    params = {"lat": lat, "lng": lng, "dist": dist_km, "fmt": "json"}
    url = f"{BASE_URL}/ref/hotspot/geo"
    resp = requests.get(url, headers=_headers(), params=params, timeout=30)
    resp.raise_for_status()

    hotspots = resp.json()
    results = []

    for hs in hotspots[:20]:  # cap to avoid excessive requests
        loc_id = hs.get("locId")
        if not loc_id:
            continue
        freq_url = f"{BASE_URL}/product/checklist/view/{loc_id}"
        freq_resp = requests.get(freq_url, headers=_headers(), timeout=30)
        if freq_resp.ok:
            results.extend(freq_resp.json().get("obs", []))
        time.sleep(0.3)

    return results


def _normalize(obs: dict) -> dict:
    return {
        "source": "ebird",
        "source_id": obs.get("subId"),
        "species_code": obs.get("speciesCode"),
        "common_name": obs.get("comName"),
        "scientific_name": obs.get("sciName"),
        "observed_on": obs.get("obsDt", "")[:10],
        "count": obs.get("howMany"),
        "lat": obs.get("lat"),
        "lng": obs.get("lng"),
        "location_name": obs.get("locName"),
        "location_id": obs.get("locId"),
    }
