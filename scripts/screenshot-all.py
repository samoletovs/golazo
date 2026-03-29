"""Visual validation — screenshots of ALL Golazo screens via local dev server."""
import json, time
from playwright.sync_api import sync_playwright

URL = "https://golazo.naurolabs.com"
OUT = "screenshots"

STATE = {
    "profile": {
        "id": "test-player", "familyId": "test-family", "role": "player",
        "name": "Alex", "birthDate": "2012-05-15", "team": "RFS",
        "jerseyNumber": 10, "positions": ["CM", "CAM"], "dominantFoot": "right",
        "language": "en", "createdAt": "2024-01-01T00:00:00Z",
        "teams": [{"id": "t1", "name": "RFS Academy", "aliases": ["RFS"], "active": True, "createdAt": "2024-01-01T00:00:00Z"}]
    },
    "xp": {"totalXp": 1250, "level": 8, "currentLevelXp": 80, "nextLevelXp": 150, "streakDays": 5, "lastActivityDate": "2026-03-29"},
    "skillTree": {"playerId": "test-player", "ratings": [
        {"category": "technical", "subSkill": "passing", "rating": 7, "lastUpdated": "2026-03-28"},
        {"category": "technical", "subSkill": "dribbling", "rating": 6, "lastUpdated": "2026-03-28"},
        {"category": "physical", "subSkill": "speed", "rating": 8, "lastUpdated": "2026-03-28"},
        {"category": "physical", "subSkill": "endurance", "rating": 5, "lastUpdated": "2026-03-28"},
        {"category": "tactical", "subSkill": "positioning", "rating": 6, "lastUpdated": "2026-03-28"},
        {"category": "mental", "subSkill": "focus", "rating": 7, "lastUpdated": "2026-03-28"},
        {"category": "matchPlay", "subSkill": "finishing", "rating": 7, "lastUpdated": "2026-03-28"},
        {"category": "knowledge", "subSkill": "rules", "rating": 5, "lastUpdated": "2026-03-28"},
    ], "updatedAt": "2026-03-28"},
    "trainings": [
        {"id": "tr1", "playerId": "test-player", "date": "2026-03-28", "type": "team", "durationMinutes": 90, "focusAreas": ["technical"], "energy": 4, "mood": 4, "notes": "Good session", "exerciseIds": [], "createdAt": "2026-03-28T18:00:00Z"},
        {"id": "tr2", "playerId": "test-player", "date": "2026-03-27", "type": "individual", "durationMinutes": 45, "focusAreas": ["physical"], "energy": 3, "mood": 3, "notes": "", "exerciseIds": [], "createdAt": "2026-03-27T15:00:00Z"},
    ],
    "matches": [
        {"id": "m1", "playerId": "test-player", "date": "2026-03-28", "opponent": "Mārupes NSS", "competition": "Nordic Spring Cup", "scoreUs": 2, "scoreThem": 1, "position": ["CM"], "minutesPlayed": 60, "goals": 1, "assists": 1, "shots": 3, "keyPasses": 2, "tackles": 1, "selfRating": 8, "bestMoment": "Goal from free kick", "toImprove": "Positioning", "mood": 4, "createdAt": "2026-03-28T18:00:00Z"},
        {"id": "m2", "playerId": "test-player", "date": "2026-03-25", "opponent": "FS Metta", "competition": "LFF Youth", "scoreUs": 3, "scoreThem": 0, "position": ["CAM"], "minutesPlayed": 70, "goals": 2, "assists": 0, "shots": 5, "keyPasses": 3, "tackles": 0, "selfRating": 9, "bestMoment": "Hat trick attempt", "toImprove": "First touch", "mood": 5, "createdAt": "2026-03-25T16:00:00Z"},
    ],
    "tournaments": [], "diary": [], "schedule": [],
    "specialChallenges": [], "physicalProfile": None,
    "onboardingComplete": True
}

PAGES = [
    ("dashboard", "Home"),
    ("log", "Log"),
    ("exercises", "Exercises"),
    ("progress", "Progress"),
    ("profile", "Profile"),
]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    
    for viewport_name, width, height in [("mobile", 390, 844), ("desktop", 1280, 900)]:
        page = browser.new_page(viewport={"width": width, "height": height})
        
        # Inject state
        page.goto(URL)
        page.wait_for_timeout(500)
        page.evaluate(f"localStorage.setItem('golazo-state', JSON.stringify({json.dumps(STATE)}))")
        page.evaluate("localStorage.setItem('golazo-lang', 'en')")
        page.reload(wait_until="networkidle")
        page.wait_for_timeout(1000)
        
        # Screenshot each page
        for page_key, label in PAGES:
            # Find and click the nav button
            nav_buttons = page.locator('.bottom-nav-item')
            for i in range(nav_buttons.count()):
                text = nav_buttons.nth(i).inner_text()
                if label.lower() in text.lower():
                    nav_buttons.nth(i).click()
                    break
            
            page.wait_for_timeout(800)
            page.screenshot(path=f"{OUT}/{viewport_name}-{page_key}.png", full_page=True)
            print(f"✓ {viewport_name}/{page_key}")
        
        # Also screenshot Challenges (from dashboard quick action)
        nav_buttons = page.locator('.bottom-nav-item')
        for i in range(nav_buttons.count()):
            text = nav_buttons.nth(i).inner_text()
            if "home" in text.lower():
                nav_buttons.nth(i).click()
                break
        page.wait_for_timeout(500)
        
        # Click Challenges quick action
        chal_btn = page.locator('text=🏆').first
        if chal_btn.count() > 0:
            chal_btn.click()
            page.wait_for_timeout(800)
            page.screenshot(path=f"{OUT}/{viewport_name}-challenges.png", full_page=True)
            print(f"✓ {viewport_name}/challenges")
        
        # Schedule
        sched_btn = page.locator('text=📅').first
        if sched_btn.count() > 0:
            sched_btn.click()
            page.wait_for_timeout(800)
            page.screenshot(path=f"{OUT}/{viewport_name}-schedule.png", full_page=True)
            print(f"✓ {viewport_name}/schedule")
        
        page.close()
    
    browser.close()
    print("\n=== All screenshots saved ===")
