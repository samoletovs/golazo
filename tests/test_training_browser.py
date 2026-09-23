"""Run the real built training journey with synthetic data and local-only mocks."""
from __future__ import annotations

import argparse
import base64
import importlib.util
import json
import re
import sys
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import urlopen

from playwright.sync_api import BrowserContext, Page, Route, expect, sync_playwright


def fixture(language: str = "en", color: str = "#2548b5", long_name: bool = False) -> dict:
    today = datetime.now(timezone.utc).date()
    profile = {
        "id": "synthetic-player", "familyId": "synthetic-family", "role": "player",
        "name": "Alex", "birthDate": "2014-04-01", "team": "Fictional Northbank FC",
        "positions": ["CM"], "dominantFoot": "right", "language": language,
        "jerseyNumber": 7, "createdAt": today.isoformat(),
        "teams": [{
            "id": "synthetic-club", "name": "Ziemeļkrasta jaunatnes futbola akadēmijas komanda U13" if long_name else "Fictional Northbank FC U13",
            "aliases": [], "colors": [color], "active": True, "isPrimary": True,
            "createdAt": today.isoformat(),
        }],
    }
    trainings = [{
        "id": f"synthetic-training-{i}", "playerId": profile["id"],
        "date": (today - timedelta(days=days)).isoformat(), "type": "team",
        "durationMinutes": minutes, "focusAreas": [], "energy": 3, "mood": 3,
        "notes": "", "exerciseIds": [], "createdAt": today.isoformat(),
    } for i, (days, minutes) in enumerate(((1, 65), (3, 60)))]
    return {
        "profile": profile, "onboardingComplete": True, "trainings": trainings,
        "xp": {"totalXp": 80, "level": 1, "currentLevelXp": 80, "nextLevelXp": 100,
               "streakDays": 1, "lastActivityDate": (today - timedelta(days=1)).isoformat(),
               "checkInStreakDays": 0, "lastCheckInDate": ""},
        "schedule": [{"id": "synthetic-schedule", "familyId": profile["familyId"],
                      "playerId": profile["id"], "type": "training",
                      "title": "Fictional passing practice", "date": today.isoformat(),
                      "startTime": "16:00", "endTime": "17:00", "trainingType": "team",
                      "createdBy": "fixture", "createdAt": today.isoformat()}],
    }


def install_mocks(context: BrowserContext, base: str, data: dict) -> dict:
    state: dict = {"puts": [], "unexpected_external": [], "font_styles_mocked": [], "page_errors": []}
    context.add_init_script(script=f"""
      (() => {{
        const original = Storage.prototype.setItem;
        if (!localStorage.getItem('golazo-state')) original.call(localStorage, 'golazo-state', JSON.stringify({json.dumps(data)}));
        original.call(localStorage, 'golazo-lang', {json.dumps(data['profile']['language'])});
        window.__failTrainingStorage = false;
        Storage.prototype.setItem = function(key, value) {{
          if (key === 'golazo-state' && window.__failTrainingStorage) throw new DOMException('Synthetic storage failure', 'QuotaExceededError');
          return original.call(this, key, value);
        }};
      }})();
    """)

    def route_request(route: Route) -> None:
        url = route.request.url
        path = urlparse(url).path
        if not url.startswith(base + "/"):
            if url.startswith("https://fonts.googleapis.com/"):
                state["font_styles_mocked"].append(url)
                route.fulfill(status=200, content_type="text/css", body="")
            else:
                state["unexpected_external"].append(url)
                route.abort()
        elif path.startswith("/.auth/"):
            route.fulfill(status=200, json={"clientPrincipal": None})
        elif path.startswith("/api/"):
            if path == "/api/sync" and route.request.method == "PUT":
                state["puts"].append(route.request.post_data_json)
            route.fulfill(status=503, json={"error": "Synthetic offline test"})
        else:
            route.continue_()

    context.route("**/*", route_request)
    return state


