// Run against the local static server. API fixtures never touch a real project.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_URL || 'http://127.0.0.1:8000';
const screenshots = process.env.SCREENSHOT_DIR;

(async () => {
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      const expected = message.text().startsWith('Failed to load resource') &&
        message.location().url.startsWith('https://playtest-test.supabase.co/rest/v1/');
      if (message.type() === 'error' && !expected) errors.push(message.text());
    });
    await page.route('**/playtest-config.js', route => route.fulfill({ contentType: 'application/javascript', body:
      "window.PLAYTEST_CONFIG={supabaseUrl:'https://playtest-test.supabase.co',supabasePublicKey:'sb_publishable_test',buildVersion:'test-build'};" }));
    let inserts = [], failInsert = true;
    await page.route('https://playtest-test.supabase.co/rest/v1/playtest_responses', async route => {
      assert.equal(route.request().method(), 'POST');
      inserts.push(route.request().postDataJSON());
      await new Promise(resolve => setTimeout(resolve, 500));
      if (failInsert) await route.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"Unavailable"}' });
      else await route.fulfill({ status: 201, body: '' });
    });
    let signups = [], failSignup = true;
    await page.route('https://playtest-test.supabase.co/rest/v1/launch_notify_signups', async route => {
      assert.equal(route.request().method(), 'POST');
      signups.push(route.request().postDataJSON());
      if (failSignup) await route.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"Unavailable"}' });
      else await route.fulfill({ status: 201, body: '' });
    });
    await page.goto(`${base}/preguntas.html`);
    await page.waitForFunction(() => Boolean(window.supabase));
    assert.equal(await page.locator('fieldset').count(), 16);
    assert.equal(await page.locator('#launch_email').isVisible(), false);
    await page.locator('#submit-survey').click();
    assert.equal(await page.locator('.field-error:not(:empty)').count(), 16);
    assert.equal(inserts.length, 0);
    const definitions = await page.evaluate(() => window.Playtest.questions);
    for (const q of definitions) {
      if (q.options) await page.locator(`input[name="${q.name}"]`).first().check();
      else await page.locator(`[name="${q.name}"]`).fill(q.type === 'number' ? '2' : 'Una respuesta del playtest');
    }
    // "Sí, avisame" is the first option: the question stays incomplete until the email is valid.
    assert.equal(await page.locator('#launch_email').isVisible(), true);
    assert.equal(await page.locator('#survey-progress').getAttribute('value'), '15');
    await page.locator('#launch_email').fill('vos@ejemplo');
    await page.locator('#launch_email').blur();
    assert.match(await page.locator('#error-launch_email').textContent(), /email/);
    await page.locator('input[name="launch_notify"][value="false"]').check();
    assert.equal(await page.locator('#launch_email').isVisible(), false);
    assert.equal(await page.locator('#error-launch_email').textContent(), '');
    assert.equal(await page.locator('#survey-progress').getAttribute('value'), '16');
    await page.locator('input[name="launch_notify"][value="true"]').check();
    await page.locator('#launch_email').fill(' Vos@Ejemplo.com ');
    assert.equal(await page.locator('#survey-progress').getAttribute('value'), '16');
    assert.equal(await page.locator('#progress-count').textContent(), '16 de 16 respondidas');
    assert.match(await page.locator('#completion-note').textContent(), /Todo listo/);
    assert.equal(await page.locator('#count-favorite_part').textContent(), '26 / 4000');
    await page.locator('#highest_night').fill('-1');
    assert.equal(await page.locator('#survey-progress').getAttribute('value'), '15');
    await page.locator('#submit-survey').click();
    assert.match(await page.locator('#error-highest_night').textContent(), /entero/);
    await page.locator('#highest_night').fill('2');
    await page.locator('#submit-survey').click();
    await page.evaluate(() => document.querySelector('#survey').dispatchEvent(new Event('submit', { cancelable: true })));
    assert.equal(await page.locator('#submit-survey').isDisabled(), true);
    await page.waitForFunction(() => document.querySelector('#survey-status').textContent.includes('No pudimos'));
    assert.equal(inserts.length, 1);
    assert.equal(await page.locator('#favorite_part').inputValue(), 'Una respuesta del playtest');
    assert.equal(signups.length, 0);
    failInsert = false;
    await page.locator('#submit-survey').click();
    await page.waitForFunction(() => !document.querySelector('#submit-survey').disabled);
    assert.equal(signups.length, 1);
    assert.match(await page.locator('#survey-status').textContent(), /No pudimos/);
    assert.equal(await page.locator('#success').isVisible(), false);
    failSignup = false;
    await page.locator('#submit-survey').click();
    await page.locator('#success').waitFor({ state: 'visible' });
    assert.equal(inserts.length, 2);
    assert.equal(signups.length, 2);
    const signup = Array.isArray(signups[1]) ? signups[1][0] : signups[1];
    assert.deepEqual(signup, { email: 'vos@ejemplo.com', language: 'es' });
    assert.equal(await page.locator('#notify-done').isVisible(), true);
    const row = Array.isArray(inserts[1]) ? inserts[1][0] : inserts[1];
    assert.equal(row.completed_night_1, true);
    assert.equal(row.highest_night, 2);
    assert.equal(row.build_version, 'test-build');
    assert.match(row.session_id, /^[0-9a-f-]{36}$/);
    assert.equal(Object.keys(row).length, 17);
    console.log('PASS survey: 16 questions, launch email reveal/validation/separate insert, required fields, validation, POST mapping, duplicate click, failure, retry, success');

    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${base}/preguntas.html`);
      await page.locator('fieldset').first().waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `survey overflow ${width}`);
      if (screenshots) await page.screenshot({ path: path.join(screenshots, `survey-${width}.png`), fullPage: true });
    }
    await page.keyboard.press('Tab');
    assert(await page.evaluate(() => document.activeElement !== document.body));
    await page.locator('input[name="completed_night_1"]').first().focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('input[name="completed_night_1"]').nth(1).isChecked(), true);
    assert.equal(await page.locator('input[name="completed_night_1"]:checked').evaluate(input => getComputedStyle(input.closest('label')).outlineStyle), 'solid');
    let rpcCalls = 0, mode = 'invalid';
    const dataset = [
      { ...row, created_at: '2026-09-30T12:00:00Z', favorite_part: '<img src=x onerror=alert(1)>', build_version: 'build-A' },
      { ...row, created_at: '2026-09-30T13:00:00Z', completed_night_1: false, completed_night_2: 'not_reached', highest_night: 0, initial_understanding: 5, build_version: 'build-B', one_thing_to_change: 'x'.repeat(4000) }
    ];
    await page.route('https://playtest-test.supabase.co/rest/v1/rpc/playtest_results', async route => {
      rpcCalls++;
      assert.equal(route.request().method(), 'POST');
      assert.equal(route.request().postDataJSON().admin_password, 'test-input');
      if (mode === 'network') return route.abort('failed');
      if (mode === 'invalid') return route.fulfill({ status: 400, contentType: 'application/json', body: '{"code":"P0001","message":"Access denied"}' });
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(mode === 'empty' ? [] : mode === 'many' ? Array.from({ length: 1200 }, (_, i) => ({ ...dataset[i % 2] })) : dataset) });
    });
    await page.goto(`${base}/resultados.html`);
    assert.equal(rpcCalls, 0);
    assert.equal(await page.locator('#dashboard').isHidden(), true);
    async function login() {
      await page.locator('#admin-password').fill('test-input');
      await page.locator('#unlock').click();
    }
    await login();
    await page.waitForFunction(() => document.querySelector('#gate-status').textContent.includes('No se pudo'));
    assert.equal(await page.locator('#results-content').textContent(), '');
    assert.equal(await page.locator('#admin-password').inputValue(), '');
    mode = 'network';
    await login();
    await page.waitForFunction(() => document.querySelector('#gate-status').textContent.includes('No pudimos'));
    mode = 'empty';
    await login();
    await page.locator('#dashboard').waitFor({ state: 'visible' });
    assert.match(await page.locator('#results-content').textContent(), /Todavía no hay respuestas/);
    await page.locator('#lock').click();
    mode = 'populated';
    await login();
    await page.locator('#dashboard').waitFor({ state: 'visible' });
    assert.equal(await page.locator('.response').count(), 2);
    assert.equal(await page.locator('.response img').count(), 0);
    assert.match(await page.locator('#results-content').textContent(), /50% \(1\/2\)/);
    assert.match(await page.locator('#results-content').textContent(), /100% \(1\/1\)/);
    assert.equal(await page.locator('.rating-summary dd').first().textContent(), '3 / 5');
    assert.equal(await page.locator('.distribution').count(), 3);
    await page.locator('#build-filter').selectOption('build-B');
    assert.equal(await page.locator('.response').count(), 1);
    await page.locator('#build-filter').selectOption('');
    await page.evaluate(() => { document.body.style.zoom = '2'; });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'results at 200% zoom');
    await page.evaluate(() => { document.body.style.zoom = ''; });
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `results overflow ${width}`);
      if (screenshots) await page.screenshot({ path: path.join(screenshots, `results-${width}.png`), fullPage: true });
    }
    assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);
    await page.reload();
    assert.equal(await page.locator('#dashboard').isHidden(), true);
    assert.equal(await page.locator('#results-content').textContent(), '');
    mode = 'many';
    await login();
    await page.locator('#dashboard').waitFor({ state: 'visible' });
    assert.equal(await page.locator('.response').count(), 1200);
    await page.locator('#lock').click();
    assert.equal(await page.locator('.response').count(), 0);
    console.log('PASS dashboard: direct access, bad password, network failure, empty/populated/1200 rows, metrics, filter, XSS, lock, reload, no storage');

    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base);
      assert.equal(await page.locator('a[href="preguntas.html"]').count(), 1);
      assert.equal(await page.locator('a[href="resultados.html"]').count(), 0);
      const newWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const baseline = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      await baseline.route('**/index.html', route => route.fulfill({ contentType: 'text/html', body:
        execFileSync('git', ['show', 'HEAD:index.html'], { encoding: 'utf8' }) }));
      await baseline.goto(`${base}/index.html`);
      await baseline.evaluate(() => document.fonts.ready);
      const baselineWidth = await baseline.evaluate(() => document.documentElement.scrollWidth);
      assert(newWidth <= baselineWidth, `index introduces overflow ${width}`);
      await baseline.close();
      if (screenshots) await page.screenshot({ path: path.join(screenshots, `index-after-${width}.png`) });
    }
    await page.locator('a[href="preguntas.html"]').click();
    await page.waitForURL('**/preguntas.html');
    await page.goto(base);
    await page.locator('#cookLabels button').nth(2).click();
    assert.equal(await page.locator('#cookState').textContent(), 'Hecho');
    await page.locator('[data-cut="chorizo"]').click();
    assert.match(await page.locator('#cookMeat').getAttribute('src'), /chorizo-hecho/);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.reload();
    await page.locator('#clockBtn').click();
    assert.equal(await page.locator('#clockBtn').textContent(), 'Seguir el día');
    // Every follow/notify button leads to the /wishlist/ sign-up page.
    await page.goto(base);
    assert.equal(await page.locator('a[href="wishlist/"]').count(), 3);
    await page.locator('.hero__cta a[href="wishlist/"]').click();
    await page.waitForURL(`${base}/wishlist/`);
    await page.locator('#signupMail').fill('local-test');
    await page.locator('#signup button').click();
    assert.match(await page.locator('#signupNote').textContent(), /no parece válido/);
    const before = signups.length;
    failSignup = true;
    await page.locator('#signupMail').fill(' Local@Ejemplo.com ');
    await page.locator('#signup button').click();
    await page.waitForFunction(() => document.querySelector('#signupNote').textContent.includes('No pudimos'));
    assert.equal(signups.length, before + 1);
    failSignup = false;
    await page.locator('#signup button').click();
    await page.waitForFunction(() => document.querySelector('#signupNote').textContent.includes('Listo'));
    assert.equal(signups.length, before + 2);
    assert.deepEqual(signups.at(-1), { email: 'local@ejemplo.com', language: 'es' });
    assert(await page.locator('#signup button').isDisabled());
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const url of ['wishlist/', 'wishlist/en/']) {
        await page.goto(`${base}/${url}`);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${url} overflow ${width}`);
        if (screenshots) await page.screenshot({ path: path.join(screenshots, `${url.replace(/\//g, '-')}${width}.png`), fullPage: true });
      }
    }
    // With a public Steam page configured, /wishlist/ leaves for the store before rendering; anything else stays.
    let storeVisits = 0;
    await page.route('https://store.steampowered.com/**', route => { storeVisits++; return route.fulfill({ contentType: 'text/html', body: '<title>Steam</title>' }); });
    await page.route('**/steam-config.js', route => route.fulfill({ contentType: 'application/javascript', body: "window.STEAM_URL='https://evil.example/app/1';" }));
    await page.goto(`${base}/wishlist/`);
    assert.equal(new URL(page.url()).pathname, '/wishlist/');
    await page.unroute('**/steam-config.js');
    await page.route('**/steam-config.js', route => route.fulfill({ contentType: 'application/javascript', body: "window.STEAM_URL='https://store.steampowered.com/app/123/Parrilla_40/';" }));
    for (const url of ['wishlist/', 'wishlist/en/']) {
      await page.goto(`${base}/${url}`);
      await page.waitForURL('https://store.steampowered.com/app/123/Parrilla_40/');
    }
    assert.equal(storeVisits, 2);
    await page.unroute('**/steam-config.js');
    console.log('PASS landing + wishlist: CTA, cooking, cut change, day pause, notify buttons to /wishlist/, signup with failure and retry, Steam redirect (store URLs only), no results link, four widths');
    await page.goto(`${base}/preguntas.html`);
    for (let i = 0; i < 16; i++) {
      await page.keyboard.press('Tab');
      if (await page.evaluate(() => document.activeElement.name === 'completed_night_1')) break;
    }
    for (const q of definitions) {
      assert.equal(await page.evaluate(() => document.activeElement.name), q.name);
      if (q.options) await page.keyboard.press('Space');
      else await page.keyboard.type(q.type === 'number' ? '2' : 'Respuesta escrita con teclado');
      await page.keyboard.press('Tab');
    }
    // Choosing "Sí, avisame" reveals the email field right after the question.
    assert.equal(await page.evaluate(() => document.activeElement.id), 'launch_email');
    await page.keyboard.type('teclado@ejemplo.com');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'submit-survey');
    await page.keyboard.press('Enter');
    await page.locator('#success').waitFor({ state: 'visible' });
    console.log('PASS full survey completed and submitted using keyboard only');
    await page.unroute('**/playtest-config.js');
    // Keep this failure test offline even when real public configuration exists.
    await page.route('**/playtest-config.js', route => route.fulfill({ contentType: 'application/javascript', body: 'window.PLAYTEST_CONFIG={};' }));
    await page.goto(`${base}/preguntas.html`);
    for (const q of definitions) {
      if (q.options) await page.locator(`input[name="${q.name}"]`).first().check();
      else await page.locator(`[name="${q.name}"]`).fill(q.type === 'number' ? '0' : 'Respuestas conservadas');
    }
    await page.locator('#launch_email').fill('conservado@ejemplo.com');
    await page.locator('#submit-survey').click();
    await page.waitForFunction(() => document.querySelector('#survey-status').textContent.includes('No pudimos'));
    assert.equal(await page.locator('#favorite_part').inputValue(), 'Respuestas conservadas');
    assert.equal(await page.locator('#launch_email').inputValue(), 'conservado@ejemplo.com');
    assert.equal(await page.locator('#success').isHidden(), true);
    await page.goto(`${base}/resultados.html`);
    await login();
    await page.waitForFunction(() => document.querySelector('#gate-status').textContent.includes('No pudimos'));
    assert.equal(await page.locator('#dashboard').isHidden(), true);
    console.log('PASS missing real configuration: recoverable errors, answers retained, no false success or private data');
    assert.deepEqual(errors, []);
    console.log('PASS no uncaught browser JavaScript errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
