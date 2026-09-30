(function () {
  'use strict';
  const { questions, validate, getClient, element } = window.Playtest;
  const form = document.querySelector('#survey');
  const status = document.querySelector('#survey-status');
  const submit = document.querySelector('#submit-survey');
  let sending = false, submitted = false, sessionId;

  questions.forEach((q, index) => {
    const group = element('fieldset', undefined, 'question');
    group.id = `question-${q.name}`;
    group.append(element('legend', `${index + 1}. ${q.label}`));
    if (q.options) {
      if (q.type === 'rating') {
        const hint = element('p', `1 = ${q.low} · 5 = ${q.high}`, 'field-hint');
        hint.id = `hint-${q.name}`;
        group.append(hint);
      }
      const options = element('div', undefined, q.type === 'rating' ? 'choices ratings' : 'choices');
      for (const [value, label] of q.options) {
        const wrapper = element('label', undefined, 'choice');
        const input = element('input');
        input.type = 'radio'; input.name = q.name; input.value = value; input.required = true;
        input.setAttribute('aria-describedby', `error-${q.name}${q.type === 'rating' ? ` hint-${q.name}` : ''}`);
        wrapper.append(input, element('span', label));
        options.append(wrapper);
      }
      group.append(options);
    } else {
      const label = element('label', q.label, 'sr-only');
      label.htmlFor = q.name;
      const input = element(q.type === 'text' ? 'textarea' : 'input');
      input.id = input.name = q.name; input.required = true;
      if (q.type === 'text') { input.rows = 4; input.maxLength = 4000; }
      else { input.type = 'number'; input.min = '0'; input.max = '2147483647'; input.step = '1'; input.inputMode = 'numeric'; }
      input.setAttribute('aria-describedby', `hint-${q.name} error-${q.name}`);
      const hint = element('p', q.type === 'text' ? 'Hasta 4000 caracteres. No incluyas datos personales.' : 'Un número entero, sin decimales. Si no llegaste a ninguna noche, ingresá 0.', 'field-hint');
      hint.id = `hint-${q.name}`;
      group.append(label, input, hint);
    }
    const error = element('p', '', 'field-error');
    error.id = `error-${q.name}`;
    group.append(error);
    document.querySelector('#questions').append(group);
  });
  form.hidden = false;

  function showErrors(errors) {
    questions.forEach(q => {
      document.querySelector(`#error-${q.name}`).textContent = errors[q.name] || '';
      form.querySelectorAll(`[name="${q.name}"]`).forEach(input => {
        input.setAttribute('aria-invalid', String(Boolean(errors[q.name])));
      });
    });
  }
  form.addEventListener('input', event => {
    const name = event.target.name;
    if (!name) return;
    const { errors } = validate(Object.fromEntries(new FormData(form)));
    document.querySelector(`#error-${name}`).textContent = errors[name] || '';
    form.querySelectorAll(`[name="${name}"]`).forEach(input => input.setAttribute('aria-invalid', String(Boolean(errors[name]))));
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || submitted) return;
    const { answers, errors } = validate(Object.fromEntries(new FormData(form)));
    showErrors(errors);
    if (Object.keys(errors).length) {
      status.textContent = 'Revisá las preguntas marcadas. Tus respuestas siguen acá.';
      form.querySelector('[aria-invalid="true"]').focus();
      return;
    }
    sending = true;
    submit.disabled = true;
    submit.textContent = 'Enviando…';
    form.setAttribute('aria-busy', 'true');
    status.textContent = 'Estamos guardando tus respuestas.';
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
      status.textContent = 'No pudimos confirmar el envío. Tus respuestas siguen acá. Revisá tu conexión y volvé a intentar.';
    } finally {
      sending = false;
      submit.disabled = submitted;
      submit.textContent = 'Enviar respuestas';
      form.setAttribute('aria-busy', 'false');
      form.querySelectorAll('fieldset').forEach(group => { group.disabled = false; });
    }
  });
})();
