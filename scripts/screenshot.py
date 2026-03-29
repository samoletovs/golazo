from playwright.sync_api import sync_playwright
import os, json

os.makedirs('screenshots', exist_ok=True)

state = {
    "profile": {"name": "Leo", "dateOfBirth": "2012-03-15", "positions": ["CF"], "dominantFoot": "right", "jerseyNumber": 10},
    "xp": {"level": 8, "totalXp": 3450, "currentLevelXp": 250, "nextLevelXp": 500, "streakDays": 5},
    "skillTree": {
        "playerId": "test",
        "updatedAt": "2026-03-29T10:00:00",
        "ratings": [
            {"category":"technical","subSkill":"dribbling","rating":4,"lastUpdated":"2026-03-29"},
            {"category":"technical","subSkill":"shortPass","rating":3,"lastUpdated":"2026-03-29"},
            {"category":"physical","subSkill":"speed","rating":3,"lastUpdated":"2026-03-29"},
            {"category":"physical","subSkill":"stamina","rating":2,"lastUpdated":"2026-03-29"},
            {"category":"tactical","subSkill":"positioning","rating":2,"lastUpdated":"2026-03-29"},
            {"category":"mental","subSkill":"confidence","rating":3,"lastUpdated":"2026-03-29"},
            {"category":"knowledge","subSkill":"rules","rating":2,"lastUpdated":"2026-03-29"},
            {"category":"matchPlay","subSkill":"goals","rating":4,"lastUpdated":"2026-03-29"},
        ]
    },
    "trainings": [{"id": "t1", "date": "2026-03-29T10:00:00", "duration": 60, "intensity": 4, "drills": ["passing"], "notes": "", "xpEarned": 20}],
    "matches": [
        {"id": "m1", "date": "2026-03-28", "opponent": "FC Riga", "scoreUs": 3, "scoreThem": 1, "goals": 2, "assists": 1, "selfRating": 4, "notes": "", "position": "CF", "xpEarned": 30},
        {"id": "m2", "date": "2026-03-25", "opponent": "Spartaks", "scoreUs": 1, "scoreThem": 1, "goals": 0, "assists": 1, "selfRating": 3, "notes": "", "position": "CF", "xpEarned": 25},
    ],
    "tournaments": [], "diary": [], "schedule": [], "specialChallenges": [],
    "physicalProfile": None,
    "onboardingComplete": True,
}

def setup_page(ctx):
    """Create page with mocked auth, inject state, navigate."""
    page = ctx.new_page()
    # Mock auth endpoint BEFORE any navigation
    page.route("**/.auth/me", lambda route: route.fulfill(
        status=200, content_type="application/json",
        body=json.dumps({"clientPrincipal": None})
    ))
    # Collect JS errors 
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)[:200]))
    page.goto("http://localhost:5180")
    page.wait_for_timeout(1500)
    # Inject state using evaluate with proper object passing (avoids JSON escaping issues)
    page.evaluate("(s) => localStorage.setItem('golazo-state', JSON.stringify(s))", state)
    page.reload()
    page.wait_for_timeout(3000)
    if errors:
        print(f"  JS errors: {errors}")
    return page

with sync_playwright() as p:
    browser = p.chromium.launch()

    # --- Mobile ---
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    mp = setup_page(ctx)
    
    has_nav = mp.locator(".bottom-nav-item").count()
    has_login = mp.locator(".login-card").count()
    print(f"State check: nav={has_nav}, login={has_login}")
    
    mp.screenshot(path="screenshots/01-dashboard-mobile.png", full_page=True)
    print("1. Dashboard mobile")

    if has_nav > 0:
        tabs = mp.locator(".bottom-nav-item")
        for idx, name in [(2, "progress"), (3, "challenges"), (4, "profile"), (1, "log")]:
            tabs.nth(idx).click()
            mp.wait_for_timeout(1200)
            mp.screenshot(path=f"screenshots/{idx+1:02d}-{name}-mobile.png", full_page=True)
            print(f"{idx+1}. {name}")
    else:
        print("WARN: No nav tabs found, capturing login page only")

    # --- Desktop ---
    ctx2 = browser.new_context(viewport={"width": 1280, "height": 900})
    dp = setup_page(ctx2)
    dp.screenshot(path="screenshots/06-dashboard-desktop.png")
    print("6. Dashboard desktop")

    browser.close()
    print("All captured!")
