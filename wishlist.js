(function () {
  'use strict';
  const t = window.Site?.t || (text => text);
  const form = document.querySelector('#signup'), mail = document.querySelector('#signupMail'), note = document.querySelector('#signupNote');
  const button = form.querySelector('button');
  let sending = false, saved = false;
  button.disabled = false;

  const say = (text, isError) => {
    note.className = 'signup__note' + (isError ? ' is-err' : '');
    note.textContent = t(text);
  };
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || saved) return;
    const email = window.Playtest.launchEmail(mail.value);
    mail.setAttribute('aria-invalid', String(!email));
    if (!email) {
      say('Ese mail no parece válido — fijate de nuevo.', true);
      mail.focus();
      return;
    }
    sending = true;
    button.disabled = mail.disabled = true;
    button.textContent = t('Anotando…');
    say('');
    try {
      const { error } = await window.Playtest.saveLaunchEmail(email);
      if (error) throw error;
      saved = true;
      say('¡Listo! Te avisamos cuando puedas agregarlo a tu lista de deseados.');
    } catch {
      say('No pudimos anotarte. Revisá tu conexión y volvé a intentar.', true);
    } finally {
      sending = false;
      button.textContent = t(saved ? 'Anotado' : 'Avisame');
      button.disabled = mail.disabled = saved;
    }
  });
})();
