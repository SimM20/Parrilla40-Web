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
  let html = '<div id="questions">';
  questions.forEach((q, index) => {
    html += `<fieldset class="question" id="question-${q.name}"><legend><span class="question-number">0${index + 1}</span><span>${escape(t(q.label, language))}</span></legend>`;
    if (q.optional) html += `<p class="question-kind">${escape(t('Opcional', language))}</p>`;
    if (q.options) {
      html += '<div class="choices">';
      for (const [value, label] of q.options) {
        html += `<label class="choice"><input type="radio" name="${q.name}" value="${value}" required aria-describedby="error-${q.name}${q.type === 'rating' ? ` hint-${q.name}` : ''}"><span>${escape(t(label, language))}</span></label>`;
      }
      html += '</div>';
    } else {
      html += `<p class="field-hint" id="hint-${q.name}">${escape(t(q.hint, language))}</p>`;
      html += `<label class="sr-only" for="${q.name}">${escape(t(q.label, language))}</label>`;
      html += `<textarea id="${q.name}" name="${q.name}" rows="2" maxlength="1200" aria-describedby="hint-${q.name} error-${q.name} text-count"></textarea>`;
      html += '<div class="text-meta"><span id="text-count">0 / 1200</span></div>';
    }
    html += `<p class="field-error" id="error-${q.name}"></p></fieldset>`;
  });
  return `<!-- QUESTIONS:START -->\n${html}</div>\n<!-- QUESTIONS:END -->`;
}

function signup(language) {
  const tr = text => escape(t(text, language));
  const privacy = language === 'en' ? '/privacidad-en.html' : '/privacidad.html';
  return `<!-- SIGNUP:START -->
<form class="signup consent-signup" id="signup" novalidate>
  <label for="signupMail">${tr('Tu email')}</label>
  <input type="email" id="signupMail" name="email" autocomplete="email" inputmode="email" maxlength="254" spellcheck="false" required aria-describedby="signupNote">
  <label class="consent-choice"><input type="checkbox" name="consent" required aria-describedby="signupNote"><span>${tr('Quiero recibir un único aviso por email cuando pueda agregar Parrilla 40 a mi lista de deseados en Steam.')} <a href="${privacy}">${tr('Privacidad')}</a></span></label>
  <button class="btn" type="submit" disabled>${tr('Anotarme')}</button>
</form>
<p class="signup__note" id="signupNote" role="status"></p>
<div class="signup-receipt" id="signup-receipt" hidden>
  <p>${tr('Guardá este enlace privado para darte de baja. Si ya te anotaste antes, usá tu enlace original.')}</p>
  <a id="withdrawal-link" href="#" referrerpolicy="no-referrer">${tr('Darme de baja')}</a>
  <button class="site-control" id="download-withdrawal" type="button">${tr('Guardar enlace')}</button>
</div>
<!-- SIGNUP:END -->`;
}

function translate(html, page) {
  const spanish = config.pages.find(p => p.file === page.alternate) || { file: page.alternate, path: page.alternate };
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
    .replace(/href="\/"/g, 'href="/index-en.html"')
    .replace(/href="wishlist\/"/g, 'href="wishlist/en/"')
    .replace(/href="(\/)?(privacidad|terminos|almacenamiento)\.html"/g, 'href="$1$2-en.html"')
    .replace(/<a class="site-control"[^>]+data-language-link>EN<\/a>/g, match => match
      .replace(/href="[^"]+"/, `href="${page.file.includes('/') ? '/' + spanish.path : spanish.file}"`)
      .replace('lang="en"', 'lang="es"').replace('hreflang="en"', 'hreflang="es"')
      .replace('aria-label="EN: Switch to English"', 'aria-label="ES: Switch to Spanish"').replace('>EN<', '>ES<'));
}

