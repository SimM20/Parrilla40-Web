// Optional local QA tools only; no dependencies are added to the website.
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

(async () => {
  const qa = path.resolve(process.env.QA_MODULES || 'test-artifacts/qa/node_modules');
  const { default: lighthouse } = await import(pathToFileURL(path.join(qa, 'lighthouse/core/index.js')));
  const { launch } = await import(pathToFileURL(path.join(qa, 'chrome-launcher/dist/index.js')));
  const output = path.resolve(process.argv[2] || 'test-artifacts/performance');
  fs.mkdirSync(output, { recursive: true });
  const chrome = await launch({
    chromePath: process.env.CHROME_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage']
  });
  try {
    const summary = { measuredAt: new Date().toISOString(), url: process.env.TEST_URL || 'http://127.0.0.1:8000/', runs: [] };
    for (const mode of ['mobile', 'desktop']) {
      for (let run = 1; run <= Number(process.env.AUDIT_RUNS || 3); run++) {
        const result = await lighthouse(summary.url, {
          port: chrome.port, output: 'html', logLevel: 'error',
          onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
        }, mode === 'desktop' ? { extends: 'lighthouse:default', settings: { formFactor: 'desktop',
          screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
          throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1, requestLatencyMs: 0, downloadThroughputKbps: 0, uploadThroughputKbps: 0 } } } : undefined);
        const lhr = result.lhr;
        const record = { mode, run, lighthouseVersion: lhr.lighthouseVersion,
          scores: Object.fromEntries(Object.entries(lhr.categories).map(([key, value]) => [key, Math.round(value.score * 100)])),
          lcp: lhr.audits['largest-contentful-paint'].numericValue,
          cls: lhr.audits['cumulative-layout-shift'].numericValue,
          tbt: lhr.audits['total-blocking-time'].numericValue,
          bytes: lhr.audits['total-byte-weight'].numericValue,
          failedAudits: Object.entries(lhr.audits).filter(([, value]) => value.score !== null && value.score < 1 && value.scoreDisplayMode !== 'informative').map(([key]) => key) };
        summary.runs.push(record);
        fs.writeFileSync(path.join(output, `${mode}-${run}.html`), result.report);
        fs.writeFileSync(path.join(output, `${mode}-${run}.json`), JSON.stringify(lhr, null, 2));
        fs.writeFileSync(path.join(output, 'summary.json'), JSON.stringify(summary, null, 2));
        console.log(JSON.stringify(record));
      }
    }
  } finally { await chrome.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
