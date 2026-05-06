"""
Wildlife Probability Matrix scoring.

For each park × species × month, computes a detection rate:
    score = weighted_obs(species, park, month) / weighted_total_wildlife_obs(park, month)

This is a true detection probability: "of all wildlife observed in this park
in this month, what fraction are species X?" Naturally comparable across parks
and months without additional normalization.

Recency weighting: observations within 2 years of today are weighted 2x.
"""

from collections import defaultdict
from datetime import date
from typing import NamedTuple


class ProbabilityScore(NamedTuple):
    park_id: str
    species_slug: str
    month: int
    score: float
    raw_count: int
    weighted_count: float


def build_probability_matrix(
    observations: list[dict],
    recency_cutoff_years: int = 2,
) -> tuple[list[ProbabilityScore], dict[tuple[str, int], float]]:
    """
    Compute monthly detection rates from enriched observation dicts.

    Returns:
        (scores, park_monthly_rates) where park_monthly_rates is
        {(species_slug, month): detection_rate} — passed to the trailhead scorer
        as the park-level prior for affinity computation.
    """
    current_year = date.today().year
    cutoff_year = current_year - recency_cutoff_years

    species_weighted: defaultdict[tuple[str, str, int], float] = defaultdict(float)
    species_raw: defaultdict[tuple[str, str, int], int] = defaultdict(int)
    month_totals: defaultdict[tuple[str, int], float] = defaultdict(float)

    for obs in observations:
        park_id = obs.get("park_id")
        species = obs.get("species_slug")
        month = obs.get("month")
        observed_on = obs.get("observed_on", "")
        if not all([park_id, species, month]):
            continue
        try:
            year = int(observed_on[:4])
        except (TypeError, ValueError):
            year = current_year - 1
        weight = 2.0 if year >= cutoff_year else 1.0
        key = (park_id, species, month)
        species_weighted[key] += weight
        species_raw[key] += 1
        month_totals[(park_id, month)] += weight

    scores: list[ProbabilityScore] = []
    park_monthly_rates: dict[tuple[str, int], float] = {}

    for (park_id, species, month), w in species_weighted.items():
        total = month_totals[(park_id, month)]
        rate = round(w / total, 6) if total > 0 else 0.0
        scores.append(ProbabilityScore(
            park_id=park_id,
            species_slug=species,
            month=month,
            score=rate,
            raw_count=species_raw[(park_id, species, month)],
            weighted_count=round(w, 4),
        ))
        park_monthly_rates[(species, month)] = rate

    return (
        sorted(scores, key=lambda s: (-s.score, s.park_id, s.species_slug)),
        park_monthly_rates,
    )
