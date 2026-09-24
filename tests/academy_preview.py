"""Serve a compiled build with an explicit synthetic, local-only preview launcher."""
from __future__ import annotations

import argparse
import functools
import json
import logging
import mimetypes
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit

from test_training_browser import fixture


class PreviewHandler(SimpleHTTPRequestHandler):
    source_revision: str = ""
    def json_response(self, data: object, status: int = 200) -> None:
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def html_response(self, text: str) -> None:
        body = text.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        try:
            current = (Path(self.directory) / "source-revision.txt").read_text(encoding="utf-8").strip()
        except OSError:
            self.send_error(503, "The compiled source marker is unavailable")
            return
        if current != self.source_revision:
            self.send_error(503, "Compiled source changed; restart this preview with its new exact revision")
            return
        request = urlsplit(self.path)
        if request.path == "/__evidence" or request.path.startswith("/__evidence/"):
            root = Path(__file__).resolve().parents[1] / "docs" / "design-evidence" / "academy-20260923"
            relative = unquote(request.path.removeprefix("/__evidence")).lstrip("/") or "index.html"
            artifact = (root / relative).resolve()
            if not artifact.is_relative_to(root.resolve()) or artifact.suffix not in (".html", ".png", ".json", ".css") or not artifact.is_file():
                self.send_error(404)
                return
            body = artifact.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", mimetypes.guess_type(artifact.name)[0] or "application/octet-stream")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if request.path == "/__preview":
            query = parse_qs(request.query)
            role = query.get("role", ["player"])[0]
            language = query.get("language", ["en"])[0]
            if role not in ("player", "coach", "mentor") or language not in ("en", "lv", "ru", "es", "lt", "et"):
                self.json_response({"error": "Unsupported synthetic role or language"}, 400)
                return
            data = fixture(language, long_name=True)
            data["profile"]["role"] = role
            data["profile"]["name"] = {"player": "Fictional Player 07", "coach": "Fictional Coach 07", "mentor": "Fictional Mentor 07"}[role]
            data["profile"]["managedTeams"] = [{
                "teamId": "synthetic-team", "teamName": "Fictional Northbank Academy U13",
                "clubName": "Fictional Northbank Academy", "role": "head",
                "claimedAt": "2026-09-01", "verified": False,
            }] if role == "coach" else []
            data["profile"]["menteeIds"] = ["synthetic-player"] if role == "mentor" else []
            payload = json.dumps(data).replace("</", "<\\/")
            self.html_response(f"""<!doctype html><meta charset="utf-8">
<title>Synthetic Golazo preview</title><p>Opening a fictional, local-only profile. No production services are connected.</p>
<script>const fixture={payload};const previous=localStorage.getItem('golazo-state');let safe=false;
try{{safe=!previous || JSON.parse(previous).profile?.id?.startsWith('synthetic-');}}catch{{safe=false;}}
if(!safe){{document.body.textContent='This origin has another or unreadable local profile. Use a fresh private browser window for this synthetic preview.';throw new Error('Refusing to overwrite another local profile');}}
localStorage.setItem('golazo-state',JSON.stringify(fixture));localStorage.removeItem('golazo-learn-tab');
localStorage.setItem('golazo-lang',fixture.profile.language);location.replace('/?preview=synthetic');</script>""")
            return
        if request.path == "/" and parse_qs(request.query).get("preview") == ["synthetic"]:
            index = Path(self.directory) / "index.html"
            text = index.read_text(encoding="utf-8")
            banner = """<aside style="padding:10px 16px;background:#fff1d4;color:#14243b;font:14px/1.5 system-ui">
<strong>Synthetic local preview.</strong> Fictional profiles; real compiled app. Local saves work; remote writes are deliberately unconfirmed.
Reset: <a href="/__preview?role=player">player</a> · <a href="/__preview?role=coach">coach</a> · <a href="/__preview?role=mentor">mentor</a> · <a href="/__preview?language=lv">Latviski</a></aside>"""
            self.html_response(text.replace("<body>", "<body>" + banner).replace("<title>", "<title>[Synthetic preview] "))
            return
        if request.path == "/.auth/me":
            self.json_response({"clientPrincipal": {
                "userId": "synthetic-preview", "userDetails": "Synthetic local preview",
                "identityProvider": "github", "userRoles": ["authenticated"],
            }})
            return
        if request.path.startswith("/api/"):
            if request.path.endswith("/roster"):
                self.json_response({"players": [{
                    "playerId": "synthetic-player", "playerName": "Fictional Player 07",
                    "birthDate": "2014-04-01", "positions": ["CM"], "jerseyNumber": 7,
                    "joinedAt": "2026-09-01", "active": True,
                }]})
            elif request.path.startswith("/api/mentor/mentees"):
                self.json_response({"mentees": [{"id": "synthetic-player", "name": "Fictional Player 07"}]})
            elif request.path.startswith("/api/shared-tournaments"):
                self.json_response({"tournaments": []})
            elif request.path.startswith("/api/teams"):
                self.json_response({"teams": []})
            elif request.path.endswith("/announcements"):
                self.json_response({"announcements": []})
            elif "social-challenges" in request.path:
                self.json_response({"challenges": []})
            elif request.path == "/api/leaderboard":
                self.json_response([])
            else:
                self.json_response({"error": "Synthetic preview: service deliberately unavailable"}, 503)
            return
        if request.path.startswith("/.auth/"):
            self.json_response({"error": "Real authentication is disabled in this synthetic preview"}, 503)
            return
        super().do_GET()

    def do_POST(self) -> None:
        self.json_response({"error": "Synthetic preview: remote write deliberately not confirmed"}, 503)

    def do_PUT(self) -> None:
        self.do_POST()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dist", type=Path, required=True)
    parser.add_argument("--source", required=True)
    parser.add_argument("--port", type=int, default=4323)
    args = parser.parse_args()
    directory = args.dist.resolve()
    if not re.fullmatch(r"[0-9a-f]{40}", args.source):
        raise ValueError("--source must be a complete Git revision")
    if (directory / "source-revision.txt").read_text(encoding="utf-8").strip() != args.source:
        raise ValueError("The compiled source marker does not match --source")
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    PreviewHandler.source_revision = args.source
    server = ThreadingHTTPServer(("127.0.0.1", args.port), functools.partial(PreviewHandler, directory=str(directory)))
    logging.info("Synthetic preview: http://127.0.0.1:%s/__preview ; source %s", args.port, args.source)
    try:
        server.serve_forever()
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
