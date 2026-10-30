(function () {
  'use strict';
  const { questions, validate, getClient } = window.Playtest;
  const t = window.Site.t;
  const form = document.querySelector('#survey'), status = document.querySelector('#survey-status');
  const submit = document.querySelector('#submit-survey');
  let sending = false, pending, session;
  const build = String(window.PLAYTEST_CONFIG?.buildVersion || '').trim();
  const storageKey = 'parrilla40-playtest-v2:' + build;
  try { session = JSON.parse(sessionStorage.getItem(storageKey)); } catch { /* Use page memory if storage is unavailable. */ }
  if (!session || !/^[a-f0-9-]{36}$/.test(session.id)) session = { id: crypto.randomUUID(), sent: false };
  if (session.pending) {
    const restored = validate(session.pending);
    if (!Object.keys(restored.errors).length) {
      pending = restored;
      for (const [name, value] of Object.entries(restored.answers)) {
        const input = form.querySelector(`[name="${name}"]${name === 'memorable_moment' ? '' : `[value="${value}"]`}`);
        if (input?.type === 'radio') input.checked = true;
        else if (input) input.value = value || '';
      }
      form.querySelectorAll('fieldset').forEach(group => { group.disabled = true; });
      status.textContent = t('Tu envío quedó pendiente. Volvé a intentar.');
      document.querySelector('#text-count').textContent = `${[...(restored.answers.memorable_moment || '')].length} / 1200`;
    }
  }
  function remember() {
    try { sessionStorage.setItem(storageKey, JSON.stringify(session)); } catch { /* Idempotent retries still work in this page. */ }
  }
  function success(focus = true) {
    form.hidden = true;
    document.querySelector('#success').hidden = false;
    if (focus) document.querySelector('#thanks').focus();
  }
  if (session.sent) success(false);
  submit.disabled = false;
  function fieldError(name, error) {
    document.querySelector('#error-' + name).textContent = error || '';
    document.querySelector('#question-' + name).classList.toggle('has-error', Boolean(error));
    form.querySelectorAll(`[name="${name}"]`).forEach(input => input.setAttribute('aria-invalid', String(Boolean(error))));
  }
  form.addEventListener('input', event => {
    const { errors } = validate(Object.fromEntries(new FormData(form)));
    if (event.target.getAttribute('aria-invalid') === 'true') fieldError(event.target.name, errors[event.target.name]);
    if (event.target.name === 'memorable_moment') document.querySelector('#text-count').textContent = `${[...event.target.value].length} / 1200`;
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || session.sent) return;
    const result = pending || validate(Object.fromEntries(new FormData(form)));
    questions.forEach(q => fieldError(q.name, result.errors[q.name]));
    if (Object.keys(result.errors).length) {
      status.textContent = t('Revisá las preguntas marcadas.');
      form.querySelector('[aria-invalid="true"]').focus();
      return;
    }
    sending = true;
    submit.disabled = true;
    submit.textContent = t('Enviando…');
    form.setAttribute('aria-busy', 'true');
    status.textContent = t('Enviando…');
    // Keep exactly the same snapshot after an uncertain response, so a retry cannot create a second row.
    pending = result;
    session.pending = result.answers;
    remember();
    form.querySelectorAll('fieldset').forEach(group => { group.disabled = true; });
    try {
      if (!build || build.length > 100) throw new Error('Invalid build');
      const { error } = await getClient().rpc('submit_playtest_v2', {
        p_session_id: session.id, p_build_version: build,
        p_perceived_time_flow: result.answers.perceived_time_flow,
        p_post_session_feeling: result.answers.post_session_feeling,
        p_memorable_moment: result.answers.memorable_moment
      }).abortSignal(AbortSignal.timeout(20000));
      if (error) throw error;
      session.sent = true;
      delete session.pending;
      remember();
      success();
    } catch {
      status.textContent = t('No pudimos confirmar el envío. Volvé a intentar.');
    } finally {
      sending = false;
      submit.disabled = session.sent;
      submit.textContent = t(session.sent ? 'Enviado' : 'Reintentar envío');
      form.setAttribute('aria-busy', 'false');
    }
  });
})();
