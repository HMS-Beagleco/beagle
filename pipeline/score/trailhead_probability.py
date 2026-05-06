"""
Trailhead-level wildlife probability scoring.

Algorithm:
    1. Assign each observation to the nearest trailhead within PROXIMITY_KM.
    2. For each species ever observed at a trailhead, compute a trail affinity:
           affinity = (species_obs_at_trail / total_wildlife_at_trail)
                    / (species_annual_rate_in_park)
       Computed annually (all months pooled) to stabilize small sample sizes.
    3. Final monthly score:
           score = park_monthly_rate(species, month) × affinity
       Hard floor: species never observed at trail → score = 0.
       Cap at SCORE_CAP to avoid false certainty.

Shoulder months: if a species was seen at a trail in June and August but
not July, July still gets a non-zero score because the affinity carries
forward via the park's July rate.
"""

import math
from collections import defaultdict
from typing import NamedTuple

PROXIMITY_KM = 3.0
SCORE_CAP = 0.95


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
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2)
    return R * 2 * math.asin(math.sqrt(a))


def find_nearest_trailhead(
    lat: float, lng: float, trailheads: list[dict]
) -> tuple[str, float] | tuple[None, None]:
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
    park_monthly_rates: dict[tuple[str, int], float],
) -> list[TrailheadScore]:
    """
    Score trailhead × species × month using the affinity model.

    Args:
        observations: enriched wildlife observations for the park.
        trailheads: list of trailhead dicts with id/lat/lng.
        park_monthly_rates: {(species_slug, month): detection_rate} from
            build_probability_matrix — used as the park-level prior.
    """
    if not trailheads:
        return []

    # --- Step 1: assign observations to trailheads ---
    th_obs: defaultdict[str, list[dict]] = defaultdict(list)

    for obs in observations:
        lat = obs.get("lat")
        lng = obs.get("lng")
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
            year = 2023
        th_obs[th_id].append({
            "species": species,
            "month": month,
            "weight": 2.0 if year >= 2024 else 1.0,
        })

    # --- Step 2: park annual detection rate per species ---
    # Average the non-zero monthly rates to get a stable annual baseline.
    park_species_rate_sum: defaultdict[str, float] = defaultdict(float)
    park_species_month_count: defaultdict[str, int] = defaultdict(int)
    for (species, month), rate in park_monthly_rates.items():
        if rate > 0:
            park_species_rate_sum[species] += rate
            park_species_month_count[species] += 1

    park_annual_rate: dict[str, float] = {
        s: park_species_rate_sum[s] / park_species_month_count[s]
        for s in park_species_rate_sum
        if park_species_month_count[s] > 0
    }

    # --- Step 3: affinity and final scores per trailhead ---
    scores: list[TrailheadScore] = []

    for th_id, obs_list in th_obs.items():
        total_trail_weight = sum(o["weight"] for o in obs_list)
        if total_trail_weight == 0:
            continue

        # Pool all months to compute annual trail detection rate per species
        species_trail_weight: defaultdict[str, float] = defaultdict(float)
        species_month_raw: defaultdict[tuple[str, int], int] = defaultdict(int)
        species_month_weight: defaultdict[tuple[str, int], float] = defaultdict(float)

        for o in obs_list:
            species_trail_weight[o["species"]] += o["weight"]
            species_month_raw[(o["species"], o["month"])] += 1
            species_month_weight[(o["species"], o["month"])] += o["weight"]

        for species, trail_total_w in species_trail_weight.items():
            trail_annual_rate = trail_total_w / total_trail_weight
            p_annual = park_annual_rate.get(species, 0.0)
            if p_annual <= 0:
                continue

            affinity = trail_annual_rate / p_annual

            # Emit one score per month — hard floor enforced by only iterating
            # species that were actually seen at this trail
            for month in range(1, 13):
                p_month = park_monthly_rates.get((species, month), 0.0)
                if p_month <= 0:
                    continue  # species not active in park this month

                final_score = min(p_month * affinity, SCORE_CAP)

                scores.append(TrailheadScore(
                    trailhead_id=th_id,
                    species_slug=species,
                    month=month,
                    score=round(final_score, 6),
                    raw_count=species_month_raw[(species, month)],
                    weighted_count=round(species_month_weight[(species, month)], 4),
                ))

    return sorted(scores, key=lambda s: (-s.score, s.trailhead_id, s.species_slug))
