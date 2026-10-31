const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const config = require('../site-config.json');
const read = file => fs.readFileSync(file, 'utf8');
const titles = new Set(), descriptions = new Set();
const urls = config.pages.map(page => new URL(page.path, config.url).href);
for (const page of config.pages) {
  const html = read(page.file), head = html.split('</head>')[0];
  assert.match(html, new RegExp(`<html lang="${page.language}">`));
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.equal((html.match(/<main\b/g) || []).length, 1);
  assert.equal((head.match(/<title>/g) || []).length, 1);
  assert.equal((head.match(/rel="canonical"/g) || []).length, 1);
  assert.equal((head.match(/src="\/?site\.js"/g) || []).length, 1);
  assert.equal((head.match(/src="\/?site-data\.js"/g) || []).length, 1);
  assert(head.indexOf("localStorage.getItem('parrilla40-theme')") < head.indexOf('rel="stylesheet"'));
  assert(head.includes(`rel="canonical" href="${new URL(page.path, config.url).href}"`));
  assert(!head.includes('noindex'));
  assert(!html.includes('/resultados/'));
  assert(!html.includes('ranking-evento'));
  assert(!head.includes('name="keywords"'));
  const title = head.match(/<title>([^<]+)<\/title>/)[1];
  const description = head.match(/name="description" content="([^"]+)"/)[1];
  assert(!titles.has(title)); titles.add(title);
  assert(!descriptions.has(description)); descriptions.add(description);
  for (const name of ['og:title', 'og:description', 'og:image', 'og:url', 'og:type', 'og:locale', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']) assert(head.includes(`="${name}"`));
  const alternates = [...head.matchAll(/rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)];
  assert.deepEqual(alternates.map(match => match[1]), ['es', 'en', 'x-default']);
  for (const match of alternates) {
    assert(urls.includes(match[2]));
    const target = config.pages.find(p => new URL(p.path, config.url).href === match[2]);
    const targetHtml = read(target.file);
    for (const other of alternates) assert(targetHtml.includes(`hreflang="${other[1]}" href="${other[2]}"`));
  }
  const schema = JSON.parse(head.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1]);
  assert.equal(schema['@context'], 'https://schema.org');
  assert.deepEqual(schema['@graph'].map(node => node['@type']), ['WebSite', 'VideoGame', 'WebPage']);
  const ids = schema['@graph'].map(node => node['@id']);
  assert.equal(new Set(ids).size, ids.length);
  for (const node of schema['@graph']) {
    assert.match(node['@id'], /^https:\/\//);
    assert.match(node.url, /^https:\/\//);
    assert(!('telephone' in node || 'address' in node || 'aggregateRating' in node));
  }
  const references = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(match => match[1]);
  for (const reference of references) {
    if (/^(https?:|#|mailto:|data:)/.test(reference)) continue;
    const target = reference.split('#')[0].replace(/^\//, '').replace(/(^|\/)$/, '$1index.html');
    assert(fs.existsSync(target), `${page.file}: missing ${reference}`);
  }
  for (const match of html.matchAll(/<img\b[^>]*>/g)) {
    assert(/\balt=/.test(match[0]));
    assert(/\bwidth=/.test(match[0]) && /\bheight=/.test(match[0]));
    if (/hero__layer/.test(match[0])) assert(!match[0].includes('loading="lazy"'));
  }
  if (page.file.startsWith('preguntas')) {
    assert.equal((html.match(/<fieldset\b/g) || []).length, 3);
    assert(!/16 preguntas|16 .*questions/.test(html));
  }
}
const sitemap = read('sitemap.xml');
assert.deepEqual([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]), urls);
assert(!sitemap.includes('lastmod'));
assert(!sitemap.includes('resultados'));
assert(!sitemap.includes('ranking-evento'));
assert(!read('robots.txt').includes('ranking-evento'));
const robots = read('robots.txt');
assert(robots.includes(`Sitemap: ${new URL('sitemap.xml', config.url).href}`));
assert(!robots.includes('Disallow:'));
assert.match(read('resultados/index.html'), /name="robots" content="noindex, nofollow, noarchive"/);
assert.match(read('ranking-evento/index.html'), /name="robots" content="noindex, nofollow, noarchive"/);
assert.match(read('404.html'), /name="robots" content="noindex, follow"/);
for (const file of ['privacidad/index.html','privacidad/en/index.html','terminos/index.html','terminos/en/index.html','almacenamiento/index.html','almacenamiento/en/index.html','retirar-aviso/index.html','retirar-aviso/en/index.html','resultados/en/index.html']) {
  const html = read(file);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, file);
  assert.match(html, /name="robots" content="noindex/);
  assert.match(html, /<footer[\s\S]*href="\/privacidad\/(?:en\/)?"/);
  if (!file.startsWith('resultados')) assert(!html.includes('href="/resultados/"'), 'no public link to private results');
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const ref = match[1];
    if (/^(https?:|mailto:|#)/.test(ref)) continue;
    assert(fs.existsSync(ref.split('#')[0].replace(/^\//, '').replace(/(^|\/)$/, '$1index.html')), `${file}: missing ${ref}`);
  }
}
for (const data of Object.values(require('../assets/optimized/manifest.json'))) {
  for (const variant of data.variants) {
    const avif = fs.readFileSync(`assets/optimized/${variant.stem}.avif`);
    const webp = fs.readFileSync(`assets/optimized/${variant.stem}.webp`);
    assert(avif.subarray(0, 40).toString().includes('avif'));
    assert.equal(webp.subarray(8, 12).toString(), 'WEBP');
    assert(Math.abs(variant.width / variant.height - data.width / data.height) < .01);
  }
}
for (const file of fs.readdirSync('.').filter(file => file.endsWith('.js'))) execFileSync(process.execPath, ['--check', file]);
const generated = [...config.pages.map(page => page.file), 'resultados/index.html', 'resultados/en/index.html', 'ranking-evento/index.html', '404.html', 'privacidad/index.html','privacidad/en/index.html','terminos/index.html','terminos/en/index.html','almacenamiento/index.html','almacenamiento/en/index.html','retirar-aviso/index.html','retirar-aviso/en/index.html', 'robots.txt', 'sitemap.xml', 'site-data.js'];
const before = generated.map(read);
execFileSync(process.execPath, ['tools/generate-site.cjs']);
generated.forEach((file, i) => assert.equal(require('node:crypto').createHash('sha256').update(read(file)).digest('hex'), require('node:crypto').createHash('sha256').update(before[i]).digest('hex'), `generation must be idempotent: ${file}`));
console.log('PASS SEO: three static questions per language, metadata, reciprocal hreflang, canonical, JSON-LD, sitemap, robots, assets, syntax, repeatable generation');