function optimizeImages(html) {
  // Replacing an existing picture instead of nesting one keeps regeneration stable.
  html = html.replace(/<picture><source[^>]+><source[^>]+>(<img\b[^>]+>)<\/picture>/g, '$1');
  return html.replace(/<img\b[^>]+>/g, tag => {
    const src = tag.match(/\bsrc="([^"]+)"/)?.[1];
    // Directory pages reference assets from the site root ("/assets/...").
    const prefix = src?.startsWith('/') ? '/' : '', source = src?.slice(prefix.length);
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
    return `<picture><source type="image/avif" srcset="${data.variants.map(v => `${prefix}assets/optimized/${v.stem}.avif ${v.width}w`).join(', ')}" sizes="${sizes}"><source type="image/webp" srcset="${data.variants.map(v => `${prefix}assets/optimized/${v.stem}.webp ${v.width}w`).join(', ')}" sizes="${sizes}">${tag}</picture>`;
  });
}

const bootstrap = `<script>(function(){var t;try{t=localStorage.getItem('parrilla40-theme')}catch(e){}if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;document.documentElement.dataset.js='true';document.querySelector('meta[name="theme-color"]').content=t==='dark'?'#100c0a':'#f6e8d6'})();</script>`;
function head(html, page) {
  html = html.replace(/<!-- SEO:START -->[\s\S]*?<!-- SEO:END -->\n?/g, '')
    .replace(/<!-- SITE:START -->[\s\S]*?<!-- SITE:END -->\n?/g, '');
  let [before, after] = html.split('</head>');
  // Pages served from a directory (and the 404 at any path) use root-absolute assets.
  const prefix = page.file === '404.html' || page.file.includes('/') ? '/' : '';
  before = before.replace(/<script defer src="\/?site(?:-data)?\.js"><\/script>\n?/g, '');
  if (!before.includes('rel="icon"')) before = before.replace(/(<meta name="viewport"[^>]*>)/, `$1\n<link rel="icon" href="${prefix}assets/extras/carbon-prendido.png">`);
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
  return (before + '</head>' + after).replace(/<html lang="[^"]+"/, `<html lang="${page.language || 'es'}"`);
}

// Keep the questionnaire definition in playtest.js; no duplicated field definitions.
let surveySource = read('preguntas.html').replace(/<!-- QUESTIONS:START -->[\s\S]*?<!-- QUESTIONS:END -->|<div id="questions"><\/div>/, '<!-- QUESTIONS -->');
for (const page of config.pages) {
  const spanish = page.language === 'es' ? page : config.pages.find(p => p.file === page.alternate);
  const source = (spanish.file === 'preguntas.html' ? surveySource : read(spanish.file))
    .replace(/<!-- SIGNUP:START -->[\s\S]*?<!-- SIGNUP:END -->/, '<!-- SIGNUP -->');
  let html = page.language === 'en' ? translate(source, page) : source;
  if (page.file.startsWith('preguntas')) html = html.replace('<!-- QUESTIONS -->', survey(page.language));
  html = html.replace('<!-- SIGNUP -->', signup(page.language));
  fs.mkdirSync(path.dirname(path.join(root, page.file)), { recursive: true });
  write(page.file, optimizeImages(head(html, page)));
}
const withdrawalSource = read('retirar-aviso.html');
write('retirar-aviso.html', head(withdrawalSource, { file: 'retirar-aviso.html', language: 'es' }));
write('retirar-aviso-en.html', head(translate(withdrawalSource, { file: 'retirar-aviso-en.html', alternate: 'retirar-aviso.html' }), { file: 'retirar-aviso-en.html', language: 'en' }).replace('<title>Retirar consentimiento — Parrilla 40</title>', '<title>Withdraw consent — Parrilla 40</title>'));
for (const file of ['resultados.html', 'resultados-en.html', 'ranking-evento.html', '404.html', 'privacidad.html', 'privacidad-en.html', 'terminos.html', 'terminos-en.html', 'almacenamiento.html', 'almacenamiento-en.html']) {
  if (fs.existsSync(path.join(root, file))) write(file, optimizeImages(head(read(file), { file, language: file.includes('-en') ? 'en' : 'es' })));
}
write('site-data.js', '// Generated by tools/generate-site.cjs from translations.json and the image manifest.\nwindow.TRANSLATIONS=' + JSON.stringify({ es: {}, en: english }) + ';\nwindow.SITE_IMAGES=' + JSON.stringify(images) + ';\n');
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${config.pages.map(p => `  <url><loc>${escape(absolute(p.path))}</loc></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${absolute('sitemap.xml')}\n`);
console.log('Generated ES/EN static pages, metadata, questionnaire, JSON-LD, image sources, sitemap and robots.');
