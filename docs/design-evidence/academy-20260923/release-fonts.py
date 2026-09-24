"""Inspect the compiled Academy screen family with its real web fonts."""
from __future__ import annotations

import argparse
import hashlib
import json
import logging
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import urlopen

from playwright.sync_api import Route, sync_playwright


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[3]
    sys.path.insert(0, str(root / "tests"))
    from test_training_browser import fixture

    base = "http://127.0.0.1:4323"
    source = args.source
    subprocess.run(
        ["git", "-C", str(root), "diff", "--exit-code", source, "--", ".", ":(exclude)docs/design-evidence/**"],
        check=True,
    )
    with urlopen(base + "/source-revision.txt", timeout=10) as response:
        if response.read().decode().strip() != source:
            raise ValueError("Compiled source mismatch")
    output = Path(__file__).parent / f"source-{source[:7]}"
    output.mkdir(exist_ok=True)
    observations: list[dict] = []
    failures: list[dict] = []

    def route_request(route: Route) -> None:
        url = route.request.url
        if url.startswith(base + "/.auth/"):
            route.fulfill(json={"clientPrincipal": None})
        elif url.startswith(base + "/api/"):
            route.fulfill(status=503, json={"error": "Synthetic offline review"})
        elif url.startswith(base + "/") or urlsplit(url).hostname in {"fonts.googleapis.com", "fonts.gstatic.com"}:
            route.continue_()
        else:
            route.abort()

    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch()
            try:
                for language in ("en", "lv", "ru", "es"):
                    for fallback in (False, True):
                        context = browser.new_context(viewport={"width": 1440, "height": 1000}, reduced_motion="reduce")
                        try:
                            context.add_init_script(
                                "const data=" + json.dumps(fixture(language, long_name=True)) + ";"
                                "if(!localStorage.getItem('golazo-state'))localStorage.setItem('golazo-state',JSON.stringify(data));"
                                "localStorage.setItem('golazo-lang',data.profile.language);"
                            )
                            context.route("**/*", route_request)
                            page = context.new_page()
                            page.on("pageerror", lambda error: failures.append({"kind": "pageerror", "message": str(error)}))
                            page.goto(base, wait_until="networkidle")
                            page.locator("main h1").wait_for()
                            fonts = page.evaluate("""async () => {
                              await document.fonts.load('400 16px Inter');
                              await document.fonts.load('800 32px Outfit');
                              await document.fonts.ready;
                              return [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family);
                            }""")
                            if "Inter" not in fonts or "Outfit" not in fonts:
                                raise AssertionError(f"Real web fonts did not load: {fonts}")
                            if fallback:
                                page.add_style_tag(content=":root { --font-display: Outfit, system-ui, sans-serif; --font-data: Outfit, system-ui, sans-serif; }")
                            for width in (390, 1440):
                                page.set_viewport_size({"width": width, "height": 1000})
                                for destination in ("dashboard", "log", "progress", "learn", "profile"):
                                    navigation = page.locator(f'.academy-primary-nav [data-page="{destination}"]')
                                    if navigation.get_attribute("aria-current") != "page":
                                        old_heading = page.locator("main h1").first.inner_text()
                                        navigation.click()
                                        page.wait_for_function(
                                            "previous => document.querySelector('main h1') && document.querySelector('main h1').textContent !== previous",
                                            arg=old_heading,
                                        )
                                    page.evaluate("document.fonts.ready")
                                    layout = page.evaluate("""() => ({
                                      width: innerWidth, clientWidth: document.documentElement.clientWidth,
                                      scrollWidth: document.documentElement.scrollWidth,
                                      heading: document.querySelector('main h1').textContent,
                                      bodyFont: getComputedStyle(document.body).fontFamily,
                                      headingFont: getComputedStyle(document.querySelector('main h1')).fontFamily
                                    })""")
                                    if layout["scrollWidth"] > layout["clientWidth"]:
                                        raise AssertionError(f"Horizontal overflow with real fonts: {language} {destination} {width}")
                                    name = f"fonts-{language}-{'fallback' if fallback else 'native'}-{destination}-{width}.png"
                                    path = output / name
                                    page.screenshot(path=str(path), full_page=True, animations="disabled")
                                    observations.append({
                                        "language": language, "destination": destination,
                                        "mode": "configured-Outfit-fallback-for-non-Windows-coverage" if fallback else "unmodified-font-stack",
                                        "capture": name, "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                                        "loaded_font_families": fonts, **layout,
                                    })
                        finally:
                            context.close()
            finally:
                browser.close()
    except Exception as error:
        failures.append({"kind": "verification-failed", "message": str(error)})
        raise
    finally:
        (output / "fonts-observations.json").write_text(json.dumps({
            "source_commit": source,
            "observations": observations,
            "failures": failures,
            "limits": [
                "Synthetic local profiles and rejected API calls only.",
                "Real public Inter/Outfit resources were loaded, not blank CSS substitutes.",
                "Forced configured fallback checks font-layout compatibility; it is not a Safari/iOS test.",
                "Rendered screen-family verification is not a full-product release receipt.",
            ],
        }, indent=2), encoding="utf-8")
    logging.info("Verified %s real-font screen observations", len(observations))


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    main()
