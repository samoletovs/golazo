async (page) => {
  const base = 'http://127.0.0.1:4323'
  const observations = []
  const errors = []
  const browser = page.context().browser()
  const today = new Date().toISOString().slice(0, 10)
  const targets = {
    player: ['dashboard', 'log', 'progress', 'learn', 'profile', 'schedule', 'portal', 'challenges', 'leaderboard', 'settings'],
    coach: ['dashboard', 'schedule', 'stats', 'profile', 'settings'],
    mentor: ['dashboard', 'schedule', 'progress', 'profile', 'settings'],
  }
  for (const role of ['player', 'coach', 'mentor']) {
    for (const language of ['en', 'lv', 'ru', 'es']) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
      try {
        const p = await context.newPage()
        p.on('pageerror', error => errors.push({ role, language, error: error.message }))
        const profile = {
          id: 'synthetic-academy-profile', familyId: 'fixture', role, name: 'Fictional Player 07',
          birthDate: '2014-04-01', positions: ['CM'], dominantFoot: 'right', jerseyNumber: 7,
          team: 'Fictional Northbank FC', language, createdAt: today, menteeIds: [],
          teams: [{ id: 'synthetic-team', name: 'Ziemeļkrasta jaunatnes futbola akadēmijas komanda U13', aliases: [], colors: ['#ffff00'], active: true, isPrimary: true, createdAt: today }],
          managedTeams: role === 'coach' ? [{ teamId: 'synthetic-team', teamName: 'Fictional Northbank Academy U13', clubName: 'Fictional Northbank Academy', role: 'head', claimedAt: today, verified: false }] : [],
        }
        const fixture = { onboardingComplete: true, profile, trainings: [], matches: [], schedule: [], diary: [] }
        await context.addInitScript(data => {
          localStorage.setItem('golazo-state', JSON.stringify(data))
          localStorage.setItem('golazo-lang', data.profile.language)
        }, fixture)
        await p.route('**/*', async route => {
          const url = route.request().url()
          if (!url.startsWith(base + '/')) {
            if (url.startsWith('https://fonts.googleapis.com/')) await route.fulfill({ contentType: 'text/css', body: '' })
            else await route.abort()
          } else if (url.includes('/.auth/')) await route.fulfill({ json: { clientPrincipal: { userId: 'synthetic-auth', userDetails: 'fixture@example.invalid', identityProvider: 'github', userRoles: ['authenticated'] } } })
          else if (url.includes('/api/shared-tournaments')) await route.fulfill({ json: { tournaments: [] } })
          else if (url.includes('/api/teams')) await route.fulfill({ json: { teams: [] } })
          else if (url.includes('/api/')) await route.fulfill({ status: 503, json: { error: 'Synthetic offline test' } })
          else await route.continue()
        })
        await p.goto(base)
        await p.locator('.academy-shell').waitFor()
        for (const width of [320, 390, 768, 1024, 1440]) {
          await p.setViewportSize({ width, height: 1000 })
          for (const destination of targets[role]) {
            let button = p.locator(`.academy-primary-nav [data-page="${destination}"]`)
            if (!await button.count()) {
              if (width >= 1100) button = p.locator(`.academy-secondary-nav [data-page="${destination}"]`)
              else {
                await p.locator('.academy-menu-toggle').click()
                button = p.locator(`.academy-dialog [data-page="${destination}"]`)
              }
            }
            await button.click()
            await p.locator('main .academy-page').first().waitFor()
            await p.evaluate(() => document.fonts.ready)
            const measured = await p.evaluate(() => {
              const root = document.documentElement
              const outside = [...document.querySelectorAll('main *')].filter(element => {
                if (element.closest('svg, .h-scroll, .academy-table-scroll, [class*="overflow-x"]')) return false
                const rect = element.getBoundingClientRect()
                return rect.width > 0 && rect.height > 0 && (rect.right > root.clientWidth + 2 || rect.left < -2)
              }).map(element => ({ tag: element.tagName, class: String(element.className), text: element.textContent?.trim().slice(0, 65) })).slice(0, 8)
              return { clientWidth: root.clientWidth, scrollWidth: root.scrollWidth, heading: document.querySelector('main h1')?.textContent, outside }
            })
            observations.push({ role, language, width, destination, ...measured })
          }
        }
      } finally { await context.close() }
    }
  }
  const result = { stage: 'implementation-probe-not-final-evidence', observations, errors, failures: observations.filter(item => item.scrollWidth > item.clientWidth || item.outside.length) }
  await page.evaluate(value => { window.__academyProbe = value }, result)
  return { count: observations.length, errors, failures: result.failures }
}
