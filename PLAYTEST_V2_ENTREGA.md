# Entrega: playtest de tres preguntas de Parrilla 40

29 de octubre de 2026. **Implementación local y base original verificadas; publicación del sitio pendiente.** La migración se aplicó por SQL Editor en `nyrkyrycfabytctgaewz`, organización Parri. Las 4 respuestas históricas se conservaron. Emails y encuesta usan ese mismo proyecto; guardado y baja reales aprobados, sin registros ficticios remanentes. No se modificaron proyectos de otras cuentas.

## Experiencia implementada

La encuesta anterior fue reemplazada por tres preguntas reales, definidas una sola vez en `playtest.js` y generadas como HTML inicial en español e inglés. Q1 y Q2 son obligatorias; Q3 es opcional, hasta 1200 caracteres. No quedan trece preguntas ocultas ni se pide email antes de confirmar la encuesta.

El diseño usa una comanda de parrilla: sello de Ruta 40, carbón del juego, Bungee/Nunito y colores existentes, con dos columnas en escritorio y una en celular. Selección mediante radios nativos, foco visible, errores asociados, contador de texto, un botón principal y agradecimiento. La home conserva su composición; recibe CTA, enlaces legales y copy honesto sobre avisos.

Los errores conservan respuestas. Después de una respuesta de red incierta se reenvía exactamente el mismo UUID/payload; la operación pendiente se recupera tras recarga o cambio de idioma en la misma pestaña. Al confirmar se elimina el snapshot temporal y se recuerda el éxito para esa build. No se guarda contraseña ni dataset del panel en almacenamiento.

## Modelo de datos y migración

| Objeto | Contenido y acceso |
| --- | --- |
| `playtest_responses_v2` | UUID único, fecha del servidor, build y las tres respuestas. RLS; sin acceso directo público. |
| `submit_playtest_v2` | Validación del servidor y envío idempotente. Mismo UUID/datos no duplica; datos distintos para UUID utilizado se rechazan sin modificar. |
| `playtest_results_v2` | Bcrypt del servidor; devuelve sólo build, fecha y tres respuestas. Sin UUID, id, email o hash. |
| `playtest_responses` / `playtest_results` | Históricos preservados y consultables por separado con contraseña. |
| `launch_notice_consents` | Email normalizado único, idioma, fecha, consentimiento específico/versionado y hash del token de retiro. Sin relación/UUID de encuesta. |
| `subscribe_launch_notice` / `revoke_launch_notice` | Alta deduplicada sin enumeración y eliminación mediante token aleatorio de 256 bits; sólo su hash queda en la base. |

Migración necesaria: `supabase/migrations/20261029233053_playtest_three_questions_and_consent.sql`. Se ejecutó completa y pasó en PostgreSQL/PGlite con los SQL históricos y fixtures. Es aditiva y transaccional, conserva filas y verificador, y revoca escrituras públicas del instrumento y lista anteriores. Coordinar SQL y publicación del nuevo frontend: el formulario cacheado anterior deja de enviar en esa ventana.

El usuario inició sesión en el Dashboard original y se auditaron esquema, conteos, región (us-west-2), RLS, permisos y presencia del verificador, sin leer su hash ni cambiar la contraseña. La migración se adaptó al esquema real sin tabla histórica de emails y se volvió a probar antes de aplicarla. No se reutilizó ningún proyecto ajeno. Ver `SUPABASE_V2_AUDIT.md` y `PLAYTEST_SETUP.md`; no repetir la migración en este proyecto.

Se aplicó también `supabase/migrations/20261030012521_restrict_legacy_results_role.sql` para retirar el permiso extra de `authenticated` en el RPC histórico. Función, contraseña y 4 respuestas preservadas; acceso anónimo por contraseña conservado y comprobado.

## Resultados y métricas

Panel ES/EN con fuente actual o histórica elegida antes de validar contraseña. No hay consultas de datos al cargar ni enlaces al panel en páginas públicas. El cierre, recarga o navegación limpian contraseña, filas y DOM privado.

Se muestran total, distribución completa de tiempo percibido, cinco sensaciones finales, porcentaje que declara otra noche y porcentaje que declara reintentar **por separado**, siempre con n/N. Comentarios opcionales y comparación por build con tamaño de muestra, recuentos Q1 y ambos porcentajes. Un filtro permite leer distribuciones/textos de cada build.

