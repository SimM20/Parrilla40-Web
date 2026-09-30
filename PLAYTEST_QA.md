# Verificación V1 — 2026-09-30

Estado: implementación local verificada. El usuario pospuso conectar Supabase. No se aplicaron cambios a proyectos remotos, no se provisionó la contraseña real y no se publicó en hosting.

## Etapas ejecutadas

| Etapa | Resultado |
|---|---|
| 00 — Auditoría | Revisados los cuatro documentos raíz, prompts 00–08, HTML, CSS, JS, assets, fuentes, Git y LEEME. Sitio estático sin backend ni tooling de pruebas; hosting genérico por copia de archivos. Se verificó el control de cocción antes de editar. |
| 01 — Datos y seguridad | SQL reproducible ejecutado y probado en PostgreSQL/WASM (PGlite 0.5.8) con pgcrypto. Proyecto real pendiente por decisión del usuario. |
| 02 — Encuesta | Exactamente 15 preguntas, controles nativos, escalas, validación, textos y estados. Validación de opciones y límites comprobada. |
| 03 — Envío | Cliente Supabase oficial 2.117.2, UUID, build centralizada, bloqueo durante envío, error recuperable y confirmación posterior al éxito. Flujo de navegador verificado con API interceptada. |
| 04 — CTA | Único cambio al índice: un enlace con las clases de botón existentes. Sin modificaciones a `styles.css` ni `script.js`. |
| 05 — Resultados | Acceso por RPC, resúmenes, denominadores explícitos, siete promedios, tres distribuciones, comentarios, builds y filtro. Sin enlaces públicos al panel. |
| 06 — Visual y accesibilidad | Edge real/headless, 320/390/768/1440 px, capturas inspeccionadas, teclado y foco, zoom 200%, controles y estados visibles. Reutiliza Bungee/Nunito, tokens de color, radios y sprites existentes. |
| 07 — QA | Pruebas de navegador, validación y PostgreSQL aprobadas; generador bcrypt probado con contraseña aleatoria. Sin secretos, HTML inyectado ni persistencia del password/dataset. |
| 08 — Entrega | Instrucciones exactas en `PLAYTEST_SETUP.md`. No se declara verificación de Supabase/hosting reales: esa parte queda pendiente hasta conectarlos. |

Las cinco skills visuales solicitadas estaban instaladas. Se aplicaron auditoría, integridad de entrega y refinamiento dentro de las reglas del repositorio. Sus sugerencias de cambiar fuentes, rediseñar o agregar frameworks/animaciones no aplican a este alcance. No había mockups que requirieran traducción con image-to-code.

## Pruebas y evidencia

