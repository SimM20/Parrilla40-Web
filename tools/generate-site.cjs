// Authoring helper. Generated HTML is committed and served directly, without a build.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const write = (file, value) => fs.writeFileSync(path.join(root, file), value);
const config = JSON.parse(read('site-config.json'));
const english = JSON.parse(read('translations.json'));
const images = JSON.parse(read('assets/optimized/manifest.json'));
const base = new URL(config.url);
if (base.protocol !== 'https:' || base.search || base.hash || base.username || base.password || !base.pathname.endsWith('/')) {
  throw new Error('site-config.json requires an absolute HTTPS site URL ending in /, without query, hash or credentials.');
}
const absolute = file => new URL(file, base).href;
const escape = text => String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const t = (text, language) => language === 'en' ? english[text] || text : text;
const context = { window: {} };
vm.runInNewContext(read('playtest.js'), context);
const { questions } = context.window.Playtest;

function survey(language) {
  const blocks = {
    0: ['Tu partida', 'Empecemos por las noches que jugaste.', 'assets/extras/carbon-prendido.png'],
    3: ['La experiencia', 'Pensá en cómo se sintió jugar, desde el primer pedido.', 'assets/cortes/chorizo-jugoso.png'],
    13: ['Lo que te llevás', 'Dos respuestas para ayudarnos a mejorar. No incluyas datos personales.', 'assets/cortes/choripan-hecho.png']
  };
  let html = '<div id="questions">';
  questions.forEach((q, index) => {
    if (blocks[index]) {
      if (index) html += '</section>';
      const [title, text, sprite] = blocks[index];
      html += `<section class="survey-block" aria-labelledby="block-${index}"><div class="survey-section-heading"><img class="px" src="${sprite}" alt="" width="56" height="56" loading="lazy" decoding="async"><div><h2 id="block-${index}">${escape(t(title, language))}</h2><p>${escape(t(text, language))}</p></div></div>`;
    }
    html += `<fieldset class="question" id="question-${q.name}"><legend><span class="question-number">${String(index + 1).padStart(2, '0')}</span><span>${escape(t(q.label, language))}</span></legend>`;
    if (q.options) {
      html += `<div class="choices${q.type === 'rating' ? ' ratings' : ''}">`;
      for (const [value, label] of q.options) {
        html += `<label class="choice"><input type="radio" name="${q.name}" value="${value}" required aria-describedby="error-${q.name}${q.type === 'rating' ? ` hint-${q.name}` : ''}"><span>${escape(t(label, language))}</span></label>`;
      }
      html += '</div>';
      if (q.type === 'rating') html += `<p class="field-hint scale-ends" id="hint-${q.name}"><span>1 · ${escape(t(q.low, language))}</span><span>5 · ${escape(t(q.high, language))}</span></p>`;
    } else {
      html += `<label class="sr-only" for="${q.name}">${escape(t(q.label, language))}</label>`;
      const attributes = `id="${q.name}" name="${q.name}" required aria-describedby="hint-${q.name} error-${q.name}"`;
      html += q.type === 'text'
        ? `<textarea ${attributes} rows="4" maxlength="4000"></textarea>`
        : `<input ${attributes} type="number" min="0" max="2147483647" step="1" inputmode="numeric">`;
      const hint = q.type === 'text' ? 'Hasta 4000 caracteres. No incluyas datos personales.' : 'Un número entero, sin decimales. Si no llegaste a ninguna noche, ingresá 0.';
      html += `<p class="field-hint" id="hint-${q.name}">${escape(t(hint, language))}</p>`;
      if (q.type === 'text') html += `<span class="text-count" id="count-${q.name}">0 / 4000</span>`;
    }
    html += `<p class="field-error" id="error-${q.name}"></p></fieldset>`;
  });
  return `<!-- QUESTIONS:START -->\n${html}</section></div>\n<!-- QUESTIONS:END -->`;
}

