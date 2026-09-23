"""Offline regression tests for the actual PR design-gate entry point."""
from __future__ import annotations

import hashlib
import json
import shutil
import struct
import subprocess
import sys
import unittest
import uuid
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / ".test-artifacts" / "design-gate"
CHECKS = ("primary_task", "keyboard", "responsive", "states", "accessibility", "performance", "visual_intent")


def fixture_png(width: int, height: int) -> bytes:
    """Generate test-only images, never product/browser evidence."""
    def chunk(kind: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress((b"\0" + b"\xff\xfd\xf8" * width) * height))
        + chunk(b"IEND", b"")
    )


class DesignGateTests(unittest.TestCase):
    def setUp(self) -> None:
        self.repo = FIXTURES / uuid.uuid4().hex
        self.repo.mkdir(parents=True)
        self.git("init", "-q")
        self.git("config", "user.name", "Design gate fixture")
        self.git("config", "user.email", "fixture@example.invalid")
        self.git("config", "commit.gpgsign", "false")
        self.git("config", "core.autocrlf", "false")
        self.write(".impeccable.md", "Approved test-only direction A.\n")
        self.scope = {
            "version": 1, "kind": "product-redesign",
            "owner_scope": "Test-only request covering Home and Progress.",
            "inventory_basis": "Fixture navigation includes Home and Progress.",
            "surfaces": [
                {"id": "home", "entry": "Home tab", "role": "player"},
                {"id": "progress", "entry": "Progress tab", "role": "player"},
            ],
        }
        self.write(".design-scope.json", json.dumps(self.scope))
        self.write("src/App.tsx", "export const label = 'Before';\n")
        for name in ("design-gate.py", "check-design-pr.py"):
            self.write(f"scripts/{name}", (ROOT / "scripts" / name).read_text(encoding="utf-8"))
        self.base = self.commit("base")

    def tearDown(self) -> None:
        # Git's object files can be read-only on Windows.
        def writable(function: object, path: str, error: object) -> None:
            Path(path).chmod(0o700)
            if callable(function):
                function(path)
        shutil.rmtree(self.repo, onerror=writable)

    def git(self, *arguments: str) -> str:
        return subprocess.run(
            ["git", "-C", str(self.repo), *arguments],
            check=True, capture_output=True, text=True,
        ).stdout.strip()

    def write(self, name: str, text: str) -> None:
        path = self.repo / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8", newline="\n")

    def commit(self, message: str) -> str:
        self.git("add", ".")
        self.git("commit", "-qm", message)
        return self.git("rev-parse", "HEAD")

    def ui_commit(self) -> str:
        self.write("src/App.tsx", "export const label = 'Changed UI';\n")
        return self.commit("UI change")

    def receipt(self, source: str) -> Path:
        directory = self.repo / "docs/design-evidence/fixture"
        directory.mkdir(parents=True)
        screenshots = []
        for viewport, width in (("mobile", 390), ("desktop", 1440)):
            path = directory / f"{viewport}.png"
            path.write_bytes(fixture_png(width, 600))
            screenshots.append({
                "viewport": viewport, "path": path.relative_to(self.repo).as_posix(),
                "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            })
        canonical = subprocess.run(
            ["git", "-C", str(self.repo), "show", f"{source}:.impeccable.md"],
            check=True, capture_output=True,
        ).stdout
        record = {
            "version": 2, "source_commit": source,
            "brief_sha256": hashlib.sha256(canonical).hexdigest(),
            "scope_sha256": hashlib.sha256((self.repo / ".design-scope.json").read_bytes()).hexdigest(),
            "direction": {"mode": "reuse", "selected": "A", "owner_decision": "Test-only prior approval"},
            "author": "fixture implementer", "reviewer": "fixture independent reviewer",
            "review_notes": "Synthetic unit-test receipt; not product review.",
            "unresolved_findings": [],
            "checks": {name: {"status": "pass", "evidence": "Unit-test contract fixture"} for name in CHECKS},
            "screenshots": screenshots,
            "coverage": [],
            "craft": {name: {"status": "pass", "evidence": "Synthetic unit-test contract only"}
                      for name in ("identity", "composition", "cohesion")},
            "owner_acceptance": {
                "status": "approved", "source_commit": source,
                "decision": "Test-only acceptance fixture, not product approval.",
            },
        }
        for index, surface in enumerate(self.scope["surfaces"], start=1):
            captures = []
            for viewport, width in (("mobile", 390), ("desktop", 1440)):
                image = directory / f"{surface['id']}-{viewport}.png"
                image.write_bytes(fixture_png(width + index, 610 + index))
                captures.append({
                    "viewport": viewport, "path": image.relative_to(self.repo).as_posix(),
                    "sha256": hashlib.sha256(image.read_bytes()).hexdigest(),
                })
            record["coverage"].append({
                "id": surface["id"], "status": "implemented",
                "evidence": "Synthetic per-surface test fixture, not browser evidence.",
                "screenshots": captures,
            })
        path = directory / "review.json"
        path.write_text(json.dumps(record), encoding="utf-8")
        return path

    def run_gate(self, base: str | None = None) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(self.repo / "scripts/check-design-pr.py"), "--repo", str(self.repo), "--base", base or self.base],
            capture_output=True, text=True, check=False,
        )

    def test_ui_change_without_receipt_is_blocked(self) -> None:
        self.ui_commit()
        result = self.run_gate()
        self.assertEqual(result.returncode, 1)
        self.assertIn("Missing", result.stderr)

    def test_backend_only_change_needs_no_visual_receipt(self) -> None:
        self.write("api/src/example.ts", "export const backend = true;\n")
        self.commit("backend only")
        result = self.run_gate()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("No product UI paths changed", result.stderr)

    def test_evidence_only_commit_preserves_source_binding(self) -> None:
        source = self.ui_commit()
        self.receipt(source)
        self.commit("evidence only")
        result = self.run_gate()
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_later_committed_ui_change_invalidates_receipt(self) -> None:
        source = self.ui_commit()
        self.receipt(source)
        self.commit("evidence")
        self.write("src/App.tsx", "export const label = 'Not reviewed';\n")
        self.commit("unreviewed edit")
        result = self.run_gate()
        self.assertEqual(result.returncode, 1)
        self.assertIn("source changed since review", result.stderr)

    def test_staged_change_cannot_hide_behind_restored_worktree(self) -> None:
        source = self.ui_commit()
        self.receipt(source)
        self.write("src/App.tsx", "export const label = 'Staged edit';\n")
        self.git("add", "src/App.tsx")
        self.write("src/App.tsx", "export const label = 'Changed UI';\n")
        self.assertEqual(self.run_gate().returncode, 1)

    def test_modified_artifact_invalidates_receipt(self) -> None:
        source = self.ui_commit()
        self.receipt(source)
        image = self.repo / "docs/design-evidence/fixture/mobile.png"
        image.write_bytes(fixture_png(400, 600))
        result = self.run_gate()
        self.assertEqual(result.returncode, 1)
        self.assertIn("artifact changed", result.stderr)

    def test_missing_history_fails_visibly_instead_of_skipping(self) -> None:
        self.ui_commit()
        result = self.run_gate("f" * 40)
        self.assertEqual(result.returncode, 1)
        self.assertIn("Cannot determine/validate UI changes", result.stderr)

    def test_deleted_ui_file_is_still_a_ui_change(self) -> None:
        (self.repo / "src/App.tsx").unlink()
        self.commit("delete UI")
        self.assertEqual(self.run_gate().returncode, 1)

    def test_synthetic_merge_preserves_review_ancestry_for_an_unchanged_tree(self) -> None:
        self.git("switch", "-c", "pr-branch")
        source = self.ui_commit()
        self.receipt(source)
        self.commit("reviewed evidence")
        self.git("switch", "-c", "base-update", self.base)
        self.git("commit", "--allow-empty", "-qm", "base history advance")
        base = self.git("rev-parse", "HEAD")
        self.git("switch", "pr-branch")
        self.git("merge", "--no-ff", "-m", "synthetic PR merge", "base-update")
        self.git("merge-base", "--is-ancestor", source, "HEAD")
        result = self.run_gate(base)
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_nonconflicting_base_ui_drift_invalidates_review_on_the_merge_tree(self) -> None:
        self.git("switch", "-c", "pr-branch")
        source = self.ui_commit()
        self.receipt(source)
        self.commit("reviewed evidence")
        self.git("switch", "-c", "base-update", self.base)
        self.write("src/index.css", "body { color: blue; }\n")
        base = self.commit("independent base UI change")
        self.git("switch", "pr-branch")
        self.git("merge", "--no-ff", "-m", "synthetic PR merge", "base-update")
        self.git("merge-base", "--is-ancestor", source, "HEAD")
        result = self.run_gate(base)
        self.assertEqual(result.returncode, 1)
        self.assertIn("source changed since review", result.stderr)

    def test_backend_only_pr_on_a_changed_ui_base_needs_no_new_visual_receipt(self) -> None:
        self.git("switch", "-c", "pr-branch")
        self.write("api/src/example.ts", "export const backend = true;\n")
        self.commit("backend-only PR")
        self.git("switch", "-c", "base-update", self.base)
        self.write("src/index.css", "body { color: blue; }\n")
        base = self.commit("independent base UI change")
        self.git("switch", "pr-branch")
        self.git("merge", "--no-ff", "-m", "synthetic PR merge", "base-update")
        result = self.run_gate(base)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("No product UI paths changed", result.stderr)

    def test_legacy_receipt_cannot_bypass_complete_scope(self) -> None:
        path = self.receipt(self.ui_commit())
        record = json.loads(path.read_text(encoding="utf-8"))
        record["version"] = 1
        path.write_text(json.dumps(record), encoding="utf-8")
        result = self.run_gate()
        self.assertEqual(result.returncode, 1)
        self.assertIn("version 2", result.stderr)

    def test_missing_supporting_surface_is_rejected(self) -> None:
        path = self.receipt(self.ui_commit())
        record = json.loads(path.read_text(encoding="utf-8"))
        record["coverage"] = record["coverage"][:1]
        path.write_text(json.dumps(record), encoding="utf-8")
        result = self.run_gate()
        self.assertEqual(result.returncode, 1)
        self.assertIn("missing surface coverage: progress", result.stderr)

    def test_direction_choice_is_not_final_integrated_owner_acceptance(self) -> None:
        path = self.receipt(self.ui_commit())
        record = json.loads(path.read_text(encoding="utf-8"))
        record["owner_acceptance"]["status"] = "not_run"
        path.write_text(json.dumps(record), encoding="utf-8")
        result = self.run_gate()
        self.assertEqual(result.returncode, 1)
        self.assertIn("owner acceptance", result.stderr)

    def test_functional_success_cannot_replace_craft_review(self) -> None:
        path = self.receipt(self.ui_commit())
        record = json.loads(path.read_text(encoding="utf-8"))
        record["craft"]["cohesion"]["status"] = "not_run"
        path.write_text(json.dumps(record), encoding="utf-8")
        result = self.run_gate()
        self.assertEqual(result.returncode, 1)
        self.assertIn("functional checks are not design approval", result.stderr)

    def test_removing_scope_cannot_restore_legacy_shortcut(self) -> None:
        (self.repo / ".design-scope.json").unlink()
        self.commit("remove scope")
        result = self.run_gate()
        self.assertEqual(result.returncode, 1)
        self.assertIn("Missing source-controlled", result.stderr)


if __name__ == "__main__":
    unittest.main()