- `node tests/validation.cjs`: 15 campos únicos; todas las opciones y conversiones; extremos 1–5; entero no negativo y límite de almacenamiento; texto vacío, espacios y 4000/4001 caracteres; ausencia de enlaces al panel desde páginas públicas.
- `node tests/database.cjs`: ejecuta `supabase/setup.sql` sin modificarlo, en una base efímera con roles `anon` y `authenticated`. Inserción válida; UUID y fecha; NOT NULL en las 15 respuestas; CHECK de escalas/enumeraciones/textos; números inválidos; denegación de SELECT, UPDATE, DELETE, TRUNCATE y lectura del hash; imposibilidad de falsificar ID/fecha mediante INSERT público; RPC cerrado sin verificador; rechazo de contraseña incorrecta, nula, vacía y demasiado larga; contraseña bcrypt correcta; `search_path` fijo y payload mínimo.
- `node tests/browser.cjs`: Edge controlado con Playwright 1.62.1, API sintética interceptada. Envío válido, errores, respuestas conservadas, reintento y envío repetido mientras la petición está pendiente; pantalla de agradecimiento sólo tras HTTP 201. Verificación del payload de las 15 respuestas y metadatos.
- Panel: acceso directo sin solicitud de datos, contraseña errónea, fallo de red, cero/dos/1200 respuestas, totales y porcentajes conocidos, promedios conocidos, filtro, texto de 4000 caracteres, intento de HTML renderizado literalmente, cerrar y recargar, almacenamiento del navegador vacío.
- Cuatro tamaños para encuesta, resultados e índice. Encuesta y resultados sin desborde horizontal. El índice original ya tiene 2 px de desborde a 320 px: se compararon versión original y nueva y no aumentó; no se cambió código ajeno al CTA.
- Encuesta completa y enviada usando sólo teclado; navegación con Tab, cambio de radio con flechas y contorno visible; resultado legible a zoom 200%. Pruebas con movimiento reducido; pausa del reloj verificada con movimiento habilitado.
- Regresión: CTA a encuesta, controles de cocción, cambio de corte, pausa de jornada y formulario de marketing original conservados.
- Configuración real vacía: error recuperable, sin falso éxito ni resultados expuestos.
- Generador de verificador: bcrypt 5.0.0, costo 12, sólo salida del hash; contraseña aleatoria correcta comprobada; rechazo de entrada vacía, >72 bytes y confirmación distinta. No se utilizó ni guardó la contraseña administrativa real.
- Sin excepciones JavaScript ni errores inesperados de consola. Los fallos HTTP inyectados deliberadamente y el favicon ausente del índice original se distinguen de errores de código.
- `git diff --check`, verificación de sintaxis JS y búsqueda de secretos/marcadores de código incompleto aprobadas.

## Archivos de la entrega

Modificados:

- `index.html`: un único CTA a la encuesta.
- `LEEME.md`: enlace a las instrucciones nuevas.

Creados:

- `preguntas.html`, `preguntas.js`: formulario y envío.
- `resultados.html`, `resultados.js`: acceso privado y visualización.
- `playtest.js`, `playtest.css`, `playtest-config.js`: preguntas/opciones compartidas, cliente, estilos y configuración pública.
- `supabase/setup.sql`: esquema y seguridad.
- `tools/admin-verifier.py`: generación local del hash.
- `tests/validation.cjs`, `tests/database.cjs`, `tests/browser.cjs`: verificación reproducible.
- `PLAYTEST_SETUP.md`, `PLAYTEST_QA.md`: operación y evidencia.
- `.gitignore`: exclusión de secretos y artefactos de herramientas.

Los documentos de instrucciones originales y `prompts/` estaban sin seguimiento al iniciar; se conservaron sin cambios y no se incluyeron en los commits de implementación.

## Pendiente antes de publicar

1. Elegir el proyecto Supabase, aplicar SQL y provisionar el hash fuera del repositorio.
2. Configurar URL, clave pública y build real en `playtest-config.js`.
3. Comprobar inserción y RPC por la Data API real, RLS con clave pública y asesores de Supabase.
4. Publicar archivos en el hosting estático existente y repetir los flujos con HTTPS y rutas directas.

Las pruebas PostgreSQL locales no validan la configuración de Data API, red ni permisos efectivos de un proyecto remoto todavía no elegido.

## Refinamiento posterior de la encuesta

- Preguntas organizadas visualmente en tres temas, sin cambiar cantidad, orden ni contenido.
- Progreso visible durante el recorrido, calculado sobre respuestas válidas; vuelve de 15 a 14 si una respuesta deja de ser válida.
- Escalas con números grandes, extremos explicados y selección con marca y contraste; opciones breves adaptadas al móvil.
- Menos bordes repetidos, jerarquía de lectura más clara y cierre con indicación de respuestas pendientes.
- Contadores de texto y validación al salir del campo o enviar; una corrección elimina el error durante la escritura.
- Repetidas las pruebas de navegador en cuatro anchos, flujo íntegro por teclado, errores/reintentos, panel y regresiones. Añadidas comprobaciones del progreso y los contadores. Capturas de escritorio, móvil y escala seleccionada inspeccionadas.
