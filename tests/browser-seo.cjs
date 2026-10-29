const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { default: AxeBuilder } = require(process.env.AXE_MODULE || '../test-artifacts/qa/node_modules/@axe-core/playwright');
const base = process.env.TEST_URL || 'http://127.0.0.1:8000';
const output = process.env.SCREENSHOT_DIR || 'test-artifacts/seo';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });
  const errors = [], accessibility = [];
  function observe(page) {
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      const expected = message.text().startsWith('Failed to load resource') &&
        message.location().url.startsWith('https://seo-test.supabase.co/rest/v1/');
      if (message.type() === 'error' && !expected) errors.push(`${message.location().url}: ${message.text()}`);
    });
  }
  try {
    for (const theme of ['dark', 'light']) {
      const context = await browser.newContext({ colorScheme: theme, reducedMotion: 'reduce' });
      const page = await context.newPage();
      observe(page);
      await page.route('**/rest/v1/**', route => { errors.push('Unexpected API request'); return route.abort(); });
      for (const file of ['index.html', 'index-en.html', 'preguntas.html', 'preguntas-en.html', 'resultados.html', 'wishlist/', 'wishlist/en/']) {
        for (const width of [320, 390, 768, 1440]) {
          await page.setViewportSize({ width, height: 900 });
          const response = await page.goto(`${base}/${file}`);
          assert.equal(response.status(), 200);
          await page.evaluate(() => document.fonts.ready);
          assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${file} ${theme} overflow at ${width}`);
          if (width === 390 || width === 1440) {
            await page.screenshot({ path: path.join(output, `${file.replace(/\//g, '-')}-${theme}-${width}.png`) });
            if (file === 'index.html' && theme === 'light') {
              for (const [name, selector] of [['hero', '.hero__content'], ['wishlist', '#wishlist']]) {
                await page.locator(selector).screenshot({ path: path.join(output, `${name}-${theme}-${width}.png`) });
              }
            }
          }
        }
        if (file.includes('-en') || file.includes('/en/')) {
          assert.equal(await page.locator('html').getAttribute('lang'), 'en');
          assert(!/¿|Respondé|Volver al sitio|Pausar el día/.test(await page.locator('main').innerText()));
        }
        const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa']).analyze();
        accessibility.push({ file, theme, violations: scan.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, failureSummary: n.failureSummary })) })) });
      }
      // Equivalent language route keeps the section.
      await page.setViewportSize({ width: 390, height: 900 });
      await page.goto(`${base}/index.html#wishlist`);
      await page.locator('[data-language-link]').click();
      await page.waitForURL('**/index-en.html#wishlist');
      assert.equal(await page.locator('.hero__cta a').textContent(), "Notify me when it's available");
      assert.equal(await page.locator('.hero__cta a').getAttribute('href'), 'wishlist/en/');
      await page.locator('#theme-toggle').click();
      const chosen = theme === 'dark' ? 'light' : 'dark';
      assert.equal(await page.locator('html').getAttribute('data-theme'), chosen);
      await page.goto(`${base}/preguntas-en.html`);
      assert.equal(await page.locator('html').getAttribute('data-theme'), chosen);
      await page.locator('#submit-survey').click();
      assert.equal(await page.locator('.field-error:not(:empty)').count(), 16);
      assert.match(await page.locator('#survey-status').textContent(), /highlighted questions/);
      assert.match(await page.locator('fieldset legend').first().textContent(), /first night/);
      await page.route('**/playtest-config.js', route => route.fulfill({ contentType: 'application/javascript', body: "window.PLAYTEST_CONFIG={supabaseUrl:'https://seo-test.supabase.co',supabasePublicKey:'sb_publishable_test',buildVersion:'seo-test'};" }));
      let fail = true;
      await page.route('https://seo-test.supabase.co/rest/v1/playtest_responses', route => route.fulfill({ status: fail ? 503 : 201, contentType: 'application/json', body: fail ? '{"message":"Unavailable"}' : '' }));
      await page.goto(`${base}/preguntas-en.html`);
      const questions = await page.evaluate(() => window.Playtest.questions);
      for (const question of questions) {
        if (question.options) await page.locator(`[name="${question.name}"]`).first().check();
        else await page.locator(`[name="${question.name}"]`).fill(question.type === 'number' ? '1' : 'Playtest feedback');
      }
      await page.locator('[name="launch_notify"][value="false"]').check();
      await page.locator('#submit-survey').click();
      await page.waitForFunction(() => document.querySelector('#survey-status').textContent.includes("couldn't confirm"));
      assert.equal(await page.locator('#favorite_part').inputValue(), 'Playtest feedback');
      fail = false;
      await page.locator('#submit-survey').click();
      await page.locator('#success').waitFor({ state: 'visible' });
      assert.match(await page.locator('#success').textContent(), /Your answers have been saved/);
      await page.goto(`${base}/index.html`);
      const picture = page.locator('picture').first();
      // Exercise the PNG fallback as a browser with neither modern MIME type.
      assert.equal(await picture.count(), 1);
      await picture.locator('img').scrollIntoViewIfNeeded();
      await picture.locator('source').evaluateAll(sources => sources.forEach(source => { source.type = 'image/unsupported'; }));
      await page.waitForFunction(() => document.querySelector('picture img').currentSrc.endsWith('.png') && document.querySelector('picture img').complete && document.querySelector('picture img').naturalWidth > 0);
      await context.close();
    }
    // No JS: the game copy and all questionnaire content are in the initial HTML.
    const noJS = await browser.newContext({ javaScriptEnabled: false, colorScheme: 'dark' });
    const plain = await noJS.newPage();
    await plain.goto(`${base}/index-en.html`);
    assert.equal(await plain.locator('#wishlist .cta__sub').evaluate(el => getComputedStyle(el).opacity), '1');
    assert.match(await plain.locator('[data-count]').first().textContent(), /14.5/);
    await plain.goto(`${base}/preguntas-en.html`);
    assert.equal(await plain.locator('fieldset').count(), 16);
    assert(await plain.locator('#submit-survey').isDisabled());
    await noJS.close();

    const context = await browser.newContext({ colorScheme: 'light', reducedMotion: 'no-preference' });
    const page = await context.newPage();
    observe(page);
    await page.goto(base);
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
    await page.locator('#motion-toggle').click();
    assert.equal(await page.locator('html').getAttribute('data-motion'), 'paused');
    assert.equal(await page.locator('.hero__near').evaluate(el => getComputedStyle(el).animationPlayState), 'paused');
    await page.locator('#motion-toggle').click();
    assert.equal(await page.locator('html').getAttribute('data-motion'), 'running');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.querySelector('#motion-toggle').disabled);
    assert(await page.locator('#motion-toggle').isDisabled());
    await context.close();

    const blocked = await browser.newContext({ colorScheme: 'dark' });
    await blocked.addInitScript(() => {
      Object.defineProperty(Storage.prototype, 'getItem', { value() { throw new DOMException('Blocked', 'SecurityError'); } });
      Object.defineProperty(Storage.prototype, 'setItem', { value() { throw new DOMException('Blocked', 'SecurityError'); } });
    });
    const blockedPage = await blocked.newPage();
    observe(blockedPage);
    await blockedPage.goto(base);
    assert.equal(await blockedPage.locator('html').getAttribute('data-theme'), 'dark');
    await blockedPage.locator('#theme-toggle').click();
    assert.equal(await blockedPage.locator('html').getAttribute('data-theme'), 'light');
    await blocked.close();
    const missing = await browser.newPage();
    assert.equal((await missing.goto(`${base}/this-page-does-not-exist`)).status(), 404);
    await missing.goto(`${base}/404.html`);
    assert.equal(await missing.locator('h1').count(), 1);
    fs.writeFileSync(path.join(output, 'accessibility.json'), JSON.stringify(accessibility, null, 2));
    const violations = accessibility.filter(scan => scan.violations.length);
    if (violations.length) console.log(JSON.stringify(violations, null, 2));
    assert.deepEqual(violations, [], 'axe violations');
    assert.deepEqual(errors, [], 'browser errors');
    console.log('PASS browser SEO: 40 responsive/theme combinations, ES/EN, keyboard menu, theme persistence/system/storage denial, reduced motion, static no-JS content, PNG fallback, 404, axe and no JS exceptions');
  } finally {
    if (errors.length) console.error('Browser diagnostics:', JSON.stringify(errors));
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
