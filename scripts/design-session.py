"""Check loaded design guidance and prepare evidence drafts without inventing passes."""
from __future__ import annotations

import argparse
import hashlib
import importlib
import json
import logging
import re
import subprocess
import sys
from pathlib import Path

gate = importlib.import_module("design-gate")
ROOT = Path(__file__).resolve().parents[1]
CORE_GUIDANCE = (
    "DESIGN.md",
    "skills/design-system/SKILL.md",
    "skills/impeccable/SKILL.md",
    "skills/nauro-build/SKILL.md",
    "skills/design-system/references/design-evidence.md",
    "skills/design-system/references/verification-matrix.md",
)


def canonical(data: bytes) -> bytes:
    return data.replace(b"\r\n", b"\n")


def exact_root(path: Path) -> Path:
    root = path.resolve()
    if Path(gate.git(root, "rev-parse", "--show-toplevel")).resolve() != root:
        raise ValueError("provide an exact repository root")
    return root


def preflight(loaded_root: Path, reference_root: Path, reference: str,
              skills: list[str]) -> dict[str, object]:
    """Read only: compare on-disk authority with an explicit, caller-verified commit."""
    loaded_root = exact_root(loaded_root)
    reference_root = exact_root(reference_root)
    if not re.fullmatch(r"[0-9a-f]{40}", reference):
        raise ValueError("reference must be a full commit from freshly fetched default refs")
    gate.git(reference_root, "cat-file", "-e", f"{reference}^{{commit}}")
    paths = list(CORE_GUIDANCE)
    for skill in skills:
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", skill):
            raise ValueError("skill must be a lowercase skill name, not a path")
        paths.append(f"skills/{skill}/SKILL.md")
    files = []
    for name in dict.fromkeys(paths):
        expected = canonical(gate.git_bytes(reference_root, "show", f"{reference}:{name}"))
        path = loaded_root / name
        if not path.resolve().is_relative_to(loaded_root):
            raise ValueError(f"guidance path escapes the loaded checkout: {name}")
        actual = canonical(path.read_bytes()) if path.is_file() else None
        files.append({
            "path": name,
            "state": "missing" if actual is None else "match" if actual == expected else "different",
            "reference_sha256": hashlib.sha256(expected).hexdigest(),
            "loaded_sha256": hashlib.sha256(actual).hexdigest() if actual is not None else None,
        })
    return {
        "loaded_root": str(loaded_root),
        "loaded_head": gate.git(loaded_root, "rev-parse", "HEAD"),
        "reference_root": str(reference_root),
        "reference_commit": reference,
        "matches": all(item["state"] == "match" for item in files),
        "files": files,
        "limits": "Disk comparison only; does not inspect cached prompt context or fetch remotes.",
        "next_step": "Read mismatched guidance from the verified isolated checkout; do not reset, "
                     "pull, switch or clean an active checkout. Reload the session when appropriate.",
    }


def capture_record(repo: Path, name: str, viewport: str | None = None) -> dict[str, str]:
    path = gate.artifact(repo, name)
    width, height = gate.png_dimensions(path)
    if height < 320 or width < 320:
        raise ValueError("capture dimensions must be at least 320px")
    if viewport == "mobile" and not 320 <= width <= 480:
        raise ValueError("mobile capture must be 320-480 CSS pixels wide")
    if viewport == "desktop" and width < 1024:
        raise ValueError("desktop capture must be at least 1024 CSS pixels wide")
    record = {
        "path": path.relative_to(repo).as_posix(),
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
    }
    if viewport:
        record["viewport"] = viewport
    return record


def draft(repo: Path, source: str, directory: Path, mobile: str, desktop: str,
          mode: str, options: list[str]) -> Path:
    """Compute mechanical facts only; every judgment starts unverified."""
    repo = exact_root(repo)
    gate.check_source(repo, source)
    scope, scope_digest = gate.load_scope(repo, source)
    if mode not in ("new", "reuse"):
        raise ValueError("mode must be new or reuse")
    if (mode == "new" and len(options) != 2) or (mode == "reuse" and options):
        raise ValueError("new directions need two option captures; reuse takes none")
    target = (repo / directory / "review.draft.json").resolve()
    evidence_root = (repo / gate.EVIDENCE_DIR).resolve()
    if (
        not evidence_root.is_relative_to(repo)
        or not target.is_relative_to(evidence_root)
        or target.parent == evidence_root
    ):
        raise ValueError("draft directory must be a feature folder inside docs/design-evidence")
    screenshots = [capture_record(repo, mobile, "mobile"), capture_record(repo, desktop, "desktop")]
    direction: dict[str, object] = {
        "mode": mode, "selected": "", "owner_decision": "",
    }
    if mode == "new":
        captures = [capture_record(repo, name) for name in options]
        if len({capture["sha256"] for capture in captures}) != 2:
            raise ValueError("direction captures must be distinct")
        direction["options"] = [
            {"id": label, **capture} for label, capture in zip(("A", "B"), captures)
        ]
    record = {
        "version": 2,
        "source_commit": source,
        "brief_sha256": gate.brief_digest(repo, source),
        "scope_sha256": scope_digest,
        "direction": direction,
        "author": "",
        "reviewer": "",
        "review_notes": "",
        "unresolved_findings": ["Independent review and measured check results not recorded"],
        "checks": {
            name: {"status": "not_run", "evidence": ""} for name in gate.CHECKS
        },
        "screenshots": screenshots,
        "coverage": [
            {"id": surface["id"], "status": "not_run", "evidence": "", "screenshots": []}
            for surface in scope["surfaces"]
        ],
        "craft": {
            name: {"status": "not_run", "evidence": ""} for name in gate.CRAFT_CHECKS
        },
    }
    if scope["kind"] != "feature":
        record["owner_acceptance"] = {
            "status": "not_run", "source_commit": "", "decision": "",
        }
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("x", encoding="utf-8", newline="\n") as stream:
        json.dump(record, stream, indent=2)
        stream.write("\n")
    return target


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    check = commands.add_parser("preflight", help="Read-only loaded-guidance comparison")
    check.add_argument("--loaded-root", type=Path, required=True)
    check.add_argument("--reference-root", type=Path, default=ROOT)
    check.add_argument("--reference", required=True)
    check.add_argument("--skill", action="append", default=[])
    prepare = commands.add_parser("draft", help="Create a non-passing, non-overwriting receipt draft")
    prepare.add_argument("--repo", type=Path, required=True)
    prepare.add_argument("--source", required=True)
    prepare.add_argument("--directory", type=Path, required=True)
    prepare.add_argument("--mobile", required=True)
    prepare.add_argument("--desktop", required=True)
    prepare.add_argument("--mode", choices=("new", "reuse"), required=True)
    prepare.add_argument("--option", action="append", default=[])
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    try:
        if args.command == "preflight":
            report = preflight(args.loaded_root, args.reference_root, args.reference, args.skill)
            sys.stdout.write(json.dumps(report, indent=2) + "\n")
            return 0 if report["matches"] else 1
        path = draft(args.repo, args.source, args.directory, args.mobile, args.desktop,
                     args.mode, args.option)
        logging.info("Draft written to %s; no checks or approvals are asserted.", path)
        return 0
    except (OSError, ValueError, subprocess.CalledProcessError) as error:
        logging.error("Design session preparation failed: %s", error)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
