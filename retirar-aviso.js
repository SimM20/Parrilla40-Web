(function () {
  'use strict';
  const t = window.Site.t, button = document.querySelector('#withdraw'), status = document.querySelector('#withdraw-status');
  const token = location.hash.slice(1);
  const language = document.querySelector('[data-language-link]');
  if (language && /^[a-f0-9]{64}$/.test(token)) language.hash = token;
  // Keep the capability out of subsequent navigation/referrers and the visible address bar.
  history.replaceState(null, '', location.pathname + location.search);
  if (!/^[a-f0-9]{64}$/.test(token)) {
    status.textContent = t('Falta un enlace de retiro válido. Usá el enlace privado que guardaste al registrarte.');
    return;
  }
  button.disabled = false;
  let sending = false, done = false;
  button.addEventListener('click', async () => {
    if (sending || done) return;
    sending = button.disabled = true;
    status.textContent = t('Procesando la solicitud…');
    try {
      const { error } = await window.Playtest.getClient().rpc('revoke_launch_notice', { p_withdrawal_token: token }).abortSignal(AbortSignal.timeout(20000));
      if (error) throw error;
      done = true;
      status.textContent = t('Solicitud procesada. Si existía un registro asociado a este enlace, se eliminó y se retiró su consentimiento.');
    } catch {
      status.textContent = t('No pudimos confirmar la eliminación. Volvé a intentar con este mismo enlace.');
    } finally { sending = false; button.disabled = done; }
  });
})();
