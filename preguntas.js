(function () {
  'use strict';
  const { questions, validate, getClient } = window.Playtest;
  const form = document.querySelector('#survey');
  const status = document.querySelector('#survey-status');
  const submit = document.querySelector('#submit-survey');
  const progress = document.querySelector('#survey-progress');
  const progressCount = document.querySelector('#progress-count');
  let sending = false, submitted = false, sessionId;
  const t = window.Site?.t || (text => text);
  submit.disabled = false;

  function updateProgress(errors) {
    const count = questions.length - Object.keys(errors).length;
    if (progress.value !== count) {
      progress.value = count;
      progressCount.textContent = t('{count} de 15 respondidas', { count });
    }
    document.querySelector('#completion-note').textContent = count === 15
      ? t('Todo listo. Podés revisar tus respuestas antes de enviarlas.')
      : count === 14 ? t('Te falta 1 respuesta para terminar.') : t('Te faltan {count} respuestas para terminar.', { count: 15 - count });
    questions.forEach(q => {
      document.querySelector(`#question-${q.name}`).classList.toggle('is-complete', !errors[q.name]);
    });
  }

  function showFieldError(name, error) {
    document.querySelector(`#error-${name}`).textContent = error || '';
    document.querySelector(`#question-${name}`).classList.toggle('has-error', Boolean(error));
    form.querySelectorAll(`[name="${name}"]`).forEach(input => input.setAttribute('aria-invalid', String(Boolean(error))));
  }

  function showErrors(errors) {
    questions.forEach(q => showFieldError(q.name, errors[q.name]));
  }
  form.addEventListener('input', event => {
    const name = event.target.name;
    if (!name) return;
    const { errors } = validate(Object.fromEntries(new FormData(form)));
    if (event.target.getAttribute('aria-invalid') === 'true') showFieldError(name, errors[name]);
    const count = document.querySelector(`#count-${name}`);
    if (count) count.textContent = `${event.target.value.length} / 4000`;
    updateProgress(errors);
  });
  form.addEventListener('focusout', event => {
    if (!event.target.name || sending || submitted) return;
    const { errors } = validate(Object.fromEntries(new FormData(form)));
    showFieldError(event.target.name, errors[event.target.name]);
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || submitted) return;
    const { answers, errors } = validate(Object.fromEntries(new FormData(form)));
    showErrors(errors);
    updateProgress(errors);
    if (Object.keys(errors).length) {
      status.textContent = t('Revisá las preguntas marcadas. Tus respuestas siguen acá.');
      form.querySelector('[aria-invalid="true"]').focus();
      return;
    }
    sending = true;
    submit.disabled = true;
    submit.textContent = t('Enviando…');
    form.setAttribute('aria-busy', 'true');
    status.textContent = t('Estamos guardando tus respuestas.');
    form.querySelectorAll('fieldset').forEach(group => { group.disabled = true; });
    try {
      const buildVersion = window.PLAYTEST_CONFIG.buildVersion.trim();
      if (!buildVersion || buildVersion.length > 100) throw new Error('Build version unavailable');
      sessionId ||= crypto.randomUUID();
      const { error } = await getClient().from('playtest_responses').insert({ ...answers,
        session_id: sessionId, build_version: buildVersion }).abortSignal(AbortSignal.timeout(20000));
      if (error) throw error;
      submitted = true;
      form.hidden = true;
      document.querySelector('#success').hidden = false;
      document.querySelector('#thanks').focus();
    } catch {
      status.textContent = t('No pudimos confirmar el envío. Tus respuestas siguen acá. Revisá tu conexión y volvé a intentar.');
    } finally {
      sending = false;
      submit.disabled = submitted;
      submit.textContent = t('Enviar respuestas');
      form.setAttribute('aria-busy', 'false');
      form.querySelectorAll('fieldset').forEach(group => { group.disabled = false; });
    }
  });
})();
