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


# Maps regional/subspecies variant slugs → canonical trip-planner slug.
# None = exclude entirely (taxonomic group nodes, not identifiable species).
CANONICAL_SLUGS: dict[str, str | None] = {
    # Bears
    "american-black-bear": "black-bear",
    "california-black-bear": "black-bear",
    "eastern-black-bear": "black-bear",
    "pacific-black-bear": "black-bear",
    "brown-bear": "grizzly-bear",
    "holarctic-bears": None,
    # Moose
    "shiras-moose": "moose",
    "alaskan-moose": "moose",
    # Deer
    "rocky-mountain-mule-deer": "mule-deer",
    "california-mule-deer": "mule-deer",
    "northern-white-tailed-deer": "white-tailed-deer",
    "northern-rocky-mountains-white-tailed-deer": "white-tailed-deer",
    "virginia-white-tailed-deer": "white-tailed-deer",
    "florida-white-tailed-deer": "white-tailed-deer",
    # Eagles
    "northern-bald-eagle": "bald-eagle",
    "north-american-golden-eagle": "golden-eagle",
    # Wolves
    "northwestern-wolf": "gray-wolf",
    # Fox
    "eastern-american-red-fox": "red-fox",
    "rocky-mountain-red-fox": "red-fox",
    "typical-foxes": None,
    # Hawks
    "eastern-red-tailed-hawk": "red-tailed-hawk",
    "western-red-tailed-hawk": "red-tailed-hawk",
    "florida-red-tailed-hawk": "red-tailed-hawk",
    "northern-sharp-shinned-hawk": "sharp-shinned-hawk",
    "northern-broad-winged-hawk": "broad-winged-hawk",
    "california-red-shouldered-hawk": "red-shouldered-hawk",
    "florida-red-shouldered-hawk": "red-shouldered-hawk",
    # Herons
    "eastern-green-heron": "green-heron",
    # Owls
    "american-great-gray-owl": "great-gray-owl",
    "northern-barred-owl": "barred-owl",
    # Jays
    "gray-canada-jay": "canada-jay",
    "rocky-mountain-jay": "canada-jay",
    "oregon-jay": "canada-jay",
    "black-headed-stellers-jay": "stellers-jay",
    "blue-fronted-stellers-jay": "stellers-jay",
    "long-crested-stellers-jay": "stellers-jay",
    # Woodpeckers
    "eastern-hairy-woodpecker": "hairy-woodpecker",
    "northern-pileated-woodpecker": "pileated-woodpecker",
    "southern-pileated-woodpecker": "pileated-woodpecker",
    "rocky-mts-three-toed-woodpecker": "american-three-toed-woodpecker",
    "pied-woodpeckers-and-allies": None,
    # Sparrows
    "eastern-song-sparrow": "song-sparrow",
    "mountain-song-sparrow": "song-sparrow",
    "eastern-chipping-sparrow": "chipping-sparrow",
    "western-chipping-sparrow": "chipping-sparrow",
    "eastern-field-sparrow": "field-sparrow",
    "gambels-white-crowned-sparrow": "white-crowned-sparrow",
    "mountain-white-crowned-sparrow": "white-crowned-sparrow",
    "montane-lincolns-sparrow": "lincolns-sparrow",
    "south-florida-blue-jay": "blue-jay",
    "spizella-sparrows": None,
    "aleutian-sooty-fox-sparrow": "fox-sparrow",
    "mono-thick-billed-fox-sparrow": "fox-sparrow",
    # Warblers
    "audubons-warbler": "yellow-rumped-warbler",
    "myrtle-warbler": "yellow-rumped-warbler",
    "northern-yellow-warbler": "yellow-warbler",
    "rocky-mountain-yellow-warbler": "yellow-warbler",
    "western-palm-warbler": "palm-warbler",
    # Taxonomic group nodes — not identifiable species
    "mole-salamanders": None,
    "deirochelyine-turtles": None,
    "watersnakes": None,
    "spiny-lizards": None,
    "pine-squirrels": None,
    "long-tailed-ground-squirrels": None,
    "american-water-frogs": None,
}


def canonical_slug(slug: str) -> str | None:
    """Return the canonical slug for a species, or None to exclude it."""
    return CANONICAL_SLUGS.get(slug, slug)


def species_slug(obs: dict) -> str | None:
    """Prefer common name for the slug; fall back to scientific name.
    Returns None if the species should be excluded."""
    name = (
        obs.get("common_name")
        or obs.get("taxon_name")
        or obs.get("scientific_name")
        or ""
    )
    raw = slugify_species(name)
    return canonical_slug(raw)


def deduplicate_by_source_id(records: list[dict]) -> list[dict]:
    seen: set[str] = set()
    out = []
    for r in records:
        key = f"{r.get('source')}:{r.get('source_id')}"
        if key not in seen:
            seen.add(key)
            out.append(r)
    return out


def enrich_observation(obs: dict, park_id: str) -> dict | None:
    """Add derived fields to a raw normalized observation.
    Returns None if the species should be excluded (canonical_slug maps to None)."""
    taxon_group = normalize_taxon_group(obs.get("iconic_taxon"))
    slug = species_slug(obs)
    if slug is None:
        return None
    return {
        **obs,
        "park_id": park_id,
        "month": obs_to_month(obs.get("observed_on")),
        "taxon_group": taxon_group,
        "species_slug": slug,
        "is_wildlife": is_wildlife(taxon_group),
    }
