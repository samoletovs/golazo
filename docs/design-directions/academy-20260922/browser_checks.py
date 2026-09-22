"""Exercise the standalone academy concepts with local-only synthetic data."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import Page, expect, sync_playwright

PAGES = ("home", "log", "progress", "learn", "profile")
LABELS = {
    "en": ["Home", "Log", "Progress", "Learn", "Profile"],
    "lv": ["Sākums", "Pierakstīt", "Progress", "Mācīties", "Profils"],
}


def layout(page: Page) -> dict:
    result = page.evaluate("""() => {
      const root=document.documentElement;
      const intentional=e=>{for(let p=e;p&&p!==document.body;p=p.parentElement){
        const s=getComputedStyle(p); if(['auto','scroll'].includes(s.overflowX)&&p.scrollWidth>p.clientWidth)return true;
      }return false};
      return {width:innerWidth,scroll:root.scrollWidth,rootFont:getComputedStyle(root).fontSize,
        outside:[...document.querySelectorAll('main *')].filter(e=>{
          const r=e.getBoundingClientRect();return r.width&&r.height&&!intentional(e)&&(r.left< -1||r.right>innerWidth+1);
        }).map(e=>e.tagName+'.'+e.className).slice(0,10)};
    }""")
    assert result["scroll"] <= result["width"] and not result["outside"], result
    return result


def contrast(page: Page) -> dict:
    result = page.evaluate("""() => {
      const rgb=s=>s.match(/[\\d.]+/g)?.map(Number)||[0,0,0,0];
      const lin=x=>(x/=255)<=.04045?x/12.92:((x+.055)/1.055)**2.4;
      const lum=c=>.2126*lin(c[0])+.7152*lin(c[1])+.0722*lin(c[2]);
      const bg=e=>{let layers=[];for(let p=e;p;p=p.parentElement)layers.unshift(rgb(getComputedStyle(p).backgroundColor));
        return layers.reduce((u,c)=>c.slice(0,3).map((v,i)=>v*(c[3]??1)+u[i]*(1-(c[3]??1))),[255,255,255]);};
      const values=[];
      for(const e of document.querySelectorAll('#app *, dialog[open] *')){
        if(e.closest('svg')||e.classList.contains('sr-only')||!e.getClientRects().length)continue;
        if(![...e.childNodes].some(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim()))continue;
        const rect=e.getBoundingClientRect();if(!rect.width||!rect.height)continue;
        const s=getComputedStyle(e),a=lum(rgb(s.color)),b=lum(bg(e));
        const value=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
        const required=parseFloat(s.fontSize)>=24||(parseFloat(s.fontSize)>=18.66&&parseInt(s.fontWeight)>=700)?3:4.5;
        values.push({text:e.textContent.trim().slice(0,55),value,required});
      }
      return {minimum:Math.min(...values.map(v=>v.value)),count:values.length,failures:values.filter(v=>v.value+.01<v.required)};
    }""")
    assert not result["failures"], result["failures"]
    return result


def keyboard_to(page: Page, selector: str) -> None:
    for _ in range(100):
        target = page.locator(selector)
        if target.evaluate("e=>e===document.activeElement"):
            box = target.bounding_box()
            assert box and box["height"] > 0
            if 0 <= box["y"] and box["y"] + box["height"] <= page.viewport_size["height"] - 70:
                assert target.evaluate("e=>getComputedStyle(e).outlineStyle") != "none"
                return
        page.keyboard.press("Tab")
    raise AssertionError(f"Visible keyboard target not reached: {selector}")


def review_controls(page: Page, role: str | None = None, data: str | None = None, fail: bool | None = None) -> None:
    page.locator('[data-dialog="review"]').click()
    expect(page.locator("dialog")).to_be_visible()
    if role is not None:
        page.locator('dialog select[name="role"]').select_option(role)
    if data is not None:
        page.locator('dialog select[name="data"]').select_option(data)
    if fail is not None:
        page.locator('dialog input[name="fail"]').set_checked(fail)
    page.locator('[data-dialog-form="review"] button').click()
    expect(page.locator("dialog")).not_to_be_visible()


def capture(page: Page, output: Path, name: str, full: bool = False) -> None:
    page.evaluate("window.scrollTo(0,0)")
    page.screenshot(path=str(output / f"{name}.png"), full_page=full, scale="css")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default="http://127.0.0.1:4321")
    parser.add_argument("--source")
    parser.add_argument("--capture", action="store_true")
    args = parser.parse_args()
    assert urlparse(args.url).hostname == "127.0.0.1"
    root = Path(__file__).resolve().parent
    repo = root.parents[2]
    if args.source:
        changed = subprocess.run(["git", "-C", str(repo), "diff", "--name-only", args.source], check=True, capture_output=True, text=True).stdout.splitlines()
        assert all(name.startswith("docs/design-directions/academy-20260922/evidence/") for name in changed), changed
    output = root / "evidence"
    if args.capture:
        output.mkdir(exist_ok=True)
    results: list[dict] = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        browser_version = browser.version
        try:
            for direction in ("a", "b"):
                for language in ("lv", "en"):
                    context = browser.new_context(viewport={"width": 1440, "height": 1000}, reduced_motion="reduce")
                    requests: list[str] = []
                    errors: list[str] = []

                    def local_only(route) -> None:
                        url = route.request.url
                        requests.append(url)
                        if not url.startswith(args.url + "/") or "/api/" in url or "/.auth/" in url:
                            raise AssertionError(f"Unexpected non-concept request: {url}")
                        route.continue_()

                    context.route("**/*", local_only)
                    page = context.new_page()
                    page.on("pageerror", lambda error: errors.append(str(error)))
                    response = page.goto(f"{args.url}/?direction={direction}&lang={language}#home", wait_until="networkidle")
                    assert response is not None
                    source = response.headers.get("x-concept-source")
                    if args.source:
                        assert source == args.source, (source, args.source)
                    for width, height, size in ((1440, 1000, "desktop"), (390, 844, "mobile"), (320, 844, "narrow")):
                        page.set_viewport_size({"width": width, "height": height})
                        for tab, label in zip(PAGES, LABELS[language]):
                            page.locator(f'.nav-list [data-nav="{tab}"]').click()
                            expect(page.locator(f'[data-nav="{tab}"]')).to_have_attribute("aria-current", "page")
                            expect(page.locator("#page-title")).to_be_visible()
                            assert page.locator(".nav-list .nav-link").count() == 5
                            assert page.locator(".nav-list .nav-link span").all_text_contents() == LABELS[language]
                            measured = layout(page)
                            colors = contrast(page)
                            results.append({"direction": direction, "language": language, "page": tab, "size": size, "layout": measured, "contrast": colors})
                            if args.capture and size != "narrow":
                                capture(page, output, f"{direction}-{tab}-{language}-{size}")
                                if language == "lv":
                                    capture(page, output, f"{direction}-{tab}-{language}-{size}-full", full=True)

                    page.set_viewport_size({"width": 390, "height": 844})
                    page.locator('[data-nav="log"]').click()
                    page.locator('.log-tool[href="#training"]').click()
                    expect(page.locator('[data-form="training"]')).to_be_visible()
                    page.locator('input[name="durationMinutes"]').fill("")
                    page.locator('[data-form] button[type="submit"]').click()
                    assert not page.locator('input[name="durationMinutes"]').evaluate("e=>e.validity.valid")
                    page.locator('input[name="durationMinutes"]').fill("60")
                    page.locator('[data-form="training"] summary').click()
                    note = "Synthetic passing reflection / Izdomāta piespēles piezīme"
                    page.locator('textarea[name="notes"]').fill(note)
                    review_controls(page, fail=True)
                    page.locator('[data-form] button[type="submit"]').click()
                    expect(page.locator(".error")).to_be_visible()
                    expect(page.locator('textarea[name="notes"]')).to_have_value(note)
                    other = "b" if direction == "a" else "a"
                    page.locator(f'[data-direction="{other}"]').click()
                    expect(page.locator('textarea[name="notes"]')).to_have_value(note)
                    page.locator(f'[data-direction="{direction}"]').click()
                    colors = contrast(page)
                    if args.capture:
                        capture(page, output, f"{direction}-training-failure-{language}", full=True)
                    keyboard_to(page, '[data-form] button[type="submit"]')
                    page.keyboard.press("Enter")
                    page.keyboard.press("Enter")
                    expect(page).to_have_url(re.compile(r"#saved$"))
                    expect(page.locator(".mini-stat")).to_contain_text("210")
                    page.locator('main a[href="#progress"]').click()
                    expect(page.locator('[data-week="5"]')).to_contain_text("150")
                    results.append({"direction": direction, "language": language, "flow": "training-invalid-failure-direction-switch-retry", "retainedInput": True, "minutesAfter": 210, "currentWeekAfter": 150, "contrast": colors})

                    page.locator('[data-nav="log"]').click()
                    page.locator('.log-tool[href="#match"]').click()
                    page.locator('input[name="opponent"]').fill("Synthetic opponent")
                    page.locator('[data-form] button[type="submit"]').click()
                    expect(page).to_have_url(re.compile(r"#saved$"))
                    page.locator('[data-nav="log"]').click()
                    page.locator('.log-tool[href="#reflection"]').click()
                    page.locator('textarea[name="text"]').fill("PRIVATE-DEMO-REFLECTION")
                    page.locator('input[name="aiConsent"]').uncheck()
                    page.locator('[data-form] button[type="submit"]').click()
                    expect(page).to_have_url(re.compile(r"#saved$"))
                    page.locator('[data-nav="log"]').click()
                    assert page.locator('main time[datetime="2026-09-22"]').count() == 3
                    review_controls(page, role="mentor")
                    assert "PRIVATE-DEMO-REFLECTION" not in page.locator("main").inner_text()
                    page.locator('[data-nav="progress"]').click()
                    assert "PRIVATE-DEMO-REFLECTION" not in page.locator("main").inner_text()
                    if args.capture:
                        capture(page, output, f"{direction}-mentor-{language}", full=True)
                    review_controls(page, role="player")

                    page.locator('[data-nav="learn"]').click()
                    search = page.locator("#library-search")
                    search.click()
                    page.keyboard.type("pirmais" if language == "lv" else "first")
                    expect(page.locator("#library-search")).to_have_value("pirmais" if language == "lv" else "first")
                    assert page.locator(".catalogue-item").count() == 1
                    page.locator('.catalogue-item a[href="#exercise/first-touch"]').click()
                    page.locator('[data-exercise-step="2"]').click()
                    expect(page.locator('[data-exercise-step="2"]')).to_have_attribute("aria-pressed", "true")
                    page.locator('[data-action="save-exercise"]').click()
                    page.locator('[data-action="practice"]').click()
                    expect(page.locator('[data-action="practice"]')).to_be_disabled()
                    if args.capture:
                        capture(page, output, f"{direction}-exercise-{language}", full=True)
                    page.locator('[data-nav="learn"]').click()
                    page.locator('[data-learn-tab="articles"]').click()
                    page.locator('main a[href="#article"]').click()
                    page.locator('[data-action="read-article"]').click()
                    expect(page.locator('[data-action="read-article"]')).to_be_disabled()
                    page.locator('[data-nav="learn"]').click()
                    page.locator('[data-learn-tab="programs"]').click()
                    page.locator('main a[href="#program"]').click()
                    page.locator('[data-action="start-program"]').click()
                    page.locator('main a[href="#program-workout"]').click()
                    page.locator('[data-action="finish-workout"]').click()
                    expect(page.locator('[data-action="finish-workout"]')).to_be_disabled()

                    page.locator('[data-nav="home"]').click()
                    page.locator('main a[href="#schedule"]').first.click()
                    page.locator('[data-dialog="event"]').click()
                    page.locator('dialog input[name="title"]').fill("Synthetic extra session")
                    page.locator('[data-dialog-form="event"] button').click()
                    expect(page.locator("main")).to_contain_text("Synthetic extra session")
                    page.locator('[data-calendar="month"]').click()
                    assert page.locator(".month-grid button").count() == 30
                    layout(page)
                    page.locator('main a[href="#tournament"]').click()
                    expect(page.locator("main")).to_contain_text("10:00")
                    if args.capture:
                        capture(page, output, f"{direction}-tournament-{language}", full=True)

                    page.locator('[data-nav="profile"]').click()
                    page.locator('main a[href="#settings"]').first.click()
                    page.locator('main a[href="#onboarding"]').click()
                    for step in range(6):
                        expect(page.locator('.onboarding-steps li[aria-current="step"]')).to_be_visible()
                        page.locator('[data-form="onboarding"] button[type="submit"]').click()
                    expect(page).to_have_url(re.compile(r"#home$"))
                    review_controls(page, role="coach")
                    assert page.locator(".nav-link").count() == 4
                    page.locator('main a[href="#roster"]').click()
                    assert page.locator("tbody tr").count() == 3
                    page.locator('main a[href="#attendance"]').click()
                    page.locator('[data-attendance="07"]').click()
                    expect(page.locator('[data-attendance="07"]')).to_have_attribute("data-status", "present")
                    page.locator('[data-action="attendance-save"]').click()
                    if args.capture:
                        capture(page, output, f"{direction}-attendance-{language}", full=True)
                    page.locator('[data-nav="home"]').click()
                    page.locator('main a[href="#planner"]').click()
                    page.locator('input[name="title"]').fill("Synthetic retained plan")
                    page.locator('[data-dialog="drill"]').click()
                    page.locator('dialog select[name="exercise"]').select_option("wall-pass")
                    page.locator('[data-dialog-form="drill"] button').click()
                    expect(page.locator('input[name="title"]')).to_have_value("Synthetic retained plan")
                    assert page.locator('main a[href="#exercise/wall-pass"]').count() == 1
                    page.locator('[data-form="plan"] button').click()
                    expect(page.locator(".status")).to_be_visible()
                    if args.capture:
                        capture(page, output, f"{direction}-coach-plan-{language}", full=True)
                    results.append({"direction": direction, "language": language, "flow": "match-reflection-privacy-learning-calendar-tournament-onboarding-coach", "pass": True})

                    review_controls(page, role="player", data="sparse")
                    for tab in PAGES:
                        page.locator(f'[data-nav="{tab}"]').click()
                        layout(page)
                        if tab == "progress":
                            assert page.locator(".bar-column").count() == 0
                            assert page.locator(".trace-chart").count() == 0
                        if args.capture and language == "lv":
                            capture(page, output, f"{direction}-{tab}-sparse", full=True)
                    page.locator('[data-nav="home"]').click()
                    page.evaluate("document.documentElement.style.fontSize='200%'")
                    results.append({"direction": direction, "language": language, "flow": "sparse-text200", "layout": layout(page)})
                    page.evaluate("document.documentElement.style.fontSize=''")
                    page.reload(wait_until="networkidle")
                    assert page.evaluate("localStorage.length + sessionStorage.length") == 0
                    assert page.evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches")
                    assert not errors, errors
                    assert all(url.startswith(args.url + "/") for url in requests)
                    results.append({"direction": direction, "language": language, "flow": "isolation", "pageErrors": errors, "requests": len(requests), "externalRequests": 0, "storageKeys": 0})
                    context.close()

            if args.capture:
                context = browser.new_context(viewport={"width": 1500, "height": 1000}, reduced_motion="reduce")
                page = context.new_page()
                page.goto(args.url + "/contact.html", wait_until="networkidle")
                assert page.locator("img").count() == 20
                assert page.locator("img").evaluate_all("images=>images.every(i=>i.complete&&i.naturalWidth>0)")
                page.screenshot(path=str(output / "contact-sheet-lv.png"), full_page=True)
                page.locator("#language").select_option("en")
                for image in page.locator("img").all():
                    expect(image).to_have_js_property("complete", True)
                    assert image.evaluate("image=>image.naturalWidth") > 0
                page.screenshot(path=str(output / "contact-sheet-en.png"), full_page=True)
                context.close()
        finally:
            browser.close()

    report = {
        "kind": "concept-function-checks-not-owner-design-acceptance",
        "source": args.source, "browser": browser_version, "results": results,
        "limits": ["Standalone synthetic concepts, not production", "No real-user observation", "No independent aesthetic approval in this run", "Mapped treatments are not implemented production flows", "Chromium and installed local fonts only", "No native browser-zoom claim"],
    }
    if args.capture:
        report["artifacts"] = [{"path": item.name, "sha256": hashlib.sha256(item.read_bytes()).hexdigest()} for item in sorted(output.glob("*.png"))]
        (output / "checks.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"observations": len(results), "screenshots": len(list(output.glob("*.png"))) if args.capture else 0, "source": args.source, "browser": browser_version}))


if __name__ == "__main__":
    main()
