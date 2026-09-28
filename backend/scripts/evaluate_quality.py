"""Offline inventory or explicitly bounded live quality evaluation."""

import argparse, asyncio, json, os, sys, time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from src.extractor.content_generator import generate_content


async def run(args):
    cases = json.loads(
        (
            Path(__file__).resolve().parents[1] / "tests/fixtures/quality/cases.json"
        ).read_text()
    )
    report = {
        "corpus": "20 original synthetic regression fixtures",
        "human_reviewed": False,
        "listening_reviewed": False,
        "live": args.live,
        "cases": [],
    }
    for case in cases[: args.limit] if args.live else cases:
        row = {
            "id": case["id"],
            "characters": len(case["text"]),
            "expected": case["expected"],
            "human_reviewed": False,
        }
        if args.live:
            started = time.monotonic()
            try:
                result = await generate_content(case["title"], case["text"])
                row.update(
                    status="draft_requires_human_review",
                    summary=result["summary"],
                    script=result["podcast_script"],
                    evidence=result["evidence"],
                )
            except Exception as error:
                row.update(status="rejected", error_type=type(error).__name__)
            row["seconds"] = round(time.monotonic() - started, 3)
        report["cases"].append(row)
    Path(args.output).write_text(json.dumps(report, indent=2) + "\n")
    print(f"Recorded {len(report['cases'])} cases; human approval remains pending")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--live", action="store_true")
    p.add_argument("--limit", type=int, choices=range(1, 4), default=1)
    p.add_argument("--output", default="quality-report.json")
    asyncio.run(run(p.parse_args()))
