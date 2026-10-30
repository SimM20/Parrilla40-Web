# Verificación de la encuesta de tres preguntas — 29/10/2026

Implementación local y Supabase original verificados. Migración aplicada mediante SQL Editor en `nyrkyrycfabytctgaewz` (organización Parri). Guardado real de emails, reintentos, consentimiento, lectura denegada y baja aprobados. Las 4 respuestas históricas se conservaron y no quedaron datos de QA. Hosting público pendiente. No hubo participantes reales nuevos ni envío de correo.

## Pruebas reproducibles

- `node tests/validation.cjs`: exactamente tres campos, dos obligatorios, recuerdo opcional/null, todas las categorías, texto 1200/1201, Unicode, sin email en answers, validación de email y sin links públicos a resultados.
- `node tests/database.cjs`: PostgreSQL/PGlite 0.5.8 y SQL real, fixtures históricos preservados, metadatos y restricciones, UUID idempotente/conflicto, no SELECT/INSERT directo/UPDATE/DELETE públicos, RLS incluso ante concesión SELECT accidental, verificador correcto/incorrecto/ausente, payload mínimo, consentimiento explícito/versionado, emails únicos, token duplicado sin tomar control del registro, retirada y repetición, búsqueda fija y privilegios mínimos. Ver auditoría Supabase.

La prueba SQL incluye el esquema real sin `launch_notify_signups`, permisos de tabla heredados más amplios y el cierre del permiso `authenticated` del RPC histórico mediante la segunda migración. Los casos fallaron antes de corregir las migraciones y pasan después. El ajuste de roles también se verificó en el proyecto real sin cambiar su verificador ni sus 4 respuestas.
- `node tests/browser.cjs`: Edge + Playwright 1.62.1, APIs sintéticas. Obligatorios vacíos, texto opcional, error/red/duplicación clic, reintento idéntico y recuperación tras recarga/cambio de idioma; éxito independiente de email; consentimiento sin marcar, errores/email conservado/token reutilizado; baja por botón, nunca al cargar URL; panel cerrado directo, passwords, error/red/payload inválido, vacío, 1200 filas, métricas/distribuciones, filtro, históricos, XSS como texto, cierre/recarga. ES/EN, cuatro anchos y futuro redirect Steam.
- `node tests/browser-seo.cjs`: 16 páginas, dos temas, cuatro anchos (320/390/768/1440), 128 combinaciones sin overflow; axe WCAG A/AA, consola, equivalencia ES/EN, localStorage bloqueado/tema sistema, motion reducido, contenido estático sin JS, PNG fallback y 404. Incluye seis legales y dos páginas de retirada.
- `node tests/seo.cjs`: tres preguntas estáticas en ambos idiomas, metadatos actuales, hreflang recíproco, JSON-LD, canonical, sitemap sin panel privado, assets, sintaxis y generación idempotente.
- `node tools/package-site.cjs`: empaquetado de runtime, sin documentación/SQL/tests.

## Revisión visual y correcciones

Capturas anteriores en `test-artifacts/before`, nueva encuesta en `test-artifacts/visual`, panel en `test-artifacts/browser`, temas y legales en `test-artifacts/seo`. Tipografías Bungee/Nunito, carbón y ruta existentes; nuevo formulario de comanda con selección textual y radio nativo, sin reutilizar trece preguntas ocultas. La home conserva composición y comportamiento, con CTA/legal y copy de avisos actualizado.

La revisión independiente detectó pérdida del snapshot/autoridad de retirada ante recarga después de timeout: se corrigió persistiendo sólo la operación pendiente en sessionStorage y borrándola al confirmar. Axe detectó mismatch de nombre visible/accesible de links de idioma en legales; corregido con prefijo EN/ES. El generador inserta el favicon faltante en una posición estable para evitar cambios entre ejecuciones.

Resultado final: PASS en los cinco comandos de pruebas y empaquetado. En la auditoría extensa, el servidor Python de QA rechazó algunas conexiones de recursos locales. Se completó la misma suite sin cambios de producto con un servidor estático Node local de QA (no incluido en el producto): 128 combinaciones aprobadas, cero infracciones axe y consola limpia.

## Límites y pendiente real

- Las suites reproducibles usan fixtures. Se completó además una verificación real de Data API y el formulario de email, con limpieza posterior. Falta repetir el flujo en el hosting publicado y probar la contraseña correcta del panel sin compartirla por chat; su verificador existente no se modificó.
- Históricos reales: 4 antes y después. La tabla histórica de emails no existía, caso cubierto por una nueva prueba de migración. Región del proyecto confirmada: us-west-2.
- No puede prometerse identidad única sin identificar jugadores: UUID evita duplicar una operación y la pestaña recuerda el éxito; otra pestaña/navegador puede generar otro UUID.
- Tras envío incierto, respuestas se bloquean para reenviar snapshot idéntico. Sin sessionStorage, recarga pierde recuperación; se conserva durante la página abierta. El recibo de retirada debe guardarse/descargarse.
- Email aún sin envío, sin validación de propiedad por correo. Las listas anteriores quedan apartadas. Falta canal de privacidad atendido para recuperar bajas sin token.
- Legales son borradores con retención propuesta, pendientes operativos y fuentes en `LEGAL_PUBLICACION.md`.
- Menos de un minuto es objetivo, no medición observada. Comprensión con usuarios reales ES/EN y validez empírica pendientes; no se afirma escala validada ni retención real. Ver `INVESTIGACION_PLAYTEST.md`.
