# Investigación del playtest de tres preguntas

Revisión documental: 29 de octubre de 2026. Cuestionario exploratorio diseñado para Parrilla 40. No constituye una escala validada de diversión, flow ni engagement.

## Qué se quiere aprender

Identificar señales sobre involucramiento, estado al finalizar y momentos salientes del ciclo de cocinar, atender y administrar una jornada. Son tres dimensiones diferentes: se presentan y analizan por separado. No se suma una puntuación general ni se interpreta la intención declarada como retención observada.

## Fuentes revisadas y aplicación

| Fuente primaria | Aporte al diseño | Límite de la adaptación |
| --- | --- | --- |
| [Games User Research: Find the fun](https://gamesuserresearch.com/find-the-fun-measuring-enjoyment-in-games-user-research/) | Las cifras aisladas necesitan contexto de estudio y explicación cualitativa. | El artículo también admite preguntas directas de disfrute; no demuestra que este sustituto indirecto mida diversión. |
| [Games User Research: How to write a playtest survey](https://gamesuserresearch.com/how-to-write-a-playtest-survey/) | Objetivo antes que método; lenguaje natural, opciones negativas y piloto de comprensión. | Una encuesta no permite repreguntar como una entrevista. Declaraciones futuras predicen mal la conducta. |
| [Player Experience Inventory: modelo e instrumento](https://playerexperienceinventory.org/instrument) | Distingue consecuencias funcionales y psicosociales, incluyendo inmersión, curiosidad y dominio. | Las tres preguntas de Parrilla 40 no son el PXI ni su versión corta; no heredan su validación. |
| [IJsselsteijn, de Kort y Poels: Game Experience Questionnaire, TU Eindhoven](https://research.tue.nl/nl/publications/the-game-experience-questionnaire/) | Separa flow, afecto, tensión, desafío y otros componentes; diferencia durante la partida y después de ella. | Tres preguntas propias no reproducen sus módulos ni sus reglas de puntuación. No confundir este GEQ con el Game Engagement Questionnaire de otro equipo. |
| [Schell Games: The Definitive Guide to Playtest Questions](https://schellgames.com/blog/the-definitive-guide-to-playtest-questions-for-video-game-playtesters) | Preguntar por episodios concretos permite investigar aspectos recordados. | Se conserva una sola pregunta abierta neutral; no se agregan sus seis preguntas a esta encuesta. |

La ficha institucional del GEQ fue accesible; su PDF enlazado respondió 403 durante esta revisión. No se afirma haber examinado ese PDF completo. Las fuentes se usaron como guía conceptual, sin copiar instrumentos propietarios ni atribuirles este cuestionario.

## Cuestionario y equivalencia de significado

| Campo | Español | Inglés | Interpretación permitida |
| --- | --- | --- | --- |
| `perceived_time_flow` | ¿Cómo sentiste que pasó el tiempo mientras jugabas? | How did time seem to pass while you were playing? | Percepción retrospectiva del paso del tiempo; señal posible de absorción. |
| `post_session_feeling` | Cuando terminaste de jugar, ¿con qué sensación te quedaste? | When you finished playing, how did you feel? | Estado declarado al terminar: progresar, mejorar, suficiente por ahora, preferir dejar o incertidumbre. |
| `memorable_moment` | ¿Qué momento de la partida recordás más y por qué? | What moment from your session do you remember most, and why? | Recuerdo espontáneo y explicación; respuesta opcional de hasta 1200 caracteres. |

Se conservan las cinco opciones y su orden en cada selección. En Q1: muy largo / algo largo / ni rápido ni lento / bastante rápido / volando se corresponden con very slow / somewhat slow / neither fast nor slow / quite fast / flew by. En Q2, otra noche y volver a intentar para mejorar son categorías independientes; suficiente por el momento no se etiqueta como rechazo. La ayuda de Q3 admite gusto, frustración y aburrimiento sin dar ejemplos de mecánicas.

## Revisión de sesgos y límites

- Ninguna pregunta afirma que la persona se divirtió. Las opciones estructuradas admiten experiencias negativas, neutrales y favorables.
- Q1 no demuestra disfrute: concentración, presión, familiaridad, duración o contexto pueden alterar la percepción temporal. Tampoco mide por sí sola todos los componentes del flow.
- Q2 pregunta por el cierre vivido de la sesión. Aun así, las ganas declaradas de continuar o reintentar no son una sesión futura observada. No se calcula una retención con esas respuestas.
- La frustración puede coexistir con motivación por mejorar. Leer Q2 junto al relato abierto ayuda a formular una hipótesis; no demuestra causalidad.
- Q3 depende de memoria y saliencia, y puede omitir problemas rutinarios. Al ser opcional, sus autores pueden diferir del resto de la muestra.
- La encuesta conserva exactamente tres preguntas. El email independiente posterior no es una respuesta de investigación ni condición para enviar.

## Cómo usar los resultados

Mostrar cantidades absolutas y denominadores junto a porcentajes. Presentar la distribución completa de Q1, las cinco categorías de Q2 y los relatos abiertos. Mostrar por separado el porcentaje de otra noche y el de reintento; su combinación, si se muestra, se rotula como declaración de continuidad o reintento, sin índice de diversión.

Comparar builds sólo como descripción: indicar `n` por build, fechas y método de reclutamiento en el informe del estudio. No se incorporan preguntas demográficas para estimar composición. El reclutador debe documentar fuera de esta base el tipo de convocatoria, experiencia previa conocida a nivel de grupo, condiciones, duración prevista y cambios del protocolo, sin vincular identidades a respuestas. Diferencias de composición o autoelección pueden explicar variaciones. No afirmar mejoras concluyentes por diferencias pequeñas ni significación por observar porcentajes distintos.

Para relatos: leer completos, agrupar episodios por temas emergentes y registrar evidencia favorable, negativa o mixta sin forzar una sola valencia. La ausencia de un tema no prueba que no sucediera. Los casos sirven para priorizar observación y nuevas pruebas, no para diagnosticar una mecánica sólo a partir de una frase. Triangular con sesiones observadas y entrevistas autorizadas; esta entrega no agrega telemetría.

Los registros históricos proceden de otro instrumento y permanecen separados. Sus métricas no equivalen a las nuevas preguntas y no deben combinarse en una serie temporal homogénea.

## Comprensión con participantes: pendiente

No hubo participantes reales disponibles durante la implementación. La revisión de redacción y las pruebas de software no constituyen validación empírica ni intercultural.

Antes de la siguiente ronda, realizar un piloto con 3–5 personas por idioma, incluyendo uso móvil. Tras jugar, pedir que completen la encuesta sin explicación. Medir tiempo hasta envío y preguntar después, fuera del formulario de producción, qué entendieron por cada pregunta y por las categorías de Q2. Comprobar si distinguen otra noche de reintentar, si encuentran una opción que les represente y si entienden que Q3 y el email son opcionales. Revisar si nombran episodios concretos sin sugerencias del moderador. Registrar malentendidos, lenguaje y abandonos, corregir equivalencias ES/EN y repetir cuando haya cambios relevantes. El piloto comprueba comprensión y carga; tampoco valida una escala psicométrica.

El objetivo de menos de un minuto es una meta de usabilidad pendiente de medir con participantes, no un tiempo probado.