def no_overflow(page: Page) -> dict:
    result = page.evaluate("""() => {
      const d = document.documentElement;
      return {width: innerWidth, clientWidth:d.clientWidth, scrollWidth:d.scrollWidth,
        font:getComputedStyle(d).fontSize, dpr:devicePixelRatio,
        outside:[...document.querySelectorAll('main *, .academy-dialog *, .academy-primary-nav')].filter(e=>{
          if(e.closest('svg,.h-scroll,[class*="overflow-x"]')) return false;
          const r=e.getBoundingClientRect(); return r.width && r.height && (r.right>d.clientWidth+1 || r.left < -1);
        }).map(e=>e.tagName+'.'+e.className).slice(0,8)};
    }""")
    assert result["scrollWidth"] <= result["width"] and not result["outside"], result
    return result


def contrast(page: Page) -> dict:
    result = page.evaluate("""() => {
      const rgb=s=>s.match(/[\\d.]+/g)?.map(Number)||[0,0,0,0];
      const lin=x=>(x/=255)<=.04045?x/12.92:((x+.055)/1.055)**2.4;
      const lum=c=>.2126*lin(c[0])+.7152*lin(c[1])+.0722*lin(c[2]);
      const background=e=>{let layers=[];for(let p=e;p;p=p.parentElement)layers.unshift(rgb(getComputedStyle(p).backgroundColor));
        return layers.reduce((u,c)=>c.slice(0,3).map((v,i)=>v*(c[3]??1)+u[i]*(1-(c[3]??1))),[255,255,255]);};
      const values=[];
      for(const e of document.querySelectorAll('.academy-shell *, .academy-dialog *, .toast span')) {
        if(e.closest('svg')||!e.getClientRects().length||![...e.childNodes].some(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim())) continue;
        const rect=e.getBoundingClientRect();if(!rect.width||!rect.height)continue;
        const s=getComputedStyle(e), a=lum(rgb(s.color)), b=lum(background(e));
        const ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
        const threshold=parseFloat(s.fontSize)>=24 || (parseFloat(s.fontSize)>=18.66&&parseInt(s.fontWeight)>=700)?3:4.5;
        values.push({text:e.textContent.trim().slice(0,70),ratio,threshold});
      }
      return {minimum:Math.min(...values.map(v=>v.ratio)),count:values.length,failures:values.filter(v=>v.ratio<v.threshold)};
    }""")
    assert not result["failures"], result["failures"]
    return result


def save_state(page: Page) -> dict:
    return page.evaluate("JSON.parse(localStorage.getItem('golazo-state'))")


def capture(page: Page, output: Path, name: str) -> None:
    page.evaluate("window.scrollTo(0,0)")
    page.screenshot(path=str(output / f"{name}.png"), full_page=True, scale="css")