No hay índice de diversión, puntuación numérica de motivación, retención estimada ni conclusiones estadísticas automáticas. El panel advierte sobre composición y tamaño de muestras voluntarias. Las métricas históricas se conservan en otro conjunto y no se mezclan con las nuevas.

## Consentimiento y retirada

Formulario independiente posterior al éxito y en `/wishlist/`, ES/EN. Checkbox sin preselección, finalidad de un único aviso de wishlist Steam y enlace de privacidad. Por pedido posterior del usuario, la interfaz no incluye comentarios sobre el estado de la integración de envío; sus pendientes se conservan en esta documentación interna.

El recibo permite guardar/descargar enlace privado de retirada. Su token viaja en fragmento, no en query ni con el email. Cargar el enlace no elimina nada; el botón pide al servidor borrar sólo el registro asociado. Resultado uniforme para código válido, desconocido o ya retirado. Duplicados de email conservan token original para que un tercero no pueda apropiarse de la baja. Durante una solicitud incierta, email/token se recuperan por una clave temporal separada; al confirmar se eliminan del almacenamiento.

El alcance acordado es guardar emails y consentimiento en el mismo proyecto que las respuestas, con retirada segura. El equipo hará el envío manualmente; un proveedor o integración de envío en la web no es un requisito de publicación. Las direcciones históricas no se importan ni se consideran automáticamente consentidas. Sin el enlace original se necesita el canal atendido de privacidad, aún pendiente. La consulta de la lista por el propietario está documentada en `PLAYTEST_SETUP.md`.

## Documentación legal e investigación

Seis páginas: privacidad, términos y cookies/almacenamiento, ES/EN. Describen datos, finalidades, responsable informado, consentimiento, Supabase/jsDelivr/hosting, almacenamiento temporal, conservación propuesta, seguridad, transferencias y derechos. Incluyen el ranking de evento preexistente como tratamiento separado. Sin banner de cookies porque el código no añadió analytics ni seguimiento.

Responsable informado por el usuario: **Parrilla40.SA**, **Av gelly y obes 2267, Recoleta, CABA, 1425, Argentina**. Correo de privacidad no informado. No se inventaron CUIT, constitución societaria, proveedor/región o fecha efectiva. Los documentos muestran borrador del 29/10/2026 y permanecen `noindex` hasta completar datos y operación.

Fuentes argentinas, AAIP, transferencias, registro y pendientes están en `LEGAL_PUBLICACION.md`. Conservación propuesta de 12 meses para encuestas/históricos y hasta aviso+30 días o máximo 12 meses para emails, antes si retira; exige procedimiento real de purga y revisión de backups. No se implementa ni se afirma una purga automática inexistente.

`INVESTIGACION_PLAYTEST.md` documenta las referencias GUR, PXI, GEQ y Schell Games, equivalencias ES/EN, interpretación y protocolo de comprensión. Las tres preguntas son exploratorias y no heredan validación de esos instrumentos. Percepción rápida no prueba disfrute; frustración puede coexistir con motivación; intención no prueba retorno. Sin participantes reales disponibles, quedan pendientes comprensión por idioma y medición del objetivo de menos de un minuto.

## Archivos modificados y creados

| Área | Archivos |
| --- | --- |
| Encuesta | `preguntas.html`, `preguntas-en.html`, `preguntas.js`, `playtest.js`, nuevo `survey.css`, `playtest.css` |
| Resultados | `resultados.html`, `resultados.js`, nuevos `resultados-en.html`, `playtest-legacy.js` |
| Consentimiento | `wishlist/index.html`, `wishlist/en/index.html`, `wishlist.js`, nuevos `retirar-aviso.html`, `retirar-aviso-en.html`, `retirar-aviso.js` |
| Integración | `index.html`, `index-en.html`, `ranking-evento.html` (sólo footer legal), `site.css`, `site-config.json`, `translations.json`, `site-data.js` |
| Herramientas | `tools/generate-site.cjs`, `tools/package-site.cjs` |
| Datos | Nueva migración SQL arriba indicada; SQL históricos sin cambios |
| Legales | Nuevos `privacidad.html`, `privacidad-en.html`, `terminos.html`, `terminos-en.html`, `almacenamiento.html`, `almacenamiento-en.html` |
| Verificación | `tests/validation.cjs`, `tests/database.cjs`, `tests/browser.cjs`, `tests/browser-seo.cjs`, `tests/seo.cjs` |
| Documentación | `context.md`, `AGENTS.md`, `MASTER_PROMPT.md`, `PROMPT_SYSTEM.md`, `LEEME.md`, `PLAYTEST_SETUP.md`, `PLAYTEST_QA.md`; cabecera de vigencia en prompts 00–08; nuevos `INVESTIGACION_PLAYTEST.md`, `LEGAL_PUBLICACION.md`, `SUPABASE_V2_AUDIT.md`, este informe y `tasks/plan.md` / `tasks/todo.md` |

