// Copy only public runtime files. This does not deploy or change any server.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'test-artifacts/public');
const files = ['index.html', 'index-en.html', 'preguntas.html', 'preguntas-en.html', 'resultados.html', 'ranking-evento.html', '404.html',
  'styles.css', 'playtest.css', 'site.css', 'script.js', 'site.js', 'site-data.js', 'playtest.js',
  'preguntas.js', 'resultados.js', 'ranking-evento.js', 'ranking-evento-config.js', 'playtest-config.js', 'steam-config.js', 'wishlist.js', 'robots.txt', 'sitemap.xml'];
fs.mkdirSync(output, { recursive: true });
for (const file of files) fs.copyFileSync(path.join(root, file), path.join(output, file));
for (const directory of ['assets', 'fonts', 'wishlist']) fs.cpSync(path.join(root, directory), path.join(output, directory), { recursive: true });
console.log(`Public static files copied to ${output}`);
