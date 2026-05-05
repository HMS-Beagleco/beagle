"""
Wildlife Probability Matrix scoring.

For each park × species × month combination, produces a normalized score (0–1.0)
representing relative likelihood of observation.

Algorithm:
  1. Group observations by (park, species, month, year)
  2. Apply recency decay: years within 2 years of today are weighted 2x
  3. Normalize by observer effort (total observer-days per month) to remove
     seasonal access bias (summer gets more visitors, not necessarily more wildlife)
  4. Normalize scores within each park to a 0–1.0 range
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
    observer_effort: dict[tuple[str, int], int] | None = None,
    recency_cutoff_years: int = 2,
) -> list[ProbabilityScore]:
    """
    Compute wildlife probability scores from a list of enriched observation dicts.

    Args:
        observations: list of dicts with keys: park_id, species_slug, month, observed_on
        observer_effort: optional mapping of (park_id, month) → observer count for
                         effort normalization. If None, no normalization is applied.
        recency_cutoff_years: observations within this many years get 2x weight.

    Returns:
        List of ProbabilityScore records, one per unique (park, species, month).
    """
    current_year = date.today().year
    cutoff_year = current_year - recency_cutoff_years

    # Accumulate weighted counts: (park_id, species_slug, month) → weighted_count
    weighted: defaultdict[tuple[str, str, int], float] = defaultdict(float)
    raw: defaultdict[tuple[str, str, int], int] = defaultdict(int)

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
            year = current_year - 3  # place in the middle of the 5-year window

        weight = 2.0 if year >= cutoff_year else 1.0
        key = (park_id, species, month)
        weighted[key] += weight
        raw[key] += 1

    # Apply observer effort normalization
    if observer_effort:
        for key in list(weighted.keys()):
            park_id, _, month = key
            effort = observer_effort.get((park_id, month), 1)
            if effort > 0:
                weighted[key] /= effort

    # Normalize per-park to 0–1.0 range
    park_max: dict[str, float] = defaultdict(float)
    for (park_id, _, _), w in weighted.items():
        park_max[park_id] = max(park_max[park_id], w)

    scores = []
    for (park_id, species, month), w in weighted.items():
        max_w = park_max[park_id]
        score = round(w / max_w, 4) if max_w > 0 else 0.0
        scores.append(
            ProbabilityScore(
                park_id=park_id,
                species_slug=species,
                month=month,
                score=score,
                raw_count=raw[(park_id, species, month)],
                weighted_count=round(w, 4),
            )
        )

    return sorted(scores, key=lambda s: (-s.score, s.park_id, s.species_slug))
