(function () {
  'use strict';
  const { questions, validate, getClient } = window.Playtest;
  const form = document.querySelector('#survey');
  const status = document.querySelector('#survey-status');
  const submit = document.querySelector('#submit-survey');
  const progress = document.querySelector('#survey-progress');
  const progressCount = document.querySelector('#progress-count');
  const notifyEmail = document.querySelector('#notify-email');
  const emailInput = document.querySelector('#launch_email');
  const total = questions.length;
  let sending = false, submitted = false, responseSaved = false, emailSaved = false, sessionId;
  const t = window.Site?.t || (text => text);
  submit.disabled = false;
  // A restored page (back button, autofill) may already have "yes" checked.
  window.addEventListener('pageshow', () => syncNotify());

  // The email follow-up belongs to the launch question: it only completes with a valid email.
  const isComplete = (q, errors) => !errors[q.name] && !(q.name === 'launch_notify' && errors.launch_email);

  function updateProgress(errors) {
    const count = questions.filter(q => isComplete(q, errors)).length;
    if (progress.value !== count) {
      progress.value = count;
      progressCount.textContent = t('{count} de {total} respondidas', { count, total });
    }
    document.querySelector('#completion-note').textContent = count === total
      ? t('Todo listo. Podés revisar tus respuestas antes de enviarlas.')
      : count === total - 1 ? t('Te falta 1 respuesta para terminar.') : t('Te faltan {count} respuestas para terminar.', { count: total - count });
    questions.forEach(q => {
      document.querySelector(`#question-${q.name}`).classList.toggle('is-complete', isComplete(q, errors));
    });
  }

  function showFieldError(name, error) {
    document.querySelector(`#error-${name}`).textContent = error || '';
    document.querySelector(`#question-${name === 'launch_email' ? 'launch_notify' : name}`).classList.toggle('has-error', Boolean(error));
    form.querySelectorAll(`[name="${name}"]`).forEach(input => input.setAttribute('aria-invalid', String(Boolean(error))));
  }

  function showErrors(errors) {
    questions.forEach(q => showFieldError(q.name, errors[q.name]));
    showFieldError('launch_email', errors.launch_email);
  }

  function syncNotify() {
    const wanted = form.querySelector('[name="launch_notify"]:checked')?.value === 'true';
    notifyEmail.hidden = !wanted;
    emailInput.disabled = !wanted;
    if (!wanted) showFieldError('launch_email', '');
  }

  form.addEventListener('input', event => {
    const name = event.target.name;
    if (!name) return;
    if (name === 'launch_notify') syncNotify();
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
    const { answers, errors, notifyEmail: email } = validate(Object.fromEntries(new FormData(form)));
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
      // Each step is kept once confirmed, so a retry never duplicates the saved part.
      if (!responseSaved) {
        const { error } = await getClient().from('playtest_responses').insert({ ...answers,
          session_id: sessionId, build_version: buildVersion }).abortSignal(AbortSignal.timeout(20000));
        if (error) throw error;
        responseSaved = true;
      }
      // Stored apart from the answers, with no session ID, so responses stay anonymous.
      if (email && !emailSaved) {
        const { error } = await getClient().from('launch_notify_signups').insert({ email,
          language: document.documentElement.lang === 'en' ? 'en' : 'es' }).abortSignal(AbortSignal.timeout(20000));
        if (error) throw error;
        emailSaved = true;
      }
      submitted = true;
      form.hidden = true;
      document.querySelector('#notify-done').hidden = !email;
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