function translate(html) {
  const unchanged = new Set(['PARRILLA 40', 'PARRILLA', 'EN', 'Q', 'R', 'T', 'C', 'M', 'Strike', '2026 release', 'Management', 'PC (Steam)']);
  const start = html.indexOf('<body');
  return html.slice(0, start) + html.slice(start)
    .replace(/>([^<>]+)</g, (match, text) => {
      const key = text.replace(/\s+/g, ' ').trim();
      if (/[a-zA-ZÀ-ÿ]/.test(key) && !english[key] && !unchanged.has(key) && !/^[\d.]+ (h|min)$/.test(key)) {
        throw new Error(`Add an English translation in translations.json: ${key}`);
      }
      return english[key] ? `>${text.match(/^\s*/)[0]}${english[key]}${text.match(/\s*$/)[0]}<` : match;
    })
    .replace(/\b(alt|aria-label|placeholder)="([^"]+)"/g, (match, attr, text) => `${attr}="${escape(t(text, 'en'))}"`)
    .replace(/href="index.html"/g, 'href="index-en.html"')
    .replace(/href="preguntas.html"/g, 'href="preguntas-en.html"')
    .replace(/<a class="site-control"[^>]+data-language-link>EN<\/a>/g, match => match
      .replace(/href="[^"]+"/, `href="${html.includes('id="survey"') ? 'preguntas.html' : 'index.html'}"`)
      .replace('lang="en"', 'lang="es"').replace('hreflang="en"', 'hreflang="es"')
      .replace('aria-label="EN: Switch to English"', 'aria-label="ES: Switch to Spanish"').replace('>EN<', '>ES<'));
}

function optimizeImages(html) {
  // Replacing an existing picture instead of nesting one keeps regeneration stable.
  html = html.replace(/<picture><source[^>]+><source[^>]+>(<img\b[^>]+>)<\/picture>/g, '$1');
  return html.replace(/<img\b[^>]+>/g, tag => {
    const source = tag.match(/\bsrc="([^"]+)"/)?.[1];
    if (!source || !fs.existsSync(path.join(root, source))) return tag;
    const png = fs.readFileSync(path.join(root, source));
    if (path.extname(source) !== '.png') return tag;
    const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
    // Explicitly sized section icons are intentional squares, not intrinsic sizing.
    if (!/\bwidth=/.test(tag)) tag = tag.replace('>', ` width="${width}" height="${height}">`);
    const critical = /hero__layer/.test(tag);
    if (!/\bloading=/.test(tag)) tag = tag.replace('>', ` loading="${critical || /playtest-sprite/.test(tag) ? 'eager' : 'lazy'}">`);
    if (!/\bdecoding=/.test(tag)) tag = tag.replace('>', ' decoding="async">');
    if (/id="heroStars"/.test(tag) && !/fetchpriority/.test(tag)) tag = tag.replace('>', ' fetchpriority="high">');
    const data = images[source];
    if (!data) return tag;
    const sizes = source.endsWith('radio.png') ? '90px' : source.endsWith('candado.png') ? '84px' : source.endsWith('paisaje.png') ? '100vw' : '60px';
    return `<picture><source type="image/avif" srcset="${data.variants.map(v => `assets/optimized/${v.stem}.avif ${v.width}w`).join(', ')}" sizes="${sizes}"><source type="image/webp" srcset="${data.variants.map(v => `assets/optimized/${v.stem}.webp ${v.width}w`).join(', ')}" sizes="${sizes}">${tag}</picture>`;
  });
}

