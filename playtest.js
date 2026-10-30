(function () {
  'use strict';
  const t = window.Site?.t || (text => text);
  // Single questionnaire definition, also used by the static-page generator and private panel.
  const questions = [
    { name: 'perceived_time_flow', type: 'choice', label: '¿Cómo sentiste que pasó el tiempo mientras jugabas?', options: [
      ['1', 'Se me hizo muy largo.'], ['2', 'Se me hizo algo largo.'], ['3', 'Ni rápido ni lento.'],
      ['4', 'Pasó bastante rápido.'], ['5', 'Se me pasó volando.']
    ] },
    { name: 'post_session_feeling', type: 'choice', label: 'Cuando terminaste de jugar, ¿con qué sensación te quedaste?', options: [
      ['another_night', 'Me quedé con ganas de jugar otra noche.'],
      ['retry_better', 'Me quedé con ganas de volver a intentar para hacerlo mejor.'],
      ['enough_for_now', 'Sentí que había jugado suficiente por el momento.'],
      ['prefer_stop', 'Prefería dejar de jugar.'], ['unsure', 'No sabría decir.']
    ] },
    { name: 'memorable_moment', type: 'text', optional: true, label: '¿Qué momento de la partida recordás más y por qué?',
      hint: 'Puede ser algo que te gustó, te frustró o te aburrió. Contanos qué pasó.' }
  ];
  function validate(values) {
    const answers = {}, errors = {};
    for (const q of questions) {
      const raw = String(values[q.name] ?? '');
      const value = raw.trim();
      if (q.type === 'text') {
        if ([...raw].length > 1200) errors[q.name] = t('Usá como máximo 1200 caracteres.');
        else answers[q.name] = value || null;
      } else if (!value) errors[q.name] = t('Elegí una opción.');
      else if (!q.options.some(([option]) => option === value)) errors[q.name] = t('Elegí una de las opciones disponibles.');
      else answers[q.name] = q.name === 'perceived_time_flow' ? Number(value) : value;
    }
    return { answers, errors };
  }
  function launchEmail(value) {
    const email = String(value ?? '').trim().toLowerCase();
    return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
  }
  let client;
  function getClient() {
    const config = window.PLAYTEST_CONFIG;
    if (!config?.supabaseUrl || !config?.supabasePublicKey || !window.supabase) throw new Error('Supabase unavailable');
    if (!client) client = window.supabase.createClient(config.supabaseUrl, config.supabasePublicKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    return client;
  }
  function saveLaunchEmail(email, token) {
    return getClient().rpc('subscribe_launch_notice', { p_email: email,
      p_language: document.documentElement.lang === 'en' ? 'en' : 'es',
      p_consent_version: 'steam-wishlist-v1', p_consent: true, p_withdrawal_token: token
    }).abortSignal(AbortSignal.timeout(20000));
  }
  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  window.Playtest = { questions, validate, launchEmail, saveLaunchEmail, getClient, element };
})();
