async (page, options = {}) => {
  const base = 'http://127.0.0.1:4317';
  const output = options.outputDirectory;
  const results = [];
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  for (const direction of ['clubhouse', 'companion']) {
    const context = await page.context().browser().newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const tab = await context.newPage();
    const errors = [];
    const requests = [];
    const blocked = [];
    tab.on('pageerror', error => errors.push(error.message));
    tab.on('request', request => requests.push(request.url()));
    await context.route('**/*', async route => {
      if (route.request().url().startsWith(`${base}/`)) await route.continue();
      else { blocked.push(route.request().url()); await route.abort(); }
    });
    const captures = [];
    const checks = [];
    const capture = async name => {
      if (!output) return;
      const file = `${direction}-${name}.png`;
      await tab.screenshot({ path: `${output}\\${file}`, fullPage: true, scale: 'css' });
      captures.push(file);
    };
    const layout = async name => {
      const measured = await tab.evaluate(() => {
        const root = document.documentElement;
        const bad = Array.from(document.querySelectorAll('main *')).filter(element => {
          const rect = element.getBoundingClientRect();
          return rect.width && rect.height && (rect.right > root.clientWidth + 1 || rect.left < -1);
        }).map(element => `${element.tagName}.${element.className}`).slice(0, 10);
        return { width: root.clientWidth, scroll: root.scrollWidth, bad };
      });
      assert(measured.width === measured.scroll && !measured.bad.length, `${direction} ${name} overflow: ${JSON.stringify(measured)}`);
      checks.push({ name, ...measured });
    };
    const tabTo = async locator => {
      for (let i = 0; i < 45; i++) {
        if (await locator.evaluate(element => element === document.activeElement)) return;
        await tab.keyboard.press('Tab');
      }
      throw new Error('Keyboard target not reached: ' + String(locator));
    };
    const contrast = async name => {
      const measured = await tab.evaluate(() => {
        const parse = value => value.match(/[\d.]+/g)?.map(Number) || [0, 0, 0, 0];
        const linear = x => { x /= 255; return x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; };
        const luminance = c => .2126 * linear(c[0]) + .7152 * linear(c[1]) + .0722 * linear(c[2]);
        const ratio = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
        const background = element => {
          const layers = [];
          for (let current = element; current; current = current.parentElement) layers.unshift(parse(getComputedStyle(current).backgroundColor));
          return layers.reduce((under, above) => {
            const alpha = above[3] ?? 1;
            return above.slice(0, 3).map((v, i) => v * alpha + under[i] * (1 - alpha));
          }, [255, 255, 255]);
        };
        const text = [];
        for (const element of document.querySelectorAll('body *')) {
          if (element.closest('svg') || !element.getClientRects().length) continue;
          if (!Array.from(element.childNodes).some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim())) continue;
          const rect = element.getBoundingClientRect();
          if (!rect.width || rect.bottom < 0) continue;
          const style = getComputedStyle(element);
          const needed = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && parseInt(style.fontWeight) >= 700) ? 3 : 4.5;
          const value = ratio(parse(style.color), background(element));
          text.push({ sample: element.textContent.trim().slice(0, 65), ratio: Number(value.toFixed(2)), needed });
        }
        return { minimum: Math.min(...text.map(item => item.ratio)), checked: text.length, failures: text.filter(item => item.ratio + .005 < item.needed) };
      });
      assert(!measured.failures.length, `${direction} ${name} contrast: ${JSON.stringify(measured.failures)}`);
      checks.push({ name, contrast: measured });
    };
    const reset = async () => { await tab.goto(`${base}/${direction}.html`); await tab.locator('#home-title').waitFor(); };
    const response = await tab.goto(`${base}/${direction}.html`);
    const source = response.headers()['x-concept-source'] || 'unmarked preflight';
    await tab.locator('#home-title').waitFor();
    for (const width of [320, 390, 768, 1280]) {
      await tab.setViewportSize({ width, height: width >= 768 ? 900 : 844 });
      await layout(`initial-${width}`);
      await contrast(`initial-${width}`);
      if (width !== 768) await capture(`initial-${width}`);
    }
    await tab.setViewportSize({ width: 390, height: 844 });
    await reset();
    await tab.keyboard.press('Tab');
    assert(await tab.locator('.skip-link').evaluate(element => element === document.activeElement), 'Skip link must be first');
    await tabTo(tab.getByRole('button', { name: 'Log this training', exact: false }));
    const focus = await tab.getByRole('button', { name: 'Log this training', exact: false }).evaluate(element => ({ width: getComputedStyle(element).outlineWidth, style: getComputedStyle(element).outlineStyle }));
    assert(parseFloat(focus.width) >= 2 && focus.style === 'solid', 'Keyboard focus must be visible');
    await tab.keyboard.press('Enter');
    await tab.locator('#training-form').waitFor();
    await layout('log-390');
    await tabTo(tab.locator('#durationMinutes'));
    await tab.keyboard.press('ControlOrMeta+A');
    await tab.keyboard.press('Backspace');
    await tabTo(tab.locator('#save-button'));
    await tab.keyboard.press('Enter');
    assert(await tab.locator('#durationMinutes').getAttribute('aria-invalid') === 'true', 'Blank duration must fail');
    assert(await tab.locator('#durationMinutes').evaluate(element => element === document.activeElement), 'Validation must focus the field');
    await capture('validation-390');
    await tab.keyboard.type('60');
    await tab.locator('[data-duration="60"]').hover();
    await contrast('selected-plus-hover');
    await tab.locator('#mood').selectOption('4');
    await tabTo(tab.locator('.details summary'));
    await tab.keyboard.press('Enter');
    await tabTo(tab.locator('input[value="technical"]'));
    await tab.keyboard.press('Space');
    await tabTo(tab.locator('#notes'));
    await tab.keyboard.type('I looked up before making a pass.');
    await tab.locator('.demo-tools summary').click();
    await tab.locator('#fail-next').check();
    await tabTo(tab.locator('#save-button'));
    await tab.keyboard.press('Enter');
    assert(await tab.locator('#save-button').isDisabled(), 'Save must block double-submit while waiting');
    await capture('saving-390');
    await tab.getByRole('alert').waitFor({ state: 'visible' });
    assert(await tab.locator('#notes').inputValue() === 'I looked up before making a pass.', 'Save failure lost notes');
    assert(await tab.locator('#durationMinutes').inputValue() === '60', 'Save failure lost duration');
    assert(await tab.locator('#mood').inputValue() === '4', 'Save failure lost mood');
    assert(await tab.locator('input[value="technical"]').isChecked(), 'Save failure lost focus');
    await contrast('save-failure');
    await layout('save-failure-390');
    await capture('failure-390');
    await tab.keyboard.press('Enter');
    await tab.locator('.completion-mark').waitFor();
    assert((await tab.locator('.metrics').innerText()).includes('185'), 'Completion must show 185 minutes');
    assert((await tab.locator('.metrics').innerText()).includes('2 → 3'), 'Completion must explain added session');
    assert((await tab.locator('.reward-stamp').innerText()).includes('+20 XP'), 'Completion must show correct base XP');
    assert((await tab.locator('.note-quote').innerText()).includes('looked up'), 'Completion must show the player note');
    assert(await tab.locator('.completion-mark').evaluate(element => getComputedStyle(element).animationName) === 'none', 'Reduced-motion preference ignored');
    for (const width of [320, 390, 1280]) {
      await tab.setViewportSize({ width, height: width === 1280 ? 900 : 844 });
      await layout(`completion-${width}`);
      await contrast(`completion-${width}`);
      await capture(`completion-${width}`);
    }
    await tabTo(tab.getByRole('button', { name: 'Finish for today', exact: false }));
    await tab.keyboard.press('Enter');
    assert((await tab.locator('main').innerText()).includes('close this tab'), 'Journey must have a clear end');
    await capture('finished-1280');
    await tab.getByRole('button', { name: 'Return to the demo journal' }).click();
    assert(await tab.getByRole('button', { name: 'Log this training', exact: false }).count() === 0, 'Completed entry must not invite duplicate logging');
    for (const reason of ['rest', 'missed']) {
      await reset();
      await tab.setViewportSize({ width: 390, height: 844 });
      await tab.getByRole('button', { name: 'Rest or missed training?' }).click();
      await tab.locator(`input[value="${reason}"]`).check();
      await tab.getByRole('button', { name: 'Acknowledge demo day', exact: false }).click();
      assert((await tab.locator('.metrics').innerText()).includes('125'), 'Rest/missed day must retain previous training time');
      assert((await tab.locator('.progress-label').innerText()).includes('80 / 100'), 'Rest/missed day must retain XP');
      await layout(`${reason}-390`);
      await capture(`${reason}-390`);
      await tab.getByRole('button', { name: 'Back to today' }).click();
      assert(await tab.getByRole('button', { name: 'See your day', exact: false }).isVisible(), 'Acknowledged day must not demand catch-up');
    }
    await reset();
    await tab.locator('.demo-tools summary').click();
    await tab.getByRole('button', { name: 'Preview first use' }).click();
    assert((await tab.locator('main').innerText()).includes('Your journal starts here'), 'First use must explain empty journal');
    await capture('empty-390');
    await tab.getByRole('button', { name: 'Log this training', exact: false }).click();
    await tab.locator('#durationMinutes').fill('10');
    await tab.locator('#save-button').click();
    await tab.locator('.completion-mark').waitFor();
    assert((await tab.locator('.metrics').innerText()).includes('0 → 1'), 'First use must start from zero');
    assert((await tab.locator('.progress-label').innerText()).includes('20 / 100'), 'First entry XP must not fabricate a level-up');
    await reset();
    await tab.locator('.demo-tools summary').click();
    await tab.locator('#long-copy').check();
    for (const width of [320, 390, 1280]) {
      await tab.setViewportSize({ width, height: width === 1280 ? 900 : 844 });
      await layout(`long-labels-${width}`);
      if (width === 320) await capture('long-labels-320');
    }
    await tab.setViewportSize({ width: 390, height: 844 });
    await tab.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    await layout('200-percent-text-initial-390');
    await capture('text-200-initial-390');
    await tab.locator('[data-action="log"]').click();
    await layout('200-percent-text-log-390');
    await capture('text-200-log-390');
    await tab.locator('#save-button').click();
    await tab.locator('.completion-mark').waitFor();
    await layout('200-percent-text-completion-390');
    await capture('text-200-completion-390');
    await tab.evaluate(() => { document.documentElement.style.fontSize = ''; });
    await reset();
    await tab.setViewportSize({ width: 1280, height: 900 });
    await tab.locator('[data-action="log"]').click();
    const targets = await tab.evaluate(() => Array.from(document.querySelectorAll('button, a, summary, input:not([type="checkbox"]):not([type="radio"]), select, textarea, .check-label, .rest-option')).filter(element => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && !element.closest('details:not([open]) > :not(summary)');
    }).map(element => ({ name: element.textContent.trim().slice(0, 45) || element.id, width: Math.round(element.getBoundingClientRect().width), height: Math.round(element.getBoundingClientRect().height) })));
    assert(targets.every(target => target.height >= 44 && target.width >= 44), 'Comfortable target size failure: ' + JSON.stringify(targets.filter(t => t.height < 44 || t.width < 44)));
    await contrast('form-default');
    await layout('log-1280');
    await capture('log-1280');
    await tab.setViewportSize({ width: 320, height: 844 });
    await layout('log-320');
    await capture('log-320');
    await tab.setViewportSize({ width: 390, height: 844 });
    await capture('log-390');
    const payload = await tab.evaluate(() => performance.getEntriesByType('resource').map(entry => ({ name: new URL(entry.name).pathname, decodedBytes: entry.decodedBodySize, transferBytes: entry.transferSize })));
    assert(!errors.length, 'Browser errors: ' + errors.join('; '));
    assert(!blocked.length, 'External request attempted: ' + blocked.join('; '));
    assert(requests.every(url => url.startsWith(`${base}/`)), 'Unexpected nonlocal request');
    assert(!requests.some(url => /\/api\/|\.auth|https:/.test(url)), 'No auth or API requests permitted');
    assert(await tab.evaluate(() => localStorage.length + sessionStorage.length) === 0, 'Concept must not persist input');
    results.push({ direction, source, checks, targets, captures, payload, browserErrors: errors, externalRequests: blocked, requestCount: requests.length, keyboard: 'Tab / Enter / Space through entry, validation, optional details, retry and finish', reducedMotion: 'completion animation none', storage: 'localStorage and sessionStorage empty' });
    await context.close();
  }
  return results;
}
