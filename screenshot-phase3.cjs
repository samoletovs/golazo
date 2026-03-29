const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  // Cap viewport height to keep screenshots under 2000px (API limit for multi-image requests)
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mPage = await mobile.newPage();
  
  await mPage.goto('http://localhost:5173/');
  await mPage.waitForTimeout(800);
  
  // Skip login
  const links = await mPage.$$('a, button');
  for (const el of links) {
    const text = await el.textContent();
    if (text && (text.includes('без аккаунта') || text.includes('without'))) { await el.click(); break; }
  }
  await mPage.waitForTimeout(600);

  // Role select + onboarding
  let roleBtn = await mPage.$('.btn-choice, [class*="login-card"]');
  if (roleBtn) await roleBtn.click();
  await mPage.waitForTimeout(500);

  for (let i = 0; i < 10; i++) {
    const textInputs = await mPage.$$('input[type="text"]:visible');
    for (const inp of textInputs) { const v = await inp.inputValue(); if (!v) await inp.fill('Alex'); }
    const numInputs = await mPage.$$('input[type="number"]:visible');
    for (const inp of numInputs) { const v = await inp.inputValue(); if (!v || v === '0') await inp.fill('10'); }
    const choices = await mPage.$$('.btn-choice:visible');
    if (choices.length > 0 && !(await choices[0].getAttribute('aria-pressed') === 'true')) {
      await choices[0].click(); await mPage.waitForTimeout(100);
    }
    const assessBtns = await mPage.$$('.assess-btn:visible');
    for (const btn of assessBtns) {
      const sel = await btn.getAttribute('data-selected');
      if (sel !== 'true') { await btn.click(); await mPage.waitForTimeout(30); }
    }
    const allBtns = await mPage.$$('button:visible');
    let clicked = false;
    for (const btn of allBtns) {
      const text = await btn.textContent();
      if (text && /continue|next|start|далее|продолжить|начать|готово|done|save|поехали|let.*go/i.test(text)) {
        await btn.click(); clicked = true; break;
      }
    }
    if (!clicked) break;
    await mPage.waitForTimeout(500);
    const nav = await mPage.$$('.bottom-nav-item');
    if (nav.length > 0) break;
  }
  await mPage.waitForTimeout(1500);
  
  // Dashboard
  await mPage.screenshot({ path: 'screenshots/mobile-dashboard.png' });
  console.log('✓ mobile-dashboard');
  
  // Log page (tab 1)
  const navBtns = await mPage.$$('.bottom-nav-item');
  if (navBtns.length >= 2) {
    await navBtns[1].click();
    await mPage.waitForTimeout(800);
    await mPage.screenshot({ path: 'screenshots/mobile-log.png' });
    console.log('✓ mobile-log');
  }

  // Progress (tab 3)
  const navBtns2 = await mPage.$$('.bottom-nav-item');
  if (navBtns2.length >= 4) {
    await navBtns2[3].click();
    await mPage.waitForTimeout(800);
    await mPage.screenshot({ path: 'screenshots/mobile-progress.png' });
    console.log('✓ mobile-progress');
  }

  // Desktop
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const dPage = await desktop.newPage();
  const lsData = await mPage.evaluate(() => {
    const d = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); d[k] = localStorage.getItem(k); } return d;
  });
  await dPage.goto('http://localhost:5173/');
  await dPage.waitForTimeout(500);
  await dPage.evaluate((data) => { for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v); }, lsData);
  await dPage.reload();
  await dPage.waitForTimeout(2000);
  await dPage.screenshot({ path: 'screenshots/desktop-dashboard.png' });
  console.log('✓ desktop-dashboard');

  await browser.close();
  console.log('Done!');
})();