const bootstrap = `<script>(function(){var t;try{t=localStorage.getItem('parrilla40-theme')}catch(e){}if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;document.documentElement.dataset.js='true';document.querySelector('meta[name="theme-color"]').content=t==='dark'?'#100c0a':'#f6e8d6'})();</script>`;
function head(html, page) {
  html = html.replace(/<!-- SEO:START -->[\s\S]*?<!-- SEO:END -->\n?/g, '')
    .replace(/<!-- SITE:START -->[\s\S]*?<!-- SITE:END -->\n?/g, '');
  let [before, after] = html.split('</head>');
  const prefix = page.file === '404.html' ? '/' : '';
  before = before.replace(/<script defer src="\/?site(?:-data)?\.js"><\/script>\n?/g, '');
  if (config.pages.includes(page)) {
    before = before.replace(/<title>[\s\S]*?<\/title>\n?/g, '').replace(/<meta name="(?:description|robots|theme-color)"[^>]*>\n?/g, '');
    const es = page.language === 'es' ? page : config.pages.find(p => p.file === page.alternate);
    const en = page.language === 'en' ? page : config.pages.find(p => p.file === page.alternate);
    const url = absolute(page.path), image = absolute(`assets/og-${page.language}.png`);
    const graph = [
      { '@type': 'WebSite', '@id': absolute('#website'), url: base.href, name: config.name, inLanguage: ['es', 'en'] },
      { '@type': 'VideoGame', '@id': absolute('#game'), name: config.name, url: base.href,
        description: config.pages.find(p => p.file.startsWith('index') && p.language === page.language).description,
        gamePlatform: 'PC', genre: ['Simulation', 'Management'], image: absolute(`assets/og-${page.language}.png`) },
      { '@type': 'WebPage', '@id': url + '#webpage', url, name: page.title, description: page.description,
        inLanguage: page.language, isPartOf: { '@id': absolute('#website') }, about: { '@id': absolute('#game') } }
    ];
    before += `<!-- SEO:START -->
<title>${escape(page.title)}</title>
<meta name="description" content="${escape(page.description)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="es" href="${absolute(es.path)}">
<link rel="alternate" hreflang="en" href="${absolute(en.path)}">
<link rel="alternate" hreflang="x-default" href="${absolute(es.path)}">
<meta property="og:site_name" content="${escape(config.name)}">
<meta property="og:title" content="${escape(page.title)}">
<meta property="og:description" content="${escape(page.description)}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="website">
<meta property="og:locale" content="${page.language === 'es' ? 'es_AR' : 'en_US'}">
<meta property="og:locale:alternate" content="${page.language === 'es' ? 'en_US' : 'es_AR'}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escape(page.language === 'es' ? 'Parrilla 40 — simulador de parrilla argentina' : 'Parrilla 40 — Argentine roadside grill simulator')}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escape(page.title)}">
<meta name="twitter:description" content="${escape(page.description)}">
<meta name="twitter:image" content="${image}">
<meta name="twitter:image:alt" content="${escape(config.name)}">
<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script>
<!-- SEO:END -->\n`;
  }
  // Resolve theme before every stylesheet, including on a direct private/404 visit.
  const initial = `<meta name="theme-color" content="#100c0a">\n${bootstrap}\n<script defer src="${prefix}site-data.js"></script>\n<script defer src="${prefix}site.js"></script>`;
  before = before.replace(/(<meta name="viewport"[^>]*>)/, `$1\n<!-- SITE:START -->\n${initial}\n<!-- SITE:END -->`);
  before += `<!-- SITE:START -->
<link rel="preload" href="${prefix}fonts/Bungee-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${prefix}site.css">
<!-- SITE:END -->\n`;
  if (!before.includes('rel="icon"')) before += `<link rel="icon" href="${prefix}assets/extras/carbon-prendido.png">\n`;
  return (before + '</head>' + after).replace(/<html lang="[^"]+"/, `<html lang="${page.language || 'es'}"`);
}

// Keep the questionnaire definition in playtest.js; no duplicated field definitions.
let surveySource = read('preguntas.html').replace(/<!-- QUESTIONS:START -->[\s\S]*?<!-- QUESTIONS:END -->|<div id="questions"><\/div>/, '<!-- QUESTIONS -->');
for (const page of config.pages) {
  const source = page.file.startsWith('index') ? read('index.html') : surveySource;
  let html = page.language === 'en' ? translate(source) : source;
  if (page.file.startsWith('preguntas')) html = html.replace('<!-- QUESTIONS -->', survey(page.language));
  write(page.file, optimizeImages(head(html, page)));
}
for (const file of ['resultados.html', '404.html']) write(file, optimizeImages(head(read(file), { file, language: 'es' })));
write('site-data.js', '// Generated by tools/generate-site.cjs from translations.json and the image manifest.\nwindow.TRANSLATIONS=' + JSON.stringify({ es: {}, en: english }) + ';\nwindow.SITE_IMAGES=' + JSON.stringify(images) + ';\n');
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${config.pages.map(p => `  <url><loc>${escape(absolute(p.path))}</loc></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${absolute('sitemap.xml')}\n`);
console.log('Generated ES/EN static pages, metadata, questionnaire, JSON-LD, image sources, sitemap and robots.');
