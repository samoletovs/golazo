"""Require fresh design evidence for UI changes in a pull request."""
from __future__ import annotations

import argparse
import json
import logging
import re
import subprocess
import sys
from pathlib import Path

UI_FILES = {
    "index.html", ".impeccable.md", "package.json", "package-lock.json",
    "vite.config.ts", "tsconfig.json", "scripts/design-gate.py",
    "scripts/check-design-pr.py", ".design-scope.json", "scripts/design-session.py",
    "scripts/design-gate.upstream.json",
}


def changed_ui_paths(repo: Path, base: str) -> list[str]:
    if not re.fullmatch(r"[0-9a-f]{40}", base):
        raise ValueError("--base must be the full pull-request base commit")
    result = subprocess.run(
        ["git", "-C", str(repo), "diff", "--name-only", "--no-renames", "-z", f"{base}...HEAD"],
        check=True, capture_output=True,
    )
    return [
        name for name in result.stdout.decode("utf-8").split("\0")
        if name and (name.startswith(("src/", "public/")) or name in UI_FILES)
    ]


def check(repo: Path, base: str) -> int:
    relevant = changed_ui_paths(repo, base)
    if not relevant:
        logging.info("No product UI paths changed; design evidence is not required.")
        return 0
    logging.info("Product UI changes require source-bound evidence: %s", ", ".join(relevant))
    if not (repo / ".design-scope.json").is_file():
        logging.error("Missing source-controlled .design-scope.json for new UI work.")
        return 1
    receipts = sorted((repo / "docs/design-evidence").glob("**/review.json"))
    if not receipts:
        logging.error("Missing docs/design-evidence/<feature>/review.json for UI changes.")
        return 1
    for receipt in receipts:
        try:
            record = json.loads(receipt.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            logging.error("%s: unreadable design receipt: %s", receipt.relative_to(repo), error)
            continue
        if not isinstance(record, dict) or record.get("version") != 2:
            logging.error("%s: new UI work requires a version 2 receipt.", receipt.relative_to(repo))
            continue
        result = subprocess.run(
            [sys.executable, str(repo / "scripts/design-gate.py"), "--repo", str(repo), "--review", str(receipt)],
            capture_output=True, text=True, check=False,
        )
        if result.returncode == 0:
            logging.info("Accepted source-bound receipt: %s", receipt.relative_to(repo))
            return 0
        logging.error("%s: %s", receipt.relative_to(repo), result.stderr.strip())
    logging.error("No current receipt passed. Commit source, verify, and obtain independent review.")
    return 1


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, default=Path("."))
    parser.add_argument("--base", required=True)
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    try:
        return check(args.repo.resolve(), args.base)
    except (OSError, ValueError, subprocess.CalledProcessError) as error:
        logging.error("Cannot determine/validate UI changes: %s", error)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
