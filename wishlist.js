(function () {
  'use strict';
  const form = document.querySelector('#signup');
  if (!form) return;
  const t = window.Site.t, mail = form.querySelector('[name="email"]'), consent = form.querySelector('[name="consent"]');
  const note = document.querySelector('#signupNote'), button = form.querySelector('button[type="submit"]');
  const receipt = document.querySelector('#signup-receipt'), link = document.querySelector('#withdrawal-link');
  let sending = false, saved = false, token, tokenEmail;
  const storageKey = 'parrilla40-launch-notice-pending';
  try {
    const pending = JSON.parse(sessionStorage.getItem(storageKey));
    if (pending && window.Playtest.launchEmail(pending.email) && /^[a-f0-9]{64}$/.test(pending.token)) {
      token = pending.token; tokenEmail = pending.email;
      mail.value = pending.email;
    }
  } catch { /* The token remains in memory if browser storage is blocked. */ }
  button.disabled = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || saved) return;
    const email = window.Playtest.launchEmail(mail.value);
    mail.setAttribute('aria-invalid', String(!email));
    consent.setAttribute('aria-invalid', String(!consent.checked));
    if (!email || !consent.checked) {
      note.textContent = t(!email ? 'Revisá tu email.' : 'Confirmá que querés recibir el aviso.');
      (!email ? mail : consent).focus();
      return;
    }
    sending = true;
    button.disabled = mail.disabled = consent.disabled = true;
    button.textContent = t('Guardando…');
    form.setAttribute('aria-busy', 'true');
    note.textContent = '';
    try {
      if (!token || tokenEmail !== email) {
        token = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
        tokenEmail = email;
      }
      // Persist the capability before sending: a lost HTTP reply must not lose deletion authority.
      try { sessionStorage.setItem(storageKey, JSON.stringify({ email, token })); } catch { /* In-page retries still reuse the token. */ }
      const { error } = await window.Playtest.saveLaunchEmail(email, token);
      if (error) throw error;
      saved = true;
      const target = new URL(document.documentElement.lang === 'en' ? '/retirar-aviso-en.html' : '/retirar-aviso.html', location.href);
      target.hash = token;
      link.href = target.href;
      receipt.hidden = false;
      try { sessionStorage.removeItem(storageKey); } catch { /* No storage required for the confirmed receipt. */ }
      note.textContent = t('Listo.');
      link.focus();
    } catch {
      note.textContent = t('No pudimos anotarte. Volvé a intentar.');
    } finally {
      sending = false;
      button.disabled = mail.disabled = consent.disabled = saved;
      button.textContent = t(saved ? 'Listo' : 'Anotarme');
      form.setAttribute('aria-busy', 'false');
    }
  });
  document.querySelector('#download-withdrawal').addEventListener('click', () => {
    const blob = new Blob([t('Enlace privado para retirar el consentimiento y eliminar tu registro:') + '\n' + link.href + '\n'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob), download = document.createElement('a');
    download.href = url; download.download = 'parrilla40-retirar-aviso.txt'; download.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
})();
