// Synthetic API fixtures: this suite must never write to a real project.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '../test-artifacts/qa/node_modules/playwright');
const base = process.env.TEST_URL || 'http://127.0.0.1:8000';
const output = process.env.SCREENSHOT_DIR || 'test-artifacts/browser';
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });
  try {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await context.route('**/playtest-config.js', route => route.fulfill({ contentType: 'application/javascript', body:
      "window.PLAYTEST_CONFIG={supabaseUrl:'https://playtest-test.supabase.co',supabasePublicKey:'sb_publishable_test',buildVersion:'test-build'};" }));
    const submits = [], signups = [], withdrawals = [], resultsCalls = [];
    let failSubmit = true, failSignup = true, failWithdrawal = true, resultsMode = 'invalid';
    const current = [
      { created_at: '2026-10-29T12:00:00Z', build_version: 'build-A', perceived_time_flow: 4, post_session_feeling: 'another_night', memorable_moment: '<img src=x onerror=alert(1)>' },
      { created_at: '2026-10-29T12:10:00Z', build_version: 'build-A', perceived_time_flow: 1, post_session_feeling: 'retry_better', memorable_moment: null },
      { created_at: '2026-10-29T12:20:00Z', build_version: 'build-B', perceived_time_flow: 3, post_session_feeling: 'prefer_stop', memorable_moment: 'x'.repeat(1200) }
    ];
    const historical = { created_at: '2026-09-29T12:00:00Z', build_version: 'old-build', completed_night_1: true, completed_night_2: 'not_reached', highest_night: 1,
      initial_understanding: 3, controls_intuitiveness: 3, cooking_understanding: 3, heat_understanding: 3, order_readability: 3, difficulty_fairness: 3,
      customer_pacing: 'good', learning_feeling: 3, stress_experience: 'balanced', want_to_continue: 'maybe', favorite_part: 'Una noche', one_thing_to_change: 'El ritmo' };
    await context.route('**/rest/v1/**', async route => {
      const request = route.request(), endpoint = new URL(request.url()).pathname.split('/').pop();
      assert.equal(new URL(request.url()).hostname, 'playtest-test.supabase.co', 'never contact the configured real project');
      assert.equal(request.method(), 'POST');
      const body = request.postDataJSON();
      const response = (status, payload) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(payload) });
      if (endpoint === 'submit_playtest_v2') {
        submits.push(body); await new Promise(resolve => setTimeout(resolve, 200));
        return response(failSubmit ? 503 : 200, failSubmit ? { message: 'Unavailable' } : null);
      }
      if (endpoint === 'subscribe_launch_notice') {
        signups.push(body); return response(failSignup ? 503 : 200, failSignup ? { message: 'Unavailable' } : null);
      }
      if (endpoint === 'revoke_launch_notice') {
        withdrawals.push(body); return response(failWithdrawal ? 503 : 200, failWithdrawal ? { message: 'Unavailable' } : null);
      }
      if (endpoint === 'playtest_results_v2' || endpoint === 'playtest_results') {
        resultsCalls.push({ endpoint, body });
        if (resultsMode === 'network') return route.abort('failed');
        if (resultsMode === 'invalid') return response(400, { code: 'P0001', message: 'Access denied' });
        if (resultsMode === 'malformed') return response(200, [{}]);
        return response(200, resultsMode === 'empty' ? [] : endpoint === 'playtest_results' ? [historical] : resultsMode === 'many' ? Array.from({ length: 1200 }, (_, i) => current[i % 3]) : current);
      }
      throw new Error('Unexpected API: ' + endpoint);
    });
    await page.goto(base + '/preguntas.html');
    assert.equal(await page.locator('#survey fieldset').count(), 3);
    assert.equal(await page.locator('#survey input[type=email]').count(), 0);
    assert(await page.locator('#signup').isHidden());
    await page.locator('#submit-survey').click();
    assert.equal(await page.locator('.field-error:not(:empty)').count(), 2);
    assert.equal(submits.length, 0);
    await page.locator('[name=perceived_time_flow][value="4"]').check();
    await page.locator('[name=post_session_feeling][value=retry_better]').check();
    await page.locator('#memorable_moment').fill('Un pedido que salió a tiempo.');
    await page.locator('#submit-survey').click();
    await page.locator('#survey').evaluate(form => form.requestSubmit());
    assert(await page.locator('#submit-survey').isDisabled());
    await page.waitForFunction(() => document.querySelector('#survey-status').textContent.includes('No pudimos'));
    assert.equal(submits.length, 1);
    assert.equal(await page.locator('#memorable_moment').inputValue(), 'Un pedido que salió a tiempo.');
    await page.locator('[data-language-link]').click();
    await page.waitForURL('**/preguntas-en.html');
    assert.equal(await page.locator('#memorable_moment').inputValue(), 'Un pedido que salió a tiempo.');
    assert(await page.locator('#memorable_moment').isDisabled());
    assert.match(await page.locator('#survey-status').textContent(), /pending/);
    await page.locator('[data-language-link]').click();
    await page.waitForURL('**/preguntas.html');
    failSubmit = false;
    await page.locator('#submit-survey').click();
    await page.locator('#success').waitFor({ state: 'visible' });
    await page.setViewportSize({ width: 390, height: 900 });
    assert(await page.locator('#signup').evaluate(form => {
      const bounds = form.getBoundingClientRect();
      return bounds.left >= 0 && bounds.right <= innerWidth &&
        [...form.children].every(child => child.getBoundingClientRect().right <= bounds.right + 1) &&
        form.querySelector('[name=consent]').getBoundingClientRect().width <= 24;
    }), 'mobile email form stays inside the thank-you panel');
    assert.deepEqual(submits[0], submits[1], 'uncertain retry sends exactly the same UUID and answers');
    assert.deepEqual(Object.keys(submits[1]).sort(), ['p_build_version','p_memorable_moment','p_perceived_time_flow','p_post_session_feeling','p_session_id']);
    assert.equal(signups.length, 0, 'survey success is independent from email');
    await page.reload();
    assert(await page.locator('#success').isVisible(), 'confirmed submission remembered for this tab/build');
    assert.equal(submits.length, 2);
    assert.equal(await page.locator('[name=consent]').isChecked(), false);
    await page.locator('#signupMail').fill(' Test@Example.com ');
    await page.locator('#signup button[type=submit]').click();
    assert.equal(signups.length, 0);
    await page.locator('[name=consent]').check();
    await page.locator('#signup button[type=submit]').click();
    await page.waitForFunction(() => document.querySelector('#signupNote').textContent.includes('No pudimos'));
    assert.equal(await page.locator('#signupMail').inputValue(), 'Test@Example.com');
    await page.reload();
    assert.equal(await page.locator('#signupMail').inputValue(), 'test@example.com');
    assert.equal(await page.locator('[name=consent]').isChecked(), false, 'consent is never preselected, including recovery');
    await page.locator('[name=consent]').check();
    failSignup = false;
    await page.locator('#signup button[type=submit]').click();
    await page.locator('#signup-receipt').waitFor({ state: 'visible' });
    assert.deepEqual(signups[0], signups[1]);
    assert.equal(signups[1].p_email, 'test@example.com');
    assert.equal(signups[1].p_consent, true);
    assert.equal(signups[1].p_consent_version, 'steam-wishlist-v1');
    assert.match(signups[1].p_withdrawal_token, /^[a-f0-9]{64}$/);
    assert(!('p_session_id' in signups[1]));
    const withdrawalUrl = await page.locator('#withdrawal-link').getAttribute('href');
    await page.goto(withdrawalUrl);
    await page.waitForFunction(() => !document.querySelector('#withdraw').disabled);
    assert.equal(withdrawals.length, 0, 'GET link must not withdraw consent');
    assert.equal(new URL(page.url()).hash, '');
    assert.match(await page.locator('[data-language-link]').getAttribute('href'), /#[a-f0-9]{64}$/);
    await page.locator('#withdraw').click();
    await page.waitForFunction(() => document.querySelector('#withdraw-status').textContent.includes('No pudimos'));
    failWithdrawal = false;
    await page.locator('#withdraw').click();
    await page.waitForFunction(() => document.querySelector('#withdraw-status').textContent.includes('Solicitud procesada'));
    assert.deepEqual(withdrawals[0], withdrawals[1]);
    assert(await page.locator('#withdraw').isDisabled());
    await page.goto(base + '/retirar-aviso.html');
    assert(await page.locator('#withdraw').isDisabled());
    console.log('PASS survey + consent: required/optional, failed/identical retry, double submit, independent success, consent, token withdrawal');

    await page.goto(base + '/resultados.html');
    assert.equal(resultsCalls.length, 0);
    assert(await page.locator('#dashboard').isHidden());
    const login = async () => { await page.locator('#admin-password').fill('test-input'); await page.locator('#unlock').click(); };
    await login();
    await page.waitForFunction(() => document.querySelector('#gate-status').textContent.includes('No se pudo'));
    assert.equal(await page.locator('#results-content').textContent(), '');
    assert.equal(await page.locator('#admin-password').inputValue(), '');
    resultsMode = 'network'; await login();
    await page.waitForFunction(() => document.querySelector('#gate-status').textContent.includes('No pudimos'));
    resultsMode = 'malformed'; await login();
    await page.waitForFunction(() => document.querySelector('#gate-status').textContent.includes('No pudimos'));
    resultsMode = 'empty'; await login();
    await page.locator('#dashboard').waitFor({ state: 'visible' });
    assert.match(await page.locator('#results-content').textContent(), /Todavía no hay respuestas/);
    await page.locator('#lock').click();
    resultsMode = 'populated'; await login();
    await page.locator('#dashboard').waitFor({ state: 'visible' });
    assert.equal(await page.locator('.distribution').count(), 2);
    assert.equal(await page.locator('.response').count(), 2);
    assert.equal(await page.locator('.response img').count(), 0, 'open text is never HTML');
    assert.match(await page.locator('#results-content').textContent(), /33,3% \(1\/3\)/);
    assert.equal(await page.locator('.build-comparison tbody tr').count(), 2);
    const { default: AxeBuilder } = require('../test-artifacts/qa/node_modules/@axe-core/playwright');
    let scan = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    assert.deepEqual(scan.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), [], 'populated private panel accessibility');
    await page.locator('#build-filter').selectOption('build-A');
    assert.match(await page.locator('.metrics').textContent(), /50% \(1\/2\)/);
    for (const width of [320,390,768,1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'results overflow ' + width);
      if (width === 390 || width === 1440) await page.screenshot({ path: path.join(output, 'results-' + width + '.png'), fullPage: true });
    }
    await page.locator('#lock').click();
    await page.locator('#results-source').selectOption('historical'); await login();
    await page.locator('#dashboard').waitFor({ state: 'visible' });
    assert.equal(resultsCalls.at(-1).endpoint, 'playtest_results');
    assert.equal(await page.locator('.rating-summary dd').first().textContent(), '3 / 5');
    await page.reload();
    assert(await page.locator('#dashboard').isHidden());
    assert.equal(await page.locator('#results-content').textContent(), '');
    resultsMode = 'many'; await login(); await page.locator('#dashboard').waitFor({ state: 'visible' });
    assert.equal(await page.locator('.response').count(), 800);
    await page.locator('#lock').click();
    assert.equal(await page.locator('.response').count(), 0);
    console.log('PASS private results: no prefetch, passwords, network/malformed/empty/large payloads, distributions, builds, legacy, XSS, lock/reload');

    for (const file of ['preguntas.html','preguntas-en.html']) {
      await page.evaluate(() => sessionStorage.clear());
      for (const width of [320,390,768,1440]) {
        await page.setViewportSize({ width, height: 900 }); await page.goto(base + '/' + file);
        assert.equal(await page.locator('#survey fieldset').count(), 3);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), file + ' overflow ' + width);
      }
      await page.locator('[name=perceived_time_flow]').first().focus(); await page.keyboard.press('ArrowRight');
      assert(await page.locator('[name=perceived_time_flow]').nth(1).isChecked());
      assert.equal(await page.locator('[name=perceived_time_flow]:checked').evaluate(el => getComputedStyle(el.closest('label')).outlineStyle), 'solid');
    }
    await page.locator('[name=post_session_feeling][value=unsure]').check();
    await page.locator('#submit-survey').click();
    await page.locator('#success').waitFor({ state: 'visible' });
    assert.equal(submits.at(-1).p_memorable_moment, null, 'open text is optional');
    assert.match(await page.locator('#thanks').textContent(), /Thanks/);
    scan = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    assert.deepEqual(scan.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), [], 'thank-you and independent consent accessibility');
    await page.goto(base + '/wishlist/');
    await page.locator('#signupMail').fill('bad'); await page.locator('#signup button[type=submit]').click();
    assert.match(await page.locator('#signupNote').textContent(), /email/);
    await page.locator('#signupMail').fill('wishlist@example.com'); await page.locator('[name=consent]').check();
    await page.locator('#signup button[type=submit]').click(); await page.locator('#signup-receipt').waitFor({ state: 'visible' });
    assert.equal(signups.at(-1).p_email, 'wishlist@example.com');
    await page.goto(base + '/wishlist/en/');
    await page.locator('#signupMail').fill('english@example.com'); await page.locator('[name=consent]').check();
    await page.locator('#signup button[type=submit]').click(); await page.locator('#signup-receipt').waitFor({ state: 'visible' });
    assert.equal(signups.at(-1).p_language, 'en');
    assert.match(await page.locator('#withdrawal-link').getAttribute('href'), /retirar-aviso-en/);
    await page.goto(base);
    assert.equal(await page.locator('.hero__cta a').count(), 1);
    assert.equal(await page.locator('a[href="preguntas.html"]').count(), 1);
    assert.equal(await page.locator('a[href*="resultados"]').count(), 0);
    let steamVisits = 0;
    await page.route('https://store.steampowered.com/**', route => { steamVisits++; return route.fulfill({ body: '<title>Steam</title>' }); });
    await page.route('**/steam-config.js', route => route.fulfill({ contentType: 'application/javascript', body: "window.STEAM_URL='https://evil.example/';" }));
    await page.goto(base + '/wishlist/'); assert.equal(new URL(page.url()).pathname, '/wishlist/');
    await page.unroute('**/steam-config.js');
    await page.route('**/steam-config.js', route => route.fulfill({ contentType: 'application/javascript', body: "window.STEAM_URL='https://store.steampowered.com/app/123/';" }));
    for (const url of ['wishlist/','wishlist/en/']) { await page.goto(base + '/' + url); await page.waitForURL('https://store.steampowered.com/app/123/'); }
    assert.equal(steamVisits, 2);
    assert.deepEqual(errors, []);
    console.log('PASS ES/EN, keyboard, four responsive widths, wishlist consent and existing Steam redirect, home CTA');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
