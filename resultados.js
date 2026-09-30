(function () {
  'use strict';
  const { questions, getClient, element } = window.Playtest;
  const gate = document.querySelector('#gate');
  const password = document.querySelector('#admin-password');
  const status = document.querySelector('#gate-status');
  const unlock = document.querySelector('#unlock');
  const dashboard = document.querySelector('#dashboard');
  const content = document.querySelector('#results-content');
  const filter = document.querySelector('#build-filter');
  let rows = [], loading = false, generation = 0;
  const number = value => value.toLocaleString('es-AR', { maximumFractionDigits: 1 });
  const percent = (count, total) => total ? `${number(count / total * 100)}% (${count}/${total})` : 'Sin respuestas';
  const mean = (data, key) => data.length ? number(data.reduce((sum, row) => sum + row[key], 0) / data.length) : '—';

  function section(title) {
    const node = element('section', undefined, 'results-section');
    node.append(element('h2', title));
    content.append(node);
    return node;
  }
  function render() {
    content.replaceChildren();
    const data = filter.value === '' ? rows : rows.filter(row => row.build_version === filter.value);
    const reached = data.filter(row => row.completed_night_2 !== 'not_reached');
    const completed2 = data.filter(row => row.completed_night_2 === 'yes').length;
    const metrics = element('div', undefined, 'metrics');
    const values = [
      ['Respuestas', String(data.length)],
      ['Noche más alta · promedio', mean(data, 'highest_night')],
      ['Completaron Noche 1 · sobre todas las respuestas', percent(data.filter(row => row.completed_night_1).length, data.length)],
      ['Completaron Noche 2 · sobre todas las respuestas', percent(completed2, data.length)],
      ['Completaron Noche 2 · entre quienes la jugaron', percent(completed2, reached.length)]
    ];
    values.forEach(([label, value]) => {
      const metric = element('dl', undefined, 'metric');
      metric.append(element('dt', label), element('dd', value));
      metrics.append(metric);
    });
    content.append(metrics);
    if (!data.length) {
      content.append(element('p', 'Todavía no hay respuestas para mostrar.', 'playtest-panel'));
      return;
    }
    const ratings = section('Experiencia · promedios de 1 a 5');
    const list = element('dl', undefined, 'rating-summary');
    questions.filter(q => q.type === 'rating').forEach(q => {
      list.append(element('dt', q.label), element('dd', `${mean(data, q.name)} / 5`));
    });
    ratings.append(list);
    ['customer_pacing', 'stress_experience', 'want_to_continue'].forEach(name => {
      const q = questions.find(item => item.name === name);
      const group = section(q.label);
      const distribution = element('ul', undefined, 'distribution');
      q.options.forEach(([value, label]) => {
        const count = data.filter(row => row[name] === value).length;
        const item = element('li');
        const bar = element('progress');
        bar.max = data.length; bar.value = count;
        bar.setAttribute('aria-label', label);
        item.append(element('span', `${label}: ${percent(count, data.length)}`), bar);
        distribution.append(item);
      });
      group.append(distribution);
    });
    const qualitative = section('En palabras de quienes jugaron');
    data.forEach(row => {
      const article = element('article', undefined, 'response');
      article.append(element('h3', `Build: ${row.build_version} · ${new Date(row.created_at).toLocaleString('es-AR')}`));
      questions.filter(q => q.type === 'text').forEach(q => {
        article.append(element('strong', q.label), element('p', row[q.name]));
      });
      qualitative.append(article);
    });
  }
  function clearResults() {
    generation++;
    rows = [];
    content.replaceChildren();
    filter.replaceChildren();
    dashboard.hidden = true;
    gate.hidden = false;
    password.value = '';
    loading = false;
    unlock.disabled = false;
    unlock.textContent = 'Ver resultados';
    gate.setAttribute('aria-busy', 'false');
    status.textContent = '';
  }
  unlock.disabled = false;
  filter.addEventListener('change', render);
  document.querySelector('#lock').addEventListener('click', () => { clearResults(); password.focus(); });
  // Do not restore private results or the password from the back/forward cache.
  window.addEventListener('pagehide', clearResults);
  window.addEventListener('pageshow', event => { if (event.persisted) clearResults(); });
  gate.addEventListener('submit', async event => {
    event.preventDefault();
    if (loading) return;
    if (!password.value || new TextEncoder().encode(password.value).length > 72) {
      status.textContent = 'Ingresá una contraseña válida (hasta 72 bytes).';
      password.setAttribute('aria-invalid', 'true');
      password.focus();
      return;
    }
    const requestGeneration = ++generation;
    loading = true;
    unlock.disabled = true;
    unlock.textContent = 'Consultando…';
    gate.setAttribute('aria-busy', 'true');
    password.setAttribute('aria-invalid', 'false');
    status.textContent = 'Validando el acceso y cargando las respuestas.';
    try {
      const request = getClient().rpc('playtest_results', { admin_password: password.value })
        .abortSignal(AbortSignal.timeout(20000));
      password.value = '';
      const { data, error } = await request;
      if (requestGeneration !== generation) return;
      if (error) throw error;
      if (!Array.isArray(data) || data.some(row => !row || !row.build_version ||
          !Number.isFinite(Date.parse(row.created_at)) || Object.keys(validateRow(row)).length)) {
        throw new Error('Unexpected results payload');
      }
      rows = data;
      const builds = [...new Set(rows.map(row => row.build_version))].sort();
      filter.replaceChildren(new Option('Todas las builds', ''));
      builds.forEach(build => filter.add(new Option(build, build)));
      document.querySelector('#build-filter-label').hidden = builds.length < 2;
      render();
      gate.hidden = true;
      dashboard.hidden = false;
      document.querySelector('#results-heading').focus();
    } catch (error) {
      if (requestGeneration !== generation) return;
      rows = [];
      content.replaceChildren();
      dashboard.hidden = true;
      status.textContent = error.code === 'P0001'
        ? 'No se pudo validar la contraseña. Volvé a intentar.'
        : 'No pudimos cargar los resultados. Revisá tu conexión y volvé a intentar.';
      password.focus();
    } finally {
      if (requestGeneration === generation) {
        password.value = '';
        loading = false;
        unlock.disabled = false;
        unlock.textContent = 'Ver resultados';
        gate.setAttribute('aria-busy', 'false');
      }
    }
  });
  function validateRow(row) { return window.Playtest.validate(row).errors; }
})();
