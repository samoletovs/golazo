"""Test mobile viewport fitting on iPhone 13 and iPhone 17 sizes."""
from playwright.sync_api import sync_playwright
import os, json

SCREENS = {
    "iphone13": {"width": 390, "height": 844},
    "iphone17": {"width": 402, "height": 874},
}

OUT = os.path.join(os.path.dirname(__file__), "screenshots")
os.makedirs(OUT, exist_ok=True)

# Minimal app state to bypass onboarding and show real content
SEED_STATE = {
    "profile": {
        "id": "test", "familyId": "test", "role": "player",
        "name": "Alex", "birthDate": "2013-05-15", "team": "RFS",
        "positions": ["CM"], "dominantFoot": "right", "language": "en",
        "createdAt": "2025-01-01T00:00:00Z"
    },
    "xp": {"totalXp": 450, "level": 3, "currentLevelXp": 450, "nextLevelXp": 600, "streakDays": 4, "lastActivityDate": "2026-03-29"},
    "skillTree": {"playerId": "test", "ratings": [
        {"category": "technical", "subSkill": "dribbling", "rating": 5, "lastUpdated": "2026-03-29"},
        {"category": "technical", "subSkill": "shooting", "rating": 4, "lastUpdated": "2026-03-29"},
        {"category": "physical", "subSkill": "speed", "rating": 6, "lastUpdated": "2026-03-29"},
        {"category": "tactical", "subSkill": "positioning", "rating": 3, "lastUpdated": "2026-03-29"},
        {"category": "mental", "subSkill": "confidence", "rating": 5, "lastUpdated": "2026-03-29"},
    ], "updatedAt": "2026-03-29"},
    "trainings": [
        {"id": "t1", "playerId": "test", "date": "2026-03-28", "type": "team", "durationMinutes": 90, "focusAreas": ["technical"], "energy": 4, "mood": 4, "notes": "", "exerciseIds": [], "createdAt": "2026-03-28T19:00:00Z"},
    ],
    "matches": [
        {"id": "m1", "playerId": "test", "date": "2026-03-27", "opponent": "Riga United", "competition": "League", "scoreUs": 2, "scoreThem": 1, "position": "CM", "minutesPlayed": 60, "goals": 1, "assists": 1, "shots": 3, "keyPasses": 2, "tackles": 4, "selfRating": 7, "bestMoment": "Goal from edge of box", "toImprove": "Passing accuracy", "mood": 4, "createdAt": "2026-03-27T12:00:00Z"},
    ],
    "tournaments": [], "diary": [],
    "schedule": [
        {"id": "s1", "familyId": "test", "playerId": "test", "type": "training", "title": "Team Training", "date": "2026-03-31", "startTime": "19:00", "endTime": "21:00", "location": "Skonto Hall", "createdBy": "test", "createdAt": "2026-03-01T00:00:00Z"},
        {"id": "s2", "familyId": "test", "playerId": "test", "type": "match", "title": "Friendly vs Metta", "date": "2026-04-01", "startTime": "17:00", "endTime": "18:30", "opponent": "Metta", "matchType": "friendly", "createdBy": "test", "createdAt": "2026-03-01T00:00:00Z"},
    ],
    "recurringTrainings": [
        {"id": "rt1", "name": "Team Training", "trainingType": "team", "dayOfWeek": 1, "startTime": "19:00", "endTime": "21:00", "location": "Skonto Hall", "active": True, "createdAt": "2026-01-01T00:00:00Z"},
        {"id": "rt2", "name": "Individual", "trainingType": "individual", "dayOfWeek": 3, "startTime": "17:00", "endTime": "18:30", "active": True, "createdAt": "2026-01-01T00:00:00Z"},
        {"id": "rt3", "name": "Gym", "trainingType": "gym", "dayOfWeek": 5, "startTime": "16:00", "endTime": "17:00", "active": True, "createdAt": "2026-01-01T00:00:00Z"},
    ],
    "specialChallenges": [],
    "physicalProfile": None,
    "onboardingComplete": True,
}

with sync_playwright() as p:
    for device, vp in SCREENS.items():
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport=vp,
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
        )
        page = context.new_page()

        # Inject seed state into localStorage before loading
        page.goto("http://localhost:5176/")
        page.evaluate(f"localStorage.setItem('golazo-state', {json.dumps(json.dumps(SEED_STATE))})")
        page.reload()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)

        # 1. Dashboard
        page.screenshot(path=f"{OUT}/{device}_dashboard.png", full_page=False)
        print(f"  {device} dashboard")

        # 2. Navigate to Schedule from dashboard (via "Расписание" or "Schedule" button on dashboard)
        # The dashboard has a schedule button — let's use App's setPage by evaluating JS
        page.evaluate("window.__golazo_setPage && window.__golazo_setPage('schedule')")
        page.wait_for_timeout(500)

        # If that didn't work, try clicking the schedule navigation from dashboard
        sched_btn = page.locator('text=/Schedule|Расписание|Grafiks|Horario|Tvarkaraštis|Ajakava/').first
        if sched_btn.is_visible(timeout=1000):
            sched_btn.click()
            page.wait_for_timeout(800)

        page.screenshot(path=f"{OUT}/{device}_schedule_week.png", full_page=False)
        print(f"  {device} schedule (week)")

        # 4. Click Month tab
        month_tabs = page.locator('button.schedule-tab').all()
        if len(month_tabs) >= 2:
            month_tabs[1].click()
            page.wait_for_timeout(500)
            page.screenshot(path=f"{OUT}/{device}_schedule_month.png", full_page=False)
            print(f"  {device} schedule (month)")

        # 5. Profile (last nav button)
        nav_buttons = page.locator('nav button').all()
        if len(nav_buttons) >= 5:
            nav_buttons[4].click()
            page.wait_for_timeout(800)
            page.screenshot(path=f"{OUT}/{device}_profile.png", full_page=False)
            print(f"  {device} profile")

        browser.close()
        print(f"  Done: {device}\n")

print(f"All screenshots saved to {OUT}/")
