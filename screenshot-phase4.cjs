const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5174/');
  await page.waitForTimeout(800);

  // Skip login
  const links = await page.$$('a, button');
  for (const el of links) {
    const text = await el.textContent();
    if (text && (text.includes('без аккаунта') || text.includes('without'))) { await el.click(); break; }
  }
  await page.waitForTimeout(600);

  // Role select + onboarding
  let roleBtn = await page.$('.btn-choice, [class*="login-card"]');
  if (roleBtn) await roleBtn.click();
  await page.waitForTimeout(500);

  for (let i = 0; i < 10; i++) {
    const textInputs = await page.$$('input[type="text"]:visible');
    for (const inp of textInputs) { const v = await inp.inputValue(); if (!v) await inp.fill('Alex'); }
    const numInputs = await page.$$('input[type="number"]:visible');
    for (const inp of numInputs) { const v = await inp.inputValue(); if (!v || v === '0') await inp.fill('10'); }
    const choices = await page.$$('.btn-choice:visible');
    if (choices.length > 0 && !(await choices[0].getAttribute('aria-pressed') === 'true')) {
      await choices[0].click(); await page.waitForTimeout(100);
    }
    const assessBtns = await page.$$('.assess-btn:visible');
    for (const btn of assessBtns) {
      const sel = await btn.getAttribute('data-selected');
      if (sel !== 'true') { await btn.click(); await page.waitForTimeout(30); }
    }
    const allBtns = await page.$$('button:visible');
    let clicked = false;
    for (const btn of allBtns) {
      const text = await btn.textContent();
      if (text && /continue|next|start|далее|продолжить|начать|готово|done|save|поехали|let.*go/i.test(text)) {
        await btn.click(); clicked = true; break;
      }
    }
    if (!clicked) break;
    await page.waitForTimeout(500);
    const nav = await page.$$('.bottom-nav-item');
    if (nav.length > 0) break;
  }
  await page.waitForTimeout(1500);

  // Navigate to exercises tab (index 2)
  const navBtns = await page.$$('.bottom-nav-item');
  if (navBtns.length >= 3) {
    await navBtns[2].click();
    await page.waitForTimeout(800);
  }
  await page.screenshot({ path: 'screenshots/phase4-exercises.png' });
  console.log('✓ exercises page');

  // Click on first exercise card to open modal
  const card = await page.$('.exercise-card');
  if (card) {
    await card.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/phase4-exercise-modal.png' });
    console.log('✓ exercise modal');
  }

  // Close modal, test search
  const closeBtn = await page.$('.modal-close');
  if (closeBtn) {
    await closeBtn.click();
    await page.waitForTimeout(300);
  }
  await page.fill('.exercise-search', 'juggling');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'screenshots/phase4-exercises-search.png' });
  console.log('✓ search');

  await browser.close();
  console.log('Done!');
})();
