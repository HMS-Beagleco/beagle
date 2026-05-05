"""
NPS (National Park Service) trail conditions ingestion.

Pulls trail alerts, closures, and conditions via the NPS API.
Requires a free API key: https://www.nps.gov/subjects/developer/get-started.htm
"""

import logging
import os
from typing import Iterator

import requests

BASE_URL = "https://developer.nps.gov/api/v1"

logger = logging.getLogger(__name__)


def _headers() -> dict:
    key = os.environ.get("NPS_API_KEY")
    if not key:
        raise EnvironmentError("NPS_API_KEY environment variable not set")
    return {"X-Api-Key": key}


def fetch_alerts(park_code: str) -> Iterator[dict]:
    """Yield current alerts (closures, hazards) for a park."""
    params = {"parkCode": park_code, "limit": 50}
    resp = requests.get(f"{BASE_URL}/alerts", headers=_headers(), params=params, timeout=30)
    resp.raise_for_status()

    for alert in resp.json().get("data", []):
        yield {
            "source": "nps_alert",
            "park_code": park_code,
            "title": alert.get("title"),
            "description": alert.get("description"),
            "category": alert.get("category"),
            "url": alert.get("url"),
        }


def fetch_visitor_centers(park_code: str) -> list[dict]:
    """Return visitor center info — useful for geocoding park entrances."""
    params = {"parkCode": park_code, "limit": 10}
    resp = requests.get(
        f"{BASE_URL}/visitorcenters", headers=_headers(), params=params, timeout=30
    )
    resp.raise_for_status()
    return resp.json().get("data", [])


def fetch_park_info(park_code: str) -> dict | None:
    """Return basic park metadata from NPS API."""
    params = {"parkCode": park_code, "limit": 1}
    resp = requests.get(f"{BASE_URL}/parks", headers=_headers(), params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json().get("data", [])
    return data[0] if data else None
