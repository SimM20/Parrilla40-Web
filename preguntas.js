(function () {
  'use strict';
  const { questions, validate, getClient, element } = window.Playtest;
  const form = document.querySelector('#survey');
  const status = document.querySelector('#survey-status');
  const submit = document.querySelector('#submit-survey');
  let sending = false, submitted = false, sessionId;
  const container = document.querySelector('#questions');
  const progress = document.querySelector('#survey-progress');
  const progressCount = document.querySelector('#progress-count');
  const sections = {
    0: ['Tu partida', 'Empecemos por las noches que jugaste.', 'assets/extras/carbon-prendido.png'],
    3: ['La experiencia', 'Pensá en cómo se sintió jugar, desde el primer pedido.', 'assets/cortes/chorizo-jugoso.png'],
    13: ['Lo que te llevás', 'Dos respuestas para ayudarnos a mejorar. No incluyas datos personales.', 'assets/cortes/choripan-hecho.png']
  };
  let block = container;

  questions.forEach((q, index) => {
    if (sections[index]) {
      const [title, text, sprite] = sections[index];
      block = element('section', undefined, 'survey-block');
      block.setAttribute('aria-labelledby', `block-${index}`);
      const heading = element('div', undefined, 'survey-section-heading');
      const img = element('img', undefined, 'px');
      img.src = sprite; img.alt = ''; img.width = 56; img.height = 56;
      const h2 = element('h2', title);
      h2.id = `block-${index}`;
      const copy = element('div');
      copy.append(h2, element('p', text));
      heading.append(img, copy);
      block.append(heading);
      container.append(block);
    }
    const group = element('fieldset', undefined, 'question');
    group.id = `question-${q.name}`;
    const legend = element('legend');
    const number = element('span', String(index + 1).padStart(2, '0'), 'question-number');
    legend.append(number, element('span', q.label));
    group.append(legend);
    if (q.options) {
      if (q.type === 'rating') {
        const hint = element('p', undefined, 'field-hint scale-ends');
        hint.append(element('span', `1 · ${q.low}`), element('span', `5 · ${q.high}`));
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
      if (q.type === 'rating') group.append(group.querySelector('.scale-ends'));
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
      if (q.type === 'text') {
        const count = element('span', '0 / 4000', 'text-count');
        count.id = `count-${q.name}`;
        group.append(count);
      }
    }
    const error = element('p', '', 'field-error');
    error.id = `error-${q.name}`;
    group.append(error);
    block.append(group);
  });
  form.hidden = false;

  function updateProgress(errors) {
    const count = questions.length - Object.keys(errors).length;
    if (progress.value !== count) {
      progress.value = count;
      progressCount.textContent = `${count} de 15 respondidas`;
    }
    document.querySelector('#completion-note').textContent = count === 15
      ? 'Todo listo. Podés revisar tus respuestas antes de enviarlas.'
      : `Te ${15 - count === 1 ? 'falta 1 respuesta' : `faltan ${15 - count} respuestas`} para terminar.`;
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
