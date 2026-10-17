(function () {
  'use strict';
  const root = document.documentElement;
  const english = root.lang === 'en';
  const t = (text, values = {}) => {
    const translated = (english && window.TRANSLATIONS?.en[text]) || text;
    return translated.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);
  };
  const scheme = window.matchMedia('(prefers-color-scheme: dark)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let preference;
  try { preference = localStorage.getItem('parrilla40-theme'); } catch { /* Storage may be disabled. */ }
  const themeButton = document.querySelector('#theme-toggle');

  function applyTheme(theme) {
    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#100c0a' : '#f6e8d6');
    if (themeButton) {
      const dark = theme === 'dark';
      themeButton.setAttribute('aria-pressed', String(dark));
      themeButton.setAttribute('aria-label', t('Modo oscuro'));
      themeButton.title = t(dark ? 'Activar modo claro' : 'Activar modo oscuro');
      themeButton.querySelector('span').textContent = dark ? '☀' : '☾';
      themeButton.hidden = false;
    }
  }
  applyTheme(root.dataset.theme || (scheme.matches ? 'dark' : 'light'));
  requestAnimationFrame(() => root.classList.add('theme-ready'));
  themeButton?.addEventListener('click', () => {
    preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('parrilla40-theme', preference); } catch { /* Keep the selection for this page. */ }
    applyTheme(preference);
  });
  scheme.addEventListener('change', event => {
    if (preference !== 'light' && preference !== 'dark') applyTheme(event.matches ? 'dark' : 'light');
  });

  const motionButton = document.querySelector('#motion-toggle');
  const motionAllowed = () => !reduced.matches && root.dataset.motion !== 'paused';
  function updateMotion() {
    if (motionButton) {
      motionButton.textContent = t(motionAllowed() ? 'Pausar animaciones' : 'Reanudar animaciones');
      motionButton.setAttribute('aria-pressed', String(!motionAllowed()));
      motionButton.disabled = reduced.matches;
      motionButton.hidden = false;
    }
    window.dispatchEvent(new Event('motionchange'));
  }
  motionButton?.addEventListener('click', () => {
    root.dataset.motion = root.dataset.motion === 'paused' ? 'running' : 'paused';
    updateMotion();
  });
  reduced.addEventListener('change', updateMotion);

  const menu = document.querySelector('#menu-toggle');
  const links = document.querySelector('#navigation');
  if (menu && links) {
    menu.hidden = false;
    document.querySelector('#nav').dataset.menuReady = '';
    function closeMenu() {
      links.classList.remove('is-open');
      menu.setAttribute('aria-expanded', 'false');
    }
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open));
      links.classList.toggle('is-open', open);
      if (open) links.querySelector('a').focus();
    });
    links.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); }
    });
  }
  // Keep the same section when following the ordinary, crawlable language link.
  document.querySelector('[data-language-link]')?.addEventListener('click', event => {
    if (location.hash && document.getElementById(location.hash.slice(1))) {
      event.currentTarget.hash = location.hash;
    }
  });
  function picture(source) {
    const data = window.SITE_IMAGES?.[source];
    if (!data) return `<img class="px" src="${source}" alt="" width="100" height="100" loading="lazy" decoding="async">`;
    const variant = data.variants[0];
    return `<picture><source type="image/avif" srcset="assets/optimized/${variant.stem}.avif"><source type="image/webp" srcset="assets/optimized/${variant.stem}.webp"><img class="px" src="${source}" alt="" width="${data.width}" height="${data.height}" loading="lazy" decoding="async"></picture>`;
  }
  window.Site = { t, motionAllowed, picture };
  updateMotion();
})();
