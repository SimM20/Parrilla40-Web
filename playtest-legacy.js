// Historical questionnaire labels and value rules, used only by the private dashboard.
(function () {
  'use strict';
  const field = (name, type, label, en, options) => ({ name, type, label, en, options });
  const rating = (name, label, en) => field(name, 'rating', label, en);
  window.PlaytestLegacy = [
    field('completed_night_1', 'boolean', '¿Pudiste completar la primera noche?', 'Were you able to complete the first night?'),
    field('completed_night_2', 'choice', '¿Pudiste completar la segunda noche?', 'Were you able to complete the second night?', [
      ['yes', 'Sí', 'Yes'], ['no', 'No', 'No'], ['not_reached', 'No llegué a jugarla', 'I did not get to play it']
    ]),
    field('highest_night', 'number', '¿Hasta qué noche llegaste?', 'What was the highest night you reached?'),
    rating('initial_understanding', '¿Qué tan fácil fue entender qué tenías que hacer al comenzar?', 'How easy was it to understand what to do at the start?'),
    rating('controls_intuitiveness', '¿Qué tan intuitivos te parecieron los controles?', 'How intuitive did the controls feel?'),
    rating('cooking_understanding', '¿Qué tan fácil fue entender cómo cocinar y dar vuelta la carne?', 'How easy was it to understand how to cook and flip the meat?'),
    rating('heat_understanding', '¿Qué tan fácil fue entender el funcionamiento del carbón y las zonas de calor?', 'How easy was it to understand the charcoal and heat zones?'),
    rating('order_readability', '¿Qué tan fácil fue leer los pedidos y saber qué quería cada cliente?', 'How easy was it to read the orders and know what each customer wanted?'),
    rating('difficulty_fairness', '¿Qué tan justa te pareció la dificultad?', 'How fair did the difficulty feel?'),
    field('customer_pacing', 'choice', '¿Cómo te pareció el ritmo de llegada de clientes?', 'How did the pace of customer arrivals feel?', [
      ['very_slow', 'Muy lento', 'Very slow'], ['slow', 'Lento', 'Slow'], ['good', 'Bien', 'About right'], ['fast', 'Rápido', 'Fast'], ['very_fast', 'Muy rápido', 'Very fast']
    ]),
    rating('learning_feeling', '¿Sentiste que mejorabas y entendías mejor el juego mientras jugabas?', 'Did you feel you were improving and understanding the game better as you played?'),
    field('stress_experience', 'choice', '¿El estrés de atender varios pedidos te resultó divertido o frustrante?', 'Did handling several orders feel fun or frustrating?', [
      ['very_fun', 'Muy divertido', 'Very fun'], ['mostly_fun', 'Más divertido que frustrante', 'More fun than frustrating'], ['balanced', 'Mitad y mitad', 'Half and half'], ['mostly_frustrating', 'Más frustrante que divertido', 'More frustrating than fun'], ['very_frustrating', 'Muy frustrante', 'Very frustrating']
    ]),
    field('want_to_continue', 'choice', '¿Te dieron ganas de jugar otra noche para intentar hacerlo mejor?', 'Did you feel like playing another night to try to do better?', [
      ['yes', 'Sí', 'Yes'], ['maybe', 'Tal vez', 'Maybe'], ['no', 'No', 'No']
    ]),
    field('favorite_part', 'text', '¿Qué fue lo que más te gustó?', 'What did you like most?'),
    field('one_thing_to_change', 'text', 'Si pudieras cambiar una sola cosa del juego, ¿qué cambiarías?', 'If you could change one thing about the game, what would it be?')
  ];
})();
