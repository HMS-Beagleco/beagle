"""
Main pipeline runner.

Usage:
    python run.py --parks yellowstone grand-teton glacier
    python run.py --all
    python run.py --parks yellowstone --skip-ebird
"""

import argparse
import json
import logging
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

from ingest.inat import fetch_observations
from ingest.ebird import fetch_recent_observations
from ingest.nps import fetch_alerts
from transform.normalize import enrich_observation, deduplicate_by_source_id, is_wildlife
from score.probability import build_probability_matrix

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

PARKS_CONFIG = Path(__file__).parent / "config" / "parks.json"
OUTPUT_DIR = Path(__file__).parent / "output"
WEB_DATA_DIR = Path(__file__).parent.parent / "web" / "src" / "data" / "parks"


def load_parks(park_ids: list[str] | None = None) -> list[dict]:
    with open(PARKS_CONFIG) as f:
        parks = json.load(f)
    if park_ids:
        parks = [p for p in parks if p["id"] in park_ids]
    return parks


def run_park(park: dict, skip_ebird: bool = False) -> dict:
    park_id = park["id"]
    bbox = park["bbox"]
    logger.info("=== %s ===", park["name"])

    # iNaturalist observations
    logger.info("Fetching iNaturalist observations...")
    inat_obs = list(fetch_observations(bbox))
    logger.info("  %d raw iNat observations", len(inat_obs))

    # eBird observations
    ebird_obs: list[dict] = []
    if not skip_ebird:
        logger.info("Fetching eBird observations...")
        ebird_obs = list(fetch_recent_observations(park["ebird_region"]))
        logger.info("  %d raw eBird observations", len(ebird_obs))

    # NPS alerts
    logger.info("Fetching NPS alerts...")
    alerts = list(fetch_alerts(park["nps_code"]))
    logger.info("  %d NPS alerts", len(alerts))

    # Combine, deduplicate, enrich
    all_obs = inat_obs + ebird_obs
    all_obs = deduplicate_by_source_id(all_obs)
    enriched = [enrich_observation(o, park_id) for o in all_obs]

    # Filter to mammals, birds, reptiles, amphibians only
    wildlife = [o for o in enriched if is_wildlife(o["taxon_group"])]
    logger.info(
        "  %d wildlife observations after filtering (dropped %d plants/insects/other)",
        len(wildlife), len(enriched) - len(wildlife),
    )

    # Score
    scores = build_probability_matrix(wildlife)

    # Serialize to JSON
    matrix = [s._asdict() for s in scores]

    result = {
        "park_id": park_id,
        "park_name": park["name"],
        "observation_count_total": len(enriched),
        "observation_count_wildlife": len(wildlife),
        "alerts": alerts,
        "probability_matrix": matrix,
    }

    payload = json.dumps(result, indent=2, default=str)

    OUTPUT_DIR.mkdir(exist_ok=True)
    out_path = OUTPUT_DIR / f"{park_id}.json"
    out_path.write_text(payload)

    WEB_DATA_DIR.mkdir(parents=True, exist_ok=True)
    web_path = WEB_DATA_DIR / f"{park_id}.json"
    web_path.write_text(payload)

    logger.info("  Written to %s and %s", out_path, web_path)
    return result


def main():
    parser = argparse.ArgumentParser(description="Beagle wildlife data pipeline")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--parks", nargs="+", metavar="PARK_ID", help="Park IDs to process")
    group.add_argument("--all", action="store_true", help="Process all parks")
    parser.add_argument("--skip-ebird", action="store_true", help="Skip eBird ingestion")
    args = parser.parse_args()

    park_ids = None if args.all else args.parks
    parks = load_parks(park_ids)

    if not parks:
        logger.error("No parks matched. Check park IDs against config/parks.json")
        sys.exit(1)

    logger.info("Processing %d park(s)", len(parks))
    for park in parks:
        run_park(park, skip_ebird=args.skip_ebird)

    logger.info("Done.")


if __name__ == "__main__":
    main()
