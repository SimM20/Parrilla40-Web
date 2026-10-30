(function () {
  'use strict';
  const { questions, getClient, element } = window.Playtest;
  const english = document.documentElement.lang === 'en';
  const locale = english ? 'en-US' : 'es-AR';
  const copy = {
    responses: ['Respuestas', 'Responses'], continue: ['Declaran ganas de jugar otra noche', 'Say they want to play another night'],
    retry: ['Declaran ganas de reintentar para mejorar', 'Say they want to try again to improve'],
    empty: ['Todavía no hay respuestas para mostrar.', 'There are no responses to show yet.'],
    noResponses: ['Sin respuestas', 'No responses'], allBuilds: ['Todas las builds', 'All builds'],
    unlock: ['Ver resultados', 'View results'], loading: ['Consultando…', 'Loading…'],
    validating: ['Validando el acceso y cargando las respuestas.', 'Validating access and loading responses.'],
    invalidPassword: ['Ingresá una contraseña válida (hasta 72 bytes).', 'Enter a valid password (up to 72 bytes).'],
    denied: ['No se pudo validar la contraseña. Volvé a intentar.', 'The password could not be validated. Try again.'],
    loadError: ['No pudimos cargar los resultados. Revisá tu conexión y volvé a intentar.', 'We could not load the results. Check your connection and try again.'],
    current: ['Resultados · encuesta de 3 preguntas', 'Results · 3-question survey'],
    historical: ['Resultados · cuestionario histórico', 'Results · historical questionnaire'],
    caution: ['Son señales descriptivas de una muestra voluntaria, no una escala validada de diversión. El tiempo percibido no demuestra disfrute y las ganas declaradas no son retención observada. Las categorías de motivación se presentan por separado.', 'These are descriptive signals from a voluntary sample, not a validated enjoyment scale. Perceived time does not demonstrate enjoyment, and stated motivation is not observed retention. Motivation categories are reported separately.'],
    buildCaution: ['Cada build puede tener participantes y condiciones diferentes. Considerá el tamaño y la composición de la muestra; diferencias pequeñas no prueban un cambio real. El filtro permite consultar las distribuciones y los textos de cada build.', 'Each build may have different participants and conditions. Consider sample size and composition; small differences do not establish a real change. Use the filter to inspect each build’s distributions and comments.'],
    compare: ['Comparación descriptiva por build', 'Descriptive comparison by build'],
    build: ['Build del juego', 'Game build'], sample: ['Respuestas (n)', 'Responses (n)'],
    timeCounts: ['Percepción del tiempo · recuentos 1 / 2 / 3 / 4 / 5', 'Perceived time · counts 1 / 2 / 3 / 4 / 5'],
    words: ['Momentos que recuerdan', 'Memorable moments'],
    optional: ['Respuestas abiertas opcionales', 'Optional open responses'],
    noText: ['No se dejaron respuestas abiertas en esta selección.', 'No open responses were left in this selection.'],
    historicalNote: ['Datos del cuestionario anterior, conservados aparte. Sus preguntas y métricas no son comparables directamente con las tres preguntas actuales.', 'Data from the previous questionnaire, kept separately. Its questions and metrics are not directly comparable with the current three-question survey.'],
    highest: ['Noche más alta · promedio', 'Highest night · average'],
    night1: ['Completaron Noche 1 · sobre todas las respuestas', 'Completed Night 1 · all responses'],
    night2: ['Completaron Noche 2 · sobre todas las respuestas', 'Completed Night 2 · all responses'],
    reached2: ['Completaron Noche 2 · entre quienes la jugaron', 'Completed Night 2 · players who reached it'],
    ratings: ['Experiencia histórica · promedios de 1 a 5', 'Historical experience · averages from 1 to 5'],
    historicalWords: ['Respuestas abiertas históricas', 'Historical open responses']
  };
  const label = key => copy[key][english ? 1 : 0];
  const t = window.Site?.t || (text => text);
  const gate = document.querySelector('#gate'), password = document.querySelector('#admin-password');
  const status = document.querySelector('#gate-status'), unlock = document.querySelector('#unlock');
  const dashboard = document.querySelector('#dashboard'), content = document.querySelector('#results-content');
  const filter = document.querySelector('#build-filter'), source = document.querySelector('#results-source');
  let rows = [], loading = false, generation = 0, currentSource = 'current', controller;
  const number = value => value.toLocaleString(locale, { maximumFractionDigits: 1 });
  const percent = (count, total) => total ? `${number(count / total * 100)}% (${count}/${total})` : label('noResponses');
  const mean = (data, key) => data.length ? number(data.reduce((sum, row) => sum + row[key], 0) / data.length) : '—';
  const fieldLabel = q => currentSource === 'historical' ? (english ? q.en : q.label) : t(q.label);
  const fieldOptions = q => q.options.map(([value, es, en]) => [value, currentSource === 'historical' ? (english ? en : es) : t(es)]);

  function section(title) {
    const node = element('section', undefined, 'results-section');
    node.append(element('h3', title));
    content.append(node);
    return node;
  }
  function metrics(values) {
    const grid = element('div', undefined, 'metrics');
    values.forEach(([text, value]) => {
      const metric = element('dl', undefined, 'metric');
      metric.append(element('dt', text), element('dd', value));
      grid.append(metric);
    });
    content.append(grid);
  }
  function distribution(data, q) {
    const group = section(fieldLabel(q));
    const list = element('ul', undefined, 'distribution');
    fieldOptions(q).forEach(([value, text]) => {
      const count = data.filter(row => String(row[q.name]) === String(value)).length;
      const item = element('li'), bar = element('progress');
      bar.max = Math.max(1, data.length); bar.value = count;
      bar.setAttribute('aria-label', `${text}: ${percent(count, data.length)}`);
      item.append(element('span', `${text}: ${percent(count, data.length)}`), bar);
      list.append(item);
    });
    group.append(list);
  }
  function qualitative(data, fields, title) {
    const group = section(label(title));
    const supplied = data.filter(row => fields.some(q => String(row[q.name] || '').trim()));
    if (currentSource === 'current') group.append(element('p', `${label('optional')}: ${supplied.length}/${data.length}.`));
    if (!supplied.length) group.append(element('p', label('noText')));
    supplied.forEach(row => {
      const article = element('article', undefined, 'response');
      article.append(element('h4', `Build: ${row.build_version} · ${new Date(row.created_at).toLocaleString(locale)}`));
      fields.forEach(q => {
        if (row[q.name]) article.append(element('strong', fieldLabel(q)), element('p', row[q.name]));
      });
      group.append(article);
    });
  }
  function compareBuilds() {
    const builds = [...new Set(rows.map(row => row.build_version))].sort();
    if (builds.length < 2) return;
    const group = section(label('compare'));
    group.append(element('p', label('buildCaution')));
    const wrapper = element('div', undefined, 'table-scroll');
    wrapper.tabIndex = 0;
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-label', label('compare'));
    const table = element('table', undefined, 'build-comparison');
    table.append(element('caption', label('compare')));
    const head = element('thead'), header = element('tr');
    ['build', 'sample', 'continue', 'retry', 'timeCounts'].forEach(key => {
      const cell = element('th', label(key)); cell.scope = 'col'; header.append(cell);
    });
    head.append(header); table.append(head);
    const body = element('tbody');
    builds.forEach(build => {
      const data = rows.filter(row => row.build_version === build), row = element('tr');
      const name = element('th', build); name.scope = 'row'; row.append(name);
      const values = [String(data.length), percent(data.filter(r => r.post_session_feeling === 'another_night').length, data.length),
        percent(data.filter(r => r.post_session_feeling === 'retry_better').length, data.length),
        [1, 2, 3, 4, 5].map(value => data.filter(r => r.perceived_time_flow === value).length).join(' / ')];
      values.forEach(value => row.append(element('td', value))); body.append(row);
    });
    table.append(body); wrapper.append(table); group.append(wrapper);
  }
  function render() {
    content.replaceChildren();
    const data = filter.value === '' ? rows : rows.filter(row => row.build_version === filter.value);
    document.querySelector('#results-heading').textContent = label(currentSource === 'historical' ? 'historical' : 'current');
    if (currentSource === 'historical') {
      renderHistorical(data);
      return;
    }
    content.append(element('p', label('caution'), 'playtest-panel'));
    metrics([[label('responses'), String(data.length)],
      [label('continue'), percent(data.filter(row => row.post_session_feeling === 'another_night').length, data.length)],
      [label('retry'), percent(data.filter(row => row.post_session_feeling === 'retry_better').length, data.length)]]);
    if (data.length) {
      questions.filter(q => q.options).forEach(q => distribution(data, q));
      qualitative(data, questions.filter(q => q.type === 'text'), 'words');
    } else content.append(element('p', label('empty'), 'playtest-panel'));
    compareBuilds();
  }
  function renderHistorical(data) {
    content.append(element('p', label('historicalNote'), 'playtest-panel'));
    const reached = data.filter(row => row.completed_night_2 !== 'not_reached');
    const completed2 = data.filter(row => row.completed_night_2 === 'yes').length;
    metrics([[label('responses'), String(data.length)], [label('highest'), mean(data, 'highest_night')],
      [label('night1'), percent(data.filter(row => row.completed_night_1).length, data.length)],
      [label('night2'), percent(completed2, data.length)], [label('reached2'), percent(completed2, reached.length)]]);
    if (!data.length) { content.append(element('p', label('empty'))); return; }
    const list = element('dl', undefined, 'rating-summary');
    window.PlaytestLegacy.filter(q => q.type === 'rating').forEach(q => {
      list.append(element('dt', fieldLabel(q)), element('dd', `${mean(data, q.name)} / 5`));
    });
    section(label('ratings')).append(list);
    window.PlaytestLegacy.filter(q => ['customer_pacing', 'stress_experience', 'want_to_continue'].includes(q.name))
      .forEach(q => distribution(data, q));
    qualitative(data, window.PlaytestLegacy.filter(q => q.type === 'text'), 'historicalWords');
  }
  function validRow(row) {
    if (!row || typeof row.build_version !== 'string' || !row.build_version.trim() || row.build_version.length > 100 ||
        typeof row.created_at !== 'string' || !Number.isFinite(Date.parse(row.created_at))) return false;
    if (currentSource === 'current') {
      return Number.isInteger(row.perceived_time_flow) && row.perceived_time_flow >= 1 && row.perceived_time_flow <= 5 &&
        questions.find(q => q.name === 'post_session_feeling').options.some(([value]) => row.post_session_feeling === value) &&
        (row.memorable_moment === null || typeof row.memorable_moment === 'string' && [...row.memorable_moment].length <= 1200);
    }
    return window.PlaytestLegacy.every(q => {
      const value = row[q.name];
      if (q.options) return q.options.some(([option]) => value === option);
      if (q.type === 'rating') return Number.isInteger(value) && value >= 1 && value <= 5;
      if (q.type === 'number') return Number.isInteger(value) && value >= 0 && value <= 2147483647;
      if (q.type === 'boolean') return typeof value === 'boolean';
      return typeof value === 'string' && value.trim() && [...value].length <= 4000;
    });
  }
  function clearResults() {
    generation++;
    controller?.abort(); controller = undefined;
    rows = [];
    content.replaceChildren(); filter.replaceChildren();
    dashboard.hidden = true; gate.hidden = false;
    password.value = ''; password.setAttribute('aria-invalid', 'false');
    loading = false; unlock.disabled = false; source.disabled = false;
    unlock.textContent = label('unlock'); gate.setAttribute('aria-busy', 'false'); status.textContent = '';
  }
  unlock.disabled = false;
  filter.addEventListener('change', render);
  source.addEventListener('change', clearResults);
  document.querySelector('#lock').addEventListener('click', () => { clearResults(); password.focus(); });
  // Private data and passwords are never restored from the back/forward cache.
  window.addEventListener('pagehide', clearResults);
  window.addEventListener('pageshow', event => { if (event.persisted) clearResults(); });
  gate.addEventListener('submit', async event => {
    event.preventDefault();
    if (loading) return;
    if (!password.value || new TextEncoder().encode(password.value).length > 72) {
      status.textContent = label('invalidPassword'); password.setAttribute('aria-invalid', 'true'); password.focus(); return;
    }
    const requestGeneration = ++generation;
    currentSource = source.value === 'historical' ? 'historical' : 'current';
    loading = true; unlock.disabled = true; source.disabled = true;
    unlock.textContent = label('loading'); gate.setAttribute('aria-busy', 'true');
    password.setAttribute('aria-invalid', 'false'); status.textContent = label('validating');
    controller = new AbortController();
    const requestController = controller;
    const timeout = setTimeout(() => requestController.abort(), 20000);
    try {
      const request = getClient().rpc(currentSource === 'historical' ? 'playtest_results' : 'playtest_results_v2', { admin_password: password.value })
        .abortSignal(requestController.signal);
      password.value = '';
      const { data, error } = await request;
      if (requestGeneration !== generation) return;
      if (error) throw error;
      if (!Array.isArray(data) || !data.every(validRow)) throw new Error('Unexpected results payload');
      rows = data;
      const builds = [...new Set(rows.map(row => row.build_version))].sort();
      filter.replaceChildren(new Option(label('allBuilds'), ''));
      builds.forEach(build => filter.add(new Option(build, build)));
      document.querySelector('#build-filter-label').hidden = builds.length < 2;
      render(); gate.hidden = true; dashboard.hidden = false;
      document.querySelector('#results-heading').focus();
    } catch (error) {
      if (requestGeneration !== generation) return;
      rows = []; content.replaceChildren(); filter.replaceChildren(); dashboard.hidden = true;
      status.textContent = label(error.code === 'P0001' ? 'denied' : 'loadError'); password.focus();
    } finally {
      clearTimeout(timeout);
      if (requestGeneration === generation) {
        controller = undefined; password.value = ''; loading = false;
        unlock.disabled = false; source.disabled = false; unlock.textContent = label('unlock'); gate.setAttribute('aria-busy', 'false');
      }
    }
  });
})();
