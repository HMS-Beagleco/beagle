"""
Normalization and enrichment transforms.

- Standardizes species names across iNaturalist and eBird
- Buckets observations by calendar month
- Maps observations to park areas (trail proximity)
"""

from datetime import date

ICONIC_TAXON_MAP: dict[str, str] = {
    "Mammalia": "mammal",
    "Aves": "bird",
    "Reptilia": "reptile",
    "Amphibia": "amphibian",
    "Actinopterygii": "fish",
    "Insecta": "invertebrate",
    "Arachnida": "invertebrate",
    "Plantae": "plant",
    "Fungi": "fungi",
}

# Taxon groups included in the wildlife probability matrix
WILDLIFE_GROUPS = {"mammal", "bird", "reptile", "amphibian"}


def normalize_taxon_group(iconic_taxon: str | None) -> str:
    return ICONIC_TAXON_MAP.get(iconic_taxon or "", "other")


def is_wildlife(taxon_group: str) -> bool:
    return taxon_group in WILDLIFE_GROUPS


def obs_to_month(observed_on: str | None) -> int | None:
    """Parse 'YYYY-MM-DD' and return the calendar month (1–12)."""
    if not observed_on:
        return None
    try:
        return date.fromisoformat(observed_on[:10]).month
    except ValueError:
        return None


def slugify_species(name: str) -> str:
    return name.lower().replace(" ", "-").replace("'", "").replace(".", "")


def species_slug(obs: dict) -> str:
    """Prefer common name for the slug; fall back to scientific name."""
    name = (
        obs.get("common_name")
        or obs.get("taxon_name")
        or obs.get("scientific_name")
        or ""
    )
    return slugify_species(name)


def deduplicate_by_source_id(records: list[dict]) -> list[dict]:
    seen: set[str] = set()
    out = []
    for r in records:
        key = f"{r.get('source')}:{r.get('source_id')}"
        if key not in seen:
            seen.add(key)
            out.append(r)
    return out


def enrich_observation(obs: dict, park_id: str) -> dict:
    """Add derived fields to a raw normalized observation."""
    taxon_group = normalize_taxon_group(obs.get("iconic_taxon"))
    return {
        **obs,
        "park_id": park_id,
        "month": obs_to_month(obs.get("observed_on")),
        "taxon_group": taxon_group,
        "species_slug": species_slug(obs),
        "is_wildlife": is_wildlife(taxon_group),
    }