Se conservaron assets, fuentes, `styles.css`, `script.js`, configuración real de Supabase, configuración de Steam y lógica del ranking. No se añadieron dependencias al producto. El cliente CDN existente permanece fijado. Herramientas QA y capturas sólo están en `test-artifacts/`, ignorado por Git y excluido del runtime publicado.

## Pruebas y evidencia

| Comando | Resultado |
| --- | --- |
| `node tests/validation.cjs` | PASS: tres preguntas, categorías, obligatoriedad/opcionalidad, límites y payload anónimo. |
| `node tests/database.cjs` | PASS: SQL exacto, históricos, restricciones, RLS/roles, bcrypt, deduplicación, consentimiento y eliminación. |
| `node tests/browser.cjs` | PASS: errores/reintentos, recarga/idiomas, doble envío, email independiente, token, panel y XSS, Steam y responsive. APIs sintéticas. |
| `node tests/browser-seo.cjs` | PASS: 128 combinaciones de página/tema/ancho; axe sin infracciones, consola limpia, ES/EN, almacenamiento bloqueado, sin JS y motion. |
| `node tests/seo.cjs` | PASS: HTML inicial, metadatos/hreflang/canonical, enlaces, sintaxis y generación idempotente, sin panel en sitemap. |
| `node tools/package-site.cjs` | PASS: runtime estático en `test-artifacts/public`. |
| `git diff --check` | PASS. |

Capturas inspeccionadas: `test-artifacts/before/`, `test-artifacts/visual/survey-390.png`, `survey-1440.png`, `test-artifacts/browser/results-390.png`, y `test-artifacts/seo/` (temas/formularios/legales). El servidor Python local rechazó algunas conexiones durante la suite extensa; la misma suite pasó con servidor estático Node de QA, sin modificar el producto para ocultar errores.

## Checklist antes de publicar

- [x] Encuesta y panel nuevos, consentimiento/retirada, ES/EN, docs y QA locales.
- [x] Acceder al Supabase original y auditar esquema, región, presencia del verificador y conteos sin exponer datos.
- [x] Aplicar la migración y verificar guardado, reintentos, consentimiento, RLS/lecturas denegadas, baja y los 4 históricos intactos. Pruebas ficticias retiradas. Contraseña incorrecta rechazada.
- [ ] Comprobar la contraseña correcta del panel mediante entrada privada, revisar asesores y el procedimiento de respaldos.
- [ ] Completar correo de privacidad atendido y confirmar datos legales/proveedores, transferencias y trámites AAIP que correspondan.
- [ ] Aplicar conservación/eliminación y revisión de logs/backups; cerrar borradores y fijar vigencia real de los documentos.
- [ ] Al preparar el envío manual, consultar la lista vigente, respetar finalidad y bajas, y eliminar copias exportadas cuando no sean necesarias. No requiere integración de correo en la web.
- [ ] Confirmar build del ejecutable, publicar paquete en hosting existente por HTTPS e invalidar cachés. Probar allí rutas, idiomas, móvil, email, retirada y panel. No publicar fuentes SQL/tests/documentación interna.
- [ ] Realizar piloto de comprensión con participantes reales ES/EN, medir tiempo y ajustar si aparecen malentendidos. Mantener advertencias de investigación.

No hay commit, push ni publicación del sitio realizados por esta entrega. La migración de base sí está aplicada. Los archivos quedan en el workspace para revisar y publicar siguiendo estos pasos.
