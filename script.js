/* ══════════════════════════════════════════════
   PARRILLA 40 — interacciones de la landing
   ══════════════════════════════════════════════ */
(function () {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp  = (a, b, t) => a + (b - a) * t;

  /* ── NAV: fondo al bajar + link activo ─────────────────── */
  const nav = $('#nav');
  const sections = $$('section[id]');
  const navLinks = $$('.nav__links a');

  function onScroll() {
    nav.classList.toggle('is-stuck', window.scrollY > 40);

    const y = window.scrollY + 140;
    let current = '';
    for (const s of sections) {
      if (s.offsetTop <= y) current = s.id;
    }
    navLinks.forEach(a => a.classList.toggle('is-active', a.hash === '#' + current));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── HERO: parallax de capas ───────────────────────────── */
  const layers = $$('.hero__layer[data-depth]');
  const hero = $('.hero');
  let ticking = false;

  function parallax() {
    ticking = false;
    const y = window.scrollY;
    if (y > window.innerHeight * 1.2) return;
    // El desplazamiento va por variable, no por transform inline: las nubes
    // tienen su propia animación sobre transform y una animación le gana a un
    // estilo inline, así que es el CSS el que compone las dos cosas.
    for (const l of layers) {
      l.style.setProperty('--py', (y * parseFloat(l.dataset.depth)) + 'px');
    }
    const content = $('.hero__content');
    if (content) {
      content.style.transform = `translateY(${y * 0.22}px)`;
      content.style.opacity = String(clamp(1 - y / (window.innerHeight * 0.75), 0, 1));
    }
  }
  if (!reduced && hero) {
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(parallax); }
    }, { passive: true });
  }

  /* ── REVEAL al entrar en viewport ──────────────────────── */
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    }
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

  $$('.reveal').forEach(el => io.observe(el));

  /* ── CONTADORES del hero ───────────────────────────────── */
  const counters = $$('[data-count]');
  const cio = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target;
      cio.unobserve(el);
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const dec = String(target).includes('.') ? 1 : 0;
      if (reduced) { el.textContent = target.toFixed(dec) + suffix; continue; }
      const dur = 1100, t0 = performance.now();
      const step = (t) => {
        const p = clamp((t - t0) / dur, 0, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(dec) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }, { threshold: 0.6 });
  counters.forEach(el => cio.observe(el));

  /* ── MARQUEE: se construye con los sprites del juego ───── */
  const MARQUEE = [
    ['assets/cortes/vacio-hecho.png',      'Vacío'],
    ['assets/extras/carbon-prendido.png',  'Carbón'],
    ['assets/cortes/tira-jugoso.png',      'Tira de asado'],
    ['assets/extras/chimi.png',            'Chimichurri'],
    ['assets/cortes/chorizo-hecho.png',    'Chorizo'],
    ['assets/extras/papas.png',            'Fritas'],
    ['assets/cortes/choripan-hecho.png',   'Choripán'],
    ['assets/ui/moneda.png',               'Propina'],
    ['assets/cortes/paty-hecho.png',       'Paty'],
    ['assets/extras/criolla.png',          'Salsa criolla'],
    ['assets/extras/pan-flauta.png',       'Pan flauta'],
    ['assets/ui/radio.png',                'Radio']
  ];
  const track = $('#marqueeTrack');
  if (track) {
    const build = () => MARQUEE.map(([src, txt]) =>
      `<div class="marquee__item"><img class="px" src="${src}" alt=""><span>${txt}</span></div>`
    ).join('');
    track.innerHTML = build() + build();   // duplicado para el loop infinito
  }

  /* ── COCINERO: punto de cocción interactivo ────────────── */
  const STATES = [
    { name: 'Crudo',      file: 'crudo',    color: '#e0483a', fill: '#b23a2c', heat: .10, verdict: 'No lo entregues — strike', cls: 'is-bad'  },
    { name: 'Jugoso',     file: 'jugoso',   color: '#ff8a3d', fill: '#ff7a18', heat: .28, verdict: 'Se paga · propina completa', cls: 'is-good' },
    { name: 'Hecho',      file: 'hecho',    color: '#ffc043', fill: '#ffa726', heat: .48, verdict: 'Se paga · propina completa', cls: 'is-good' },
    { name: 'Bien Hecho', file: 'muyhecho', color: '#e4a13a', fill: '#d98c25', heat: .66, verdict: 'Se paga · propina completa', cls: 'is-good' },
    { name: 'Pasado',     file: 'pasado',   color: '#b0763a', fill: '#8a5a2b', heat: .82, verdict: 'Último punto válido', cls: ''       },
    { name: 'Quemado',    file: 'pasado',   color: '#7a6a62', fill: '#3d3330', heat: 1,   verdict: 'Se va sin pagar — strike', cls: 'is-bad'  }
  ];

  const meatImg  = $('#cookMeat');
  const stateEl  = $('#cookState');
  const verdEl   = $('#cookVerdict');
  const fillEl   = $('#cookFill');
  const heatEl   = $('#cookHeat');
  const rangeEl  = $('#cookRange');
  const labelBtns = $$('#cookLabels button');
  const cutBtns   = $$('#cutRow button');
  let currentCut = 'vacio';

  function renderCook(i) {
    const s = STATES[i];
    meatImg.src = `assets/cortes/${currentCut}-${s.file}.png`;
    // "Quemado" no tiene sprite propio: se oscurece el de "Pasado".
    meatImg.style.filter = (i === 5)
      ? 'drop-shadow(0 10px 16px rgba(0,0,0,.7)) brightness(.34) saturate(.35) contrast(1.15)'
      : 'drop-shadow(0 10px 16px rgba(0,0,0,.7))';

    stateEl.textContent = s.name;
    stateEl.style.setProperty('--state', s.color);
    verdEl.textContent = s.verdict;
    verdEl.className = 'cooker__verdict ' + s.cls;

    fillEl.style.width = ((i + 1) / 6 * 100) + '%';
    fillEl.style.setProperty('--fill', s.fill);
    heatEl.style.setProperty('--heat', String(s.heat));

    labelBtns.forEach(b => b.classList.toggle('is-on', +b.dataset.i === i));
  }

  if (rangeEl) {
    rangeEl.addEventListener('input', () => renderCook(+rangeEl.value));
    labelBtns.forEach(b => b.addEventListener('click', () => {
      rangeEl.value = b.dataset.i;
      renderCook(+b.dataset.i);
    }));
    cutBtns.forEach(b => b.addEventListener('click', () => {
      currentCut = b.dataset.cut;
      cutBtns.forEach(o => o.classList.toggle('is-on', o === b));
      renderCook(+rangeEl.value);
    }));
    renderCook(0);

    // Demo automática la primera vez que la sección entra en pantalla.
    const cooker = $('.cooker');
    const dio = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting || reduced) continue;
        dio.disconnect();
        let i = 0;
        const t = setInterval(() => {
          i++;
          if (i > 2) { clearInterval(t); return; }
          rangeEl.value = i;
          renderCook(i);
        }, 700);
        // Si el usuario toca algo, se corta la demo.
        cooker.addEventListener('pointerdown', () => clearInterval(t), { once: true });
      }
    }, { threshold: 0.45 });
    dio.observe(cooker);
  }

  /* ── RELOJ DE JORNADA: ciclo de día animado ────────────── */
  const OPEN = 6.5, CLOSE = 21, LOOP_MS = 16000;

  // Claves horarias del cielo (aproximan el DayCycleBackground del juego).
  const SKY = [
    { h: 6.5,  top: '#2c2a52', bot: '#e8804a' },  // amanecer
    { h: 9,    top: '#3f6f9e', bot: '#9fc9e8' },
    { h: 13,   top: '#2f7fc4', bot: '#bcdcf2' },  // mediodía
    { h: 17.5, top: '#3a6f9c', bot: '#f0b071' },
    { h: 19.5, top: '#2a2f5e', bot: '#e9683f' },  // atardecer
    { h: 21,   top: '#10132e', bot: '#2a2a4e' }   // noche
  ];
  const PHASES = [
    { h: 6.5,  txt: 'Abrimos' },
    { h: 9,    txt: 'Primeros clientes' },
    { h: 12,   txt: 'Hora pico' },
    { h: 15,   txt: 'Baja el ritmo' },
    { h: 18,   txt: 'Última tanda' },
    { h: 20.5, txt: 'Por cerrar' }
  ];

  const hex2rgb = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => {
    const A = hex2rgb(a), B = hex2rgb(b);
    return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',')})`;
  };
  function skyAt(h) {
    for (let i = 0; i < SKY.length - 1; i++) {
      const a = SKY[i], b = SKY[i + 1];
      if (h >= a.h && h <= b.h) {
        const t = (h - a.h) / (b.h - a.h);
        return [mix(a.top, b.top, t), mix(a.bot, b.bot, t)];
      }
    }
    const l = SKY[SKY.length - 1];
    return [l.top, l.bot];
  }
  function phaseAt(h) {
    let txt = PHASES[0].txt;
    for (const p of PHASES) if (h >= p.h) txt = p.txt;
    return txt;
  }
  const fmt = (h) => {
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60 / 5) * 5;
    const carry = mm === 60;
    return String(hh + (carry ? 1 : 0)).padStart(2, '0') + ':' + String(carry ? 0 : mm).padStart(2, '0');
  };

  const cSky = $('#clockSky'), cSun = $('#clockSun'), cMoon = $('#clockMoon'),
        cStars = $('#clockStars'), cHour = $('#clockHour'), cPhase = $('#clockPhase'),
        cProg = $('#clockProgress'), cBtn = $('#clockBtn');

  if (cSky) {
    let t0 = performance.now(), paused = false, pausedAt = 0, raf = 0;

    function drawClock(p) {                       // p: 0..1 de la jornada
      const h = lerp(OPEN, CLOSE, p);
      const [top, bot] = skyAt(h);
      cSky.style.background = `linear-gradient(180deg,${top},${bot})`;

      const W = cSky.clientWidth, H = cSky.clientHeight;
      // Arco del sol: sale por la izquierda, se pone por la derecha.
      const ang = Math.PI * p;
      const x = lerp(0.06, 0.94, p) * W;
      const y = H * 0.72 - Math.sin(ang) * H * 0.56;
      cSun.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`;
      // La luna va en el arco opuesto.
      const my = H * 0.72 - Math.sin(ang + Math.PI) * H * 0.5;
      cMoon.style.transform = `translate(${(1 - lerp(0.06, 0.94, p)) * W}px,${my}px) translate(-50%,-50%)`;

      const night = clamp((h - 18.2) / 2.4, 0, 1) + clamp((7.6 - h) / 1.1, 0, 1);
      cStars.style.opacity = String(clamp(night, 0, .85));
      cSun.style.opacity  = String(clamp(1 - night * 1.25, 0, 1));
      cMoon.style.opacity = String(clamp(night * 1.1, 0, 1));

      cHour.textContent = p >= 1 ? 'CERRADO' : fmt(h);
      cPhase.textContent = p >= 1 ? 'Se va el último cliente' : phaseAt(h);
      cProg.style.width = (p * 100) + '%';
    }

    // El timestamp del primer rAF puede ser anterior a t0. Sin el max(0) el
    // módulo da negativo y el primer cuadro arranca mostrando "CERRADO".
    const progress = (now) => (Math.max(0, now - t0) % LOOP_MS) / LOOP_MS;

    function tick(now) {
      if (!paused) drawClock(progress(now));
      raf = requestAnimationFrame(tick);
    }

    if (reduced) {
      drawClock(0.42);
      cBtn.style.display = 'none';
    } else {
      raf = requestAnimationFrame(tick);
      cBtn.addEventListener('click', () => {
        paused = !paused;
        if (paused) { pausedAt = performance.now(); }
        else { t0 += performance.now() - pausedAt; }
        cBtn.textContent = paused ? 'Seguir el día' : 'Pausar el día';
        cBtn.setAttribute('aria-pressed', String(!paused));
      });
      // No gastar frames si la sección no se ve. Al volver, se corre t0 para
      // que el día siga donde había quedado en vez de pegar un salto.
      let hiddenAt = 0;
      new IntersectionObserver((es) => {
        for (const e of es) {
          if (e.isIntersecting && !raf) {
            if (hiddenAt) { t0 += performance.now() - hiddenAt; hiddenAt = 0; }
            raf = requestAnimationFrame(tick);
          } else if (!e.isIntersecting && raf) {
            cancelAnimationFrame(raf); raf = 0; hiddenAt = performance.now();
          }
        }
      }, { threshold: 0.05 }).observe(cSky);
      window.addEventListener('resize', () => drawClock(progress(performance.now())));
    }
  }

  /* ── FORM de la lista ──────────────────────────────────── */
  const form = $('#signup'), mail = $('#signupMail'), note = $('#signupNote');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = mail.value.trim();
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      note.className = 'signup__note' + (ok ? '' : ' is-err');
      note.textContent = ok
        ? '¡Listo! Te avisamos cuando abra la parrilla. (Demo: todavía no hay backend conectado.)'
        : 'Ese mail no parece válido — fijate de nuevo.';
      if (ok) form.reset();
    });
  }
})();
