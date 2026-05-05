"""
Seed Supabase from pipeline JSON output.

Loads parks, species, and wildlife probability scores into the database.

Usage:
    python seed.py --parks yellowstone grand-teton glacier
    python seed.py --all
"""

import argparse
import json
import logging
import sys
from pathlib import Path

from dotenv import load_dotenv
import os

load_dotenv(Path(__file__).parent / ".env")

from supabase import create_client

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

OUTPUT_DIR = Path(__file__).parent / "output"
PARKS_CONFIG = Path(__file__).parent / "config" / "parks.json"

PARK_META = {
    "yellowstone":           {"name": "Yellowstone National Park",           "state": "WY/MT/ID", "description": "Home to the largest concentration of wildlife in the lower 48, including grizzly bears, wolves, bison, and elk."},
    "grand-teton":           {"name": "Grand Teton National Park",            "state": "WY",       "description": "Dramatic peaks and glacial lakes set the scene for abundant moose, pronghorn, black bears, and hundreds of bird species."},
    "glacier":               {"name": "Glacier National Park",                "state": "MT",       "description": "Going-to-the-Sun Road corridors teeming with grizzly bears, mountain goats, bighorn sheep, and gray wolves."},
    "rocky-mountain":        {"name": "Rocky Mountain National Park",         "state": "CO",       "description": "Tundra and alpine meadows harbor elk, moose, bighorn sheep, and black bears across varied elevation zones."},
    "great-smoky-mountains": {"name": "Great Smoky Mountains National Park",  "state": "TN/NC",    "description": "The most visited national park features one of the largest black bear populations in the Eastern US."},
    "yosemite":              {"name": "Yosemite National Park",               "state": "CA",       "description": "Granite valleys and sequoia groves are home to black bears, mule deer, peregrine falcons, and rare Sierra Nevada bighorn sheep."},
    "olympic":               {"name": "Olympic National Park",                "state": "WA",       "description": "Three distinct ecosystems support Roosevelt elk, black bears, river otters, and orcas offshore."},
    "denali":                {"name": "Denali National Park",                 "state": "AK",       "description": "North America's highest peak presides over vast wilderness with grizzly bears, caribou, wolves, Dall sheep, and moose."},
    "everglades":            {"name": "Everglades National Park",             "state": "FL",       "description": "The only subtropical preserve in North America, home to manatees, American crocodiles, Florida panthers, and 360+ bird species."},
    "acadia":                {"name": "Acadia National Park",                 "state": "ME",       "description": "Maine's rocky coastline and boreal forests attract migrating raptors, harbor seals, porpoises, and nesting peregrine falcons."},
}


def get_client():
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)


def load_park_json(park_id: str) -> dict | None:
    path = OUTPUT_DIR / f"{park_id}.json"
    if not path.exists():
        logger.warning("No output file for %s — run the pipeline first", park_id)
        return None
    return json.loads(path.read_text())


def seed_park(client, park_config: dict, data: dict):
    park_id = park_config["id"]
    meta = PARK_META.get(park_id, {})
    bbox = park_config["bbox"]

    logger.info("Upserting park: %s", park_id)
    client.table("parks").upsert({
        "id": park_id,
        "slug": park_id,
        "name": meta.get("name", park_id),
        "state": meta.get("state", ""),
        "description": meta.get("description", ""),
        "nps_park_code": park_config["nps_code"],
        "bbox_north": bbox["north"],
        "bbox_south": bbox["south"],
        "bbox_east": bbox["east"],
        "bbox_west": bbox["west"],
    }).execute()


def seed_species_and_scores(client, park_id: str, matrix: list[dict]):
    # Collect unique species slugs from this park's matrix
    unique_species = {row["species_slug"] for row in matrix}
    logger.info("  Upserting %d species", len(unique_species))

    for slug in unique_species:
        common_name = slug.replace("-", " ").strip()
        client.table("species").upsert({
            "id": slug,
            "slug": slug,
            "common_name": common_name,
            "scientific_name": common_name,  # placeholder until we enrich species data
            "taxon_group": "mammal",          # placeholder — will enrich in Phase 2
        }).execute()

    # Upsert probability scores in batches
    logger.info("  Upserting %d probability scores", len(matrix))
    batch_size = 500
    rows = [
        {
            "park_id": park_id,
            "species_id": row["species_slug"],
            "month": row["month"],
            "score": row["score"],
            "raw_count": row["raw_count"],
            "weighted_count": row["weighted_count"],
        }
        for row in matrix
    ]
    for i in range(0, len(rows), batch_size):
        client.table("wildlife_probability").upsert(rows[i : i + batch_size]).execute()
        logger.info("    batch %d / %d", min(i + batch_size, len(rows)), len(rows))


def main():
    parser = argparse.ArgumentParser(description="Seed Supabase from pipeline output")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--parks", nargs="+", metavar="PARK_ID")
    group.add_argument("--all", action="store_true")
    args = parser.parse_args()

    with open(PARKS_CONFIG) as f:
        all_parks = json.load(f)

    if args.all:
        parks = all_parks
    else:
        parks = [p for p in all_parks if p["id"] in args.parks]

    if not parks:
        logger.error("No matching parks found")
        sys.exit(1)

    client = get_client()

    for park_config in parks:
        park_id = park_config["id"]
        data = load_park_json(park_id)
        if not data:
            continue

        logger.info("=== Seeding %s ===", park_id)
        seed_park(client, park_config, data)
        seed_species_and_scores(client, park_id, data["probability_matrix"])
        logger.info("  Done.")

    logger.info("All done.")


if __name__ == "__main__":
    main()
