(function () {
  'use strict';
  const choice = (name, label, options) => ({ name, label, type: 'choice', options });
  const rating = (name, label, low, high) => ({ name, label, type: 'rating', low, high,
    options: [1, 2, 3, 4, 5].map(value => [String(value), String(value)]) });
  const questions = [
    choice('completed_night_1', '¿Pudiste completar la primera noche?', [['true', 'Sí'], ['false', 'No']]),
    choice('completed_night_2', '¿Pudiste completar la segunda noche?', [['yes', 'Sí'], ['no', 'No'], ['not_reached', 'No llegué a jugarla']]),
    { name: 'highest_night', label: '¿Hasta qué noche llegaste?', type: 'number' },
    rating('initial_understanding', '¿Qué tan fácil fue entender qué tenías que hacer al comenzar?', 'Nada fácil', 'Muy fácil'),
    rating('controls_intuitiveness', '¿Qué tan intuitivos te parecieron los controles?', 'Nada intuitivos', 'Muy intuitivos'),
    rating('cooking_understanding', '¿Qué tan fácil fue entender cómo cocinar y dar vuelta la carne?', 'Nada fácil', 'Muy fácil'),
    rating('heat_understanding', '¿Qué tan fácil fue entender el funcionamiento del carbón y las zonas de calor?', 'Nada fácil', 'Muy fácil'),
    rating('order_readability', '¿Qué tan fácil fue leer los pedidos y saber qué quería cada cliente?', 'Nada fácil', 'Muy fácil'),
    rating('difficulty_fairness', '¿Qué tan justa te pareció la dificultad?', 'Muy injusta', 'Muy justa'),
    choice('customer_pacing', '¿Cómo te pareció el ritmo de llegada de clientes?', [['very_slow', 'Muy lento'], ['slow', 'Lento'], ['good', 'Bien'], ['fast', 'Rápido'], ['very_fast', 'Muy rápido']]),
    rating('learning_feeling', '¿Sentiste que mejorabas y entendías mejor el juego mientras jugabas?', 'Para nada', 'Muchísimo'),
    choice('stress_experience', '¿El estrés de atender varios pedidos te resultó divertido o frustrante?', [['very_fun', 'Muy divertido'], ['mostly_fun', 'Más divertido que frustrante'], ['balanced', 'Mitad y mitad'], ['mostly_frustrating', 'Más frustrante que divertido'], ['very_frustrating', 'Muy frustrante']]),
    choice('want_to_continue', '¿Te dieron ganas de jugar otra noche para intentar hacerlo mejor?', [['yes', 'Sí'], ['maybe', 'Tal vez'], ['no', 'No']]),
    { name: 'favorite_part', label: '¿Qué fue lo que más te gustó?', type: 'text' },
    { name: 'one_thing_to_change', label: 'Si pudieras cambiar una sola cosa del juego, ¿qué cambiarías?', type: 'text' }
  ];

  function validate(values) {
    const answers = {}, errors = {};
    for (const q of questions) {
      const value = String(values[q.name] ?? '').trim();
      if (!value) errors[q.name] = 'Respondé esta pregunta para continuar.';
      else if (q.type === 'number') {
        // PostgreSQL integer storage bound, not a game progression limit.
        if (!/^\d+$/.test(value) || Number(value) > 2147483647) {
          errors[q.name] = 'Ingresá un entero entre 0 y 2147483647, sin decimales.';
        } else answers[q.name] = Number(value);
      } else if (q.type === 'text') {
        if ([...value].length > 4000) errors[q.name] = 'Usá como máximo 4000 caracteres.';
        else answers[q.name] = value;
      } else if (!q.options.some(([option]) => option === value)) {
        errors[q.name] = 'Elegí una de las opciones disponibles.';
      } else answers[q.name] = q.type === 'rating' ? Number(value)
        : q.name === 'completed_night_1' ? value === 'true' : value;
    }
    return { answers, errors };
  }

  let client;
  function getClient() {
    const config = window.PLAYTEST_CONFIG;
    if (!config?.supabaseUrl || !config?.supabasePublicKey || !window.supabase) {
      throw new Error('Supabase configuration or client unavailable');
    }
    if (!client) client = window.supabase.createClient(config.supabaseUrl, config.supabasePublicKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    return client;
  }

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  window.Playtest = { questions, validate, getClient, element };
})();
