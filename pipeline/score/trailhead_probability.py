"""
Trailhead-level wildlife probability scoring.

For each observation with lat/lng, associates it with the nearest trailhead
within a proximity threshold, then scores trailhead × species × month.
"""

import math
from collections import defaultdict
from datetime import date
from typing import NamedTuple

PROXIMITY_KM = 3.0  # max distance to associate an obs with a trailhead


class TrailheadScore(NamedTuple):
    trailhead_id: str
    species_slug: str
    month: int
    score: float
    raw_count: int
    weighted_count: float


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def find_nearest_trailhead(
    lat: float, lng: float, trailheads: list[dict]
) -> tuple[str, float] | tuple[None, None]:
    """Return (trailhead_id, distance_km) for the nearest trailhead within threshold."""
    best_id, best_dist = None, float("inf")
    for th in trailheads:
        d = haversine_km(lat, lng, th["lat"], th["lng"])
        if d < best_dist:
            best_dist = d
            best_id = th["id"]
    if best_dist <= PROXIMITY_KM:
        return best_id, best_dist
    return None, None


def build_trailhead_probability_matrix(
    observations: list[dict],
    trailheads: list[dict],
    recency_cutoff_years: int = 2,
) -> list[TrailheadScore]:
    """
    Score each trailhead × species × month from enriched observations.

    Only observations with valid lat/lng within PROXIMITY_KM of a trailhead
    are included.
    """
    if not trailheads:
        return []

    current_year = date.today().year
    cutoff_year = current_year - recency_cutoff_years

    weighted: defaultdict[tuple[str, str, int], float] = defaultdict(float)
    raw: defaultdict[tuple[str, str, int], int] = defaultdict(int)

    for obs in observations:
        lat, lng = obs.get("lat"), obs.get("lng")
        species = obs.get("species_slug")
        month = obs.get("month")
        observed_on = obs.get("observed_on", "")

        if not all([lat, lng, species, month]):
            continue

        th_id, _ = find_nearest_trailhead(float(lat), float(lng), trailheads)
        if th_id is None:
            continue

        try:
            year = int(observed_on[:4])
        except (TypeError, ValueError):
            year = current_year - 3

        weight = 2.0 if year >= cutoff_year else 1.0
        key = (th_id, species, month)
        weighted[key] += weight
        raw[key] += 1

    # Normalize per-trailhead to 0–1.0
    th_max: dict[str, float] = defaultdict(float)
    for (th_id, _, _), w in weighted.items():
        th_max[th_id] = max(th_max[th_id], w)

    scores = []
    for (th_id, species, month), w in weighted.items():
        max_w = th_max[th_id]
        score = round(w / max_w, 4) if max_w > 0 else 0.0
        scores.append(TrailheadScore(
            trailhead_id=th_id,
            species_slug=species,
            month=month,
            score=score,
            raw_count=raw[(th_id, species, month)],
            weighted_count=round(w, 4),
        ))

    return sorted(scores, key=lambda s: (-s.score, s.trailhead_id, s.species_slug))