def keyboard_to(page: Page, selector: str) -> None:
    for _ in range(100):
        if page.locator(selector).evaluate("e=>e===document.activeElement"):
            visible = page.locator(selector).evaluate("""e=>{
              const r=e.getBoundingClientRect(), nav=document.querySelector('.academy-primary-nav');
              const bottom=nav && getComputedStyle(nav).position==='fixed' ? nav.getBoundingClientRect().top : innerHeight;
              return r.top>=0 && r.bottom<=bottom && getComputedStyle(e).outlineStyle!=='none';
            }""")
            if visible:
                return
        page.keyboard.press("Tab")
    raise AssertionError(f"Keyboard could not reach {selector}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, required=True)
    parser.add_argument("--url", default="http://127.0.0.1:4318")
    parser.add_argument("--source", required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    repo, output = args.repo.resolve(), args.output.resolve()
    assert urlparse(args.url).hostname == "127.0.0.1" and urlparse(args.url).scheme == "http"
    assert output.is_relative_to(repo / "docs" / "design-evidence")
    assert re.fullmatch("[0-9a-f]{40}", args.source)
    spec = importlib.util.spec_from_file_location("training_gate", repo / "scripts" / "design-gate.py")
    assert spec and spec.loader
    gate = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(gate)
    gate.check_source(repo, args.source)
    with urlopen(args.url + "/source-revision.txt", timeout=10) as response:
        assert response.read().decode().strip() == args.source
    output.mkdir(parents=True, exist_ok=True)
    results: list[dict] = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        try:
            for language in ("en", "ru", "lv", "es"):
                context = browser.new_context(viewport={"width": 390, "height": 844}, reduced_motion="reduce")
                state = install_mocks(context, args.url, fixture(language, "#ffff00" if language == "ru" else "#2548b5", language == "ru"))
                page = context.new_page()
                page.on("pageerror", lambda error: state["page_errors"].append(str(error)))
                page.goto(args.url, wait_until="networkidle")
                expect(page.locator('[data-academy-surface="player-home"]')).to_be_visible()
                initial_assets = page.evaluate("""() => performance.getEntriesByType('resource').filter(e=>new URL(e.name).pathname.startsWith('/assets/')).map(e=>({path:new URL(e.name).pathname,decodedBytes:e.decodedBodySize,transferBytes:e.transferSize}))""")
                results.append({"language": language, "phase": "initial-payload", "assets": initial_assets})
                for width in (320, 390, 768, 1024, 1440):
                    page.set_viewport_size({"width": width, "height": 900 if width == 1280 else 844})
                    results.append({"language": language, "phase": "initial", "layout": no_overflow(page), "contrast": contrast(page)})
                    keyboard_to(page, ".nl-footer a")
                    results.append({"language": language, "phase": "footer-focus", "width": width, "fullyAboveNavigation": True})
                    capture(page, output, f"{language}-initial-{width}")
                page.set_viewport_size({"width": 390, "height": 844})
                keyboard_to(page, ".academy-agenda-row .academy-link")
                page.keyboard.press("Enter")
                expect(page.locator(".academy-form")).to_be_visible()
                new_assets = page.evaluate("""known => performance.getEntriesByType('resource').filter(e=>new URL(e.name).pathname.startsWith('/assets/')&&!known.includes(new URL(e.name).pathname)).map(e=>new URL(e.name).pathname)""", [item["path"] for item in initial_assets])
                results.append({"language": language, "phase": "opening-log-assets", "additionalAssets": new_assets})
                page.locator('input[name="duration"]').fill("")
                page.locator(".academy-form button[type=submit]").click()
                assert not page.locator('input[name="duration"]').evaluate("e=>e.validity.valid")
                assert len(save_state(page)["trainings"]) == 2
                page.locator('input[name="duration"]').fill("60")
                page.locator(".training-details summary").click()
                page.locator('textarea[name="notes"]').fill("Synthetic note: I looked up before making a pass.")
                page.locator('input[name="mood"][value="4"]').check()
                page.locator('.training-focus input').first.check()
                page.locator(".training-presets .academy-choice").first.hover()
                results.append({"language": language, "phase": "selected-hover", "contrast": contrast(page)})
                page.evaluate("window.__failTrainingStorage=true")
                page.locator(".academy-form button[type=submit]").click()
                expect(page.locator(".academy-dialog .academy-error")).to_be_visible()
                expect(page.locator('textarea[name="notes"]')).to_have_value("Synthetic note: I looked up before making a pass.")
                assert len(save_state(page)["trainings"]) == 2 and save_state(page)["xp"]["totalXp"] == 80
                results.append({"language": language, "phase": "failure", "layout": no_overflow(page), "contrast": contrast(page)})
                capture(page, output, f"{language}-failure-390")
                page.evaluate("window.__failTrainingStorage=false")
                keyboard_to(page, ".academy-form button[type=submit]")
                page.keyboard.press("Enter")
                page.keyboard.press("Enter")
                expect(page.locator(".academy-dialog .academy-complete-label")).to_be_visible()
                expect(page.locator(".toast-error")).to_have_count(0)
                assert len(save_state(page)["trainings"]) == 3 and save_state(page)["xp"]["totalXp"] == 100
                assert save_state(page)["trainings"][-1]["playerId"] == "synthetic-player"
                assert save_state(page)["trainings"][-1]["fromSchedule"] == "synthetic-schedule"
                expect(page.locator(".academy-dialog .training-progress .academy-stat-line")).to_contain_text("185")
                assert page.locator(".academy-dialog .academy-complete-label").evaluate("e=>getComputedStyle(e).animationName") == "none"
                for width in (320, 390, 768, 1024, 1440):
                    page.set_viewport_size({"width": width, "height": 900 if width == 1280 else 844})
                    results.append({"language": language, "phase": "completion", "layout": no_overflow(page), "contrast": contrast(page)})
                    capture(page, output, f"{language}-completion-{width}")
                page.wait_for_timeout(2200)
                assert len(state["puts"]) == 1 and len(state["puts"][0]["trainings"]) == 3
                page.reload(wait_until="networkidle")
                expect(page.locator('[data-academy-surface="player-home"]')).to_be_visible()
                assert len(save_state(page)["trainings"]) == 3 and save_state(page)["xp"]["totalXp"] == 100
                page.set_viewport_size({"width": 390, "height": 844})
                page.evaluate("document.documentElement.style.fontSize='200%'")
                results.append({"language": language, "phase": "text-200-initial", "layout": no_overflow(page)})
                keyboard_to(page, ".nl-footer a")
                capture(page, output, f"{language}-text-200-initial")
                page.locator('.academy-primary-nav [data-page="log"]').click()
                translations = json.loads((repo / "src/i18n" / f"{language}.json").read_text(encoding="utf-8"))
                page.get_by_role("button", name=translations["log.training"], exact=True).click()
                expect(page.locator(".academy-form")).to_be_visible()
                results.append({"language": language, "phase": "text-200-form", "layout": no_overflow(page)})
                capture(page, output, f"{language}-text-200-form")
                page.evaluate("document.documentElement.style.fontSize='100%'")
                for width in (390, 1440):
                    page.set_viewport_size({"width": width, "height": 900})
                    for destination in ("dashboard", "log", "progress", "learn", "profile"):
                        page.locator(f'.academy-primary-nav [data-page="{destination}"]').click()
                        expect(page.locator("main .academy-page").first).to_be_visible()
                        results.append({"language": language, "phase": f"workspace-{destination}", "layout": no_overflow(page), "contrast": contrast(page)})
                        capture(page, output, f"{language}-workspace-{destination}-{width}")
                assert not state["page_errors"] and not state["unexpected_external"], state
                results.append({"language": language, "mocked_cloud_failures": len(state["puts"]), "page_errors": state["page_errors"], "external_requests_sent": 0})
                context.close()
            context = browser.new_context(viewport={"width": 390, "height": 844}, reduced_motion="reduce")
            first_use = fixture()
            first_use["trainings"], first_use["schedule"] = [], []
            first_use["xp"].update({"totalXp": 0, "currentLevelXp": 0, "streakDays": 0})
            install_mocks(context, args.url, first_use)
            page = context.new_page()
            page.goto(args.url, wait_until="networkidle")
            expect(page.get_by_text("Your first match starts the story.")).to_be_visible()
            capture(page, output, "first-use-390")
            page.locator('main').get_by_role("button", name="Schedule", exact=True).click()
            assert not save_state(page)["trainings"] and save_state(page)["xp"]["totalXp"] == 0
            page.locator('.academy-primary-nav [data-page="dashboard"]').click()
            expect(page.locator('[data-academy-surface="player-home"]')).to_be_visible()
            page.locator('.academy-primary-nav [data-page="log"]').click()
            page.get_by_role("button", name="Training", exact=True).click()
            page.locator('input[name="duration"]').fill("10")
            page.locator(".academy-form button[type=submit]").click()
            expect(page.locator(".academy-complete-label")).to_be_visible()
            assert len(save_state(page)["trainings"]) == 1 and save_state(page)["xp"]["totalXp"] == 20
            results.append({"phase": "first-use-and-rest-link", "sessions": 1, "minutes": 10, "xp": 20, "restRecordedNothing": True})
            context.close()
        finally:
            browser.close()

        with tempfile.TemporaryDirectory(prefix="golazo-isolated-zoom-") as profile_path:
            extension = repo / "tests" / "browser-zoom-extension"
            context = playwright.chromium.launch_persistent_context(
                profile_path, channel="chromium", headless=True, no_viewport=True,
                args=[f"--disable-extensions-except={extension}", f"--load-extension={extension}", "--window-size=1440,1080"],
            )
            try:
                worker = context.service_workers[0] if context.service_workers else context.wait_for_event("serviceworker")
                state = install_mocks(context, args.url, fixture())
                page = context.new_page()
                cdp = context.new_cdp_session(page)
                page.goto(args.url, wait_until="networkidle")
                expect(page.locator('[data-academy-surface="player-home"]')).to_be_visible()
                before = page.evaluate("({width:innerWidth,dpr:devicePixelRatio})")
                zoom = worker.evaluate("""async origin=>{
                  const tabs=(await chrome.tabs.query({})).filter(t=>t.url?.startsWith(origin+'/'));
                  if(tabs.length!==1)throw Error('Expected one owned preview tab');
                  await chrome.tabs.setZoom(tabs[0].id,2);return await chrome.tabs.getZoom(tabs[0].id);
                }""", args.url)
                assert zoom == 2
                page.wait_for_function("old=>innerWidth<=old.width*.51 && devicePixelRatio>=old.dpr*1.99", arg=before)
                for destination in ("dashboard", "log", "progress", "learn", "profile"):
                    page.locator(f'.academy-primary-nav [data-page="{destination}"]').click()
                    expect(page.locator("main .academy-page").first).to_be_visible()
                    results.append({"phase": f"native-zoom200-{destination}", "layout": no_overflow(page), "before": before, "browserZoom": zoom})
                page.locator('.academy-primary-nav [data-page="dashboard"]').click()
                for phase in ("initial", "form", "completion"):
                    if phase == "form":
                        page.locator('.academy-primary-nav [data-page="log"]').click()
                        page.get_by_role("button", name="Training", exact=True).click()
                        expect(page.locator(".academy-form")).to_be_visible()
                    elif phase == "completion":
                        page.locator(".academy-form button[type=submit]").press("Enter")
                        expect(page.locator(".academy-complete-label")).to_be_visible()
                    results.append({"phase": f"native-zoom200-{phase}", "layout": no_overflow(page), "before": before, "browserZoom": zoom})
                    page.evaluate("window.scrollTo(0,0)")
                    size = cdp.send("Page.getLayoutMetrics")["contentSize"]
                    image = cdp.send("Page.captureScreenshot", {"format": "png", "fromSurface": True, "captureBeyondViewport": True, "clip": {"x": 0, "y": 0, "width": size["width"], "height": size["height"], "scale": 1}})
                    (output / f"native-zoom200-{phase}.png").write_bytes(base64.b64decode(image["data"]))
                assert not state["unexpected_external"]
            finally:
                context.close()

    report = {
        "source_commit": args.source, "kind": "candidate-observations-not-review-receipt",
        "results": results,
        "limits": ["Chromium only", "Synthetic profiles/auth/API responses", "Google font CSS mocked empty: system fallback typography tested", "No real-user or screen-reader testing", "Independent production review pending"],
    }
    (output / "observations.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    sys.stdout.write(json.dumps({"source": args.source, "observations": len(results), "screenshots": len(list(output.glob("*.png"))), "nativeBrowserZoom": 2}) + "\n")


if __name__ == "__main__":
    main()
