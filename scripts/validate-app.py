"""Validate ALL Golazo screens on the live site. Takes screenshots + logs console errors."""
import sys, json, time
from playwright.sync_api import sync_playwright

URL = "https://golazo.naurolabs.com"
SCREENS = ["dashboard", "log", "progress", "challenges", "profile"]
ERRORS = []

def inject_test_state(page):
    """Inject a test profile + state so the app doesn't redirect to login/onboarding."""
    state = {
        "profile": {
            "id": "test-player",
            "familyId": "test-family",
            "role": "player",
            "name": "Test Player",
            "birthDate": "2012-05-15",
            "team": "RFS",
            "jerseyNumber": 10,
            "positions": ["CM", "CAM"],
            "dominantFoot": "right",
            "language": "en",
            "createdAt": "2024-01-01T00:00:00Z"
        },
        "xp": {
            "totalXp": 500,
            "level": 5,
            "currentLevelXp": 50,
            "nextLevelXp": 120,
            "streakDays": 3,
            "lastActivityDate": "2026-03-29"
        },
        "skillTree": {
            "playerId": "test-player",
            "ratings": [],
            "updatedAt": "2024-01-01T00:00:00Z"
        },
        "trainings": [],
        "matches": [
            {
                "id": "m1",
                "playerId": "test-player",
                "date": "2026-03-28",
                "opponent": "Mārupes NSS",
                "competition": "Nordic Spring Cup",
                "scoreUs": 2,
                "scoreThem": 1,
                "position": ["CM"],
                "minutesPlayed": 60,
                "goals": 1,
                "assists": 1,
                "shots": 3,
                "keyPasses": 2,
                "tackles": 1,
                "selfRating": 8,
                "bestMoment": "Goal from free kick",
                "toImprove": "Positioning",
                "mood": 4,
                "createdAt": "2026-03-28T18:00:00Z"
            }
        ],
        "tournaments": [],
        "diary": [],
        "schedule": [],
        "specialChallenges": [],
        "physicalProfile": None,
        "onboardingComplete": True
    }
    page.evaluate(f"localStorage.setItem('golazo-state', JSON.stringify({json.dumps(state)}))")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 390, "height": 844})
    
    # Collect console errors
    console_errors = []
    page.on("console", lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type in ("error", "warning") else None)
    
    # Navigate and inject state
    print("Navigating to", URL)
    page.goto(URL, wait_until="networkidle", timeout=30000)
    time.sleep(1)
    
    # Check if we're on login page
    content = page.content()
    if "LoginPage" in content or "google" in page.url.lower():
        print("On login page — injecting test state...")
        inject_test_state(page)
        page.reload(wait_until="networkidle", timeout=30000)
        time.sleep(2)
    
    # Check current page state
    page.screenshot(path="screenshots/00-initial.png")
    print(f"Initial URL: {page.url}")
    print(f"Title: {page.title()}")
    
    # Try to skip login by injecting state directly
    if "login" in page.url.lower() or "auth" in page.url.lower():
        print("Still on auth page — injecting directly")
        inject_test_state(page)
        page.goto(URL, wait_until="networkidle", timeout=30000)
        time.sleep(2)
    
    page.screenshot(path="screenshots/01-after-inject.png")
    
    # Navigate each screen using bottom nav
    for i, screen in enumerate(SCREENS):
        try:
            # Click bottom nav button
            nav = page.locator(f'button[aria-label]').filter(has_text=screen.capitalize() if screen != "log" else "Log")
            if nav.count() == 0:
                # Try by nav item content
                nav = page.locator('.bottom-nav-item').nth(SCREENS.index(screen))
            
            if nav.count() > 0:
                nav.first.click()
                page.wait_for_timeout(1000)
            
            page.screenshot(path=f"screenshots/{i+2:02d}-{screen}.png")
            print(f"✓ {screen} — screenshot taken")
            
            # Check for empty/broken content
            body_text = page.inner_text("body")
            if len(body_text.strip()) < 20:
                ERRORS.append(f"{screen}: Page appears empty (text < 20 chars)")
                
        except Exception as e:
            ERRORS.append(f"{screen}: {e}")
            page.screenshot(path=f"screenshots/{i+2:02d}-{screen}-error.png")
            print(f"✗ {screen} — ERROR: {e}")
    
    # Test Schedule page (not in bottom nav)
    try:
        # Look for schedule link or navigate via log page
        page.locator('.bottom-nav-item').nth(1).click()  # Log tab
        page.wait_for_timeout(500)
        page.screenshot(path="screenshots/07-log-page.png")
    except Exception as e:
        ERRORS.append(f"schedule: {e}")
    
    browser.close()
    
    # Summary
    print("\n=== CONSOLE ERRORS ===")
    for err in console_errors[:20]:
        print(f"  {err}")
    
    print(f"\n=== ISSUES FOUND: {len(ERRORS)} ===")
    for err in ERRORS:
        print(f"  ✗ {err}")
    
    if not ERRORS and not [e for e in console_errors if "error" in e.lower()]:
        print("\n✓ All screens rendered OK")
