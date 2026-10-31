# Parrilla 40 — playtest de tres preguntas

Especificación vigente desde el pedido del 29 de octubre de 2026. Sustituye definitivamente el cuestionario anterior de 16 preguntas. Los registros anteriores se preservan como históricos; no se mezclan con el nuevo instrumento.

## Producto y límites

Sitio estático HTML, CSS y JavaScript vanilla. Sin frameworks, bundler, backend propio ni rediseño de la home. La home sólo recibe el CTA de encuesta, enlaces legales y microcopy necesario para no prometer un envío de email sin integración. Conservar navegación, ES/EN, SEO, temas, assets y futura redirección segura a Steam.

Investigar señales indirectas de involucramiento, sensación al terminar y recuerdos espontáneos del ciclo de juego. No preguntar directamente por diversión ni crear un índice que sume dimensiones. La intención declarada no equivale a retención real. No se presenta el cuestionario como escala científicamente validada.

## Cuestionario exacto

Única definición en `playtest.js`; el generador produce el HTML ES/EN estático.

1. **¿Cómo sentiste que pasó el tiempo mientras jugabas?** Campo `perceived_time_flow`, selección única obligatoria. Valores 1..5: Se me hizo muy largo. / Se me hizo algo largo. / Ni rápido ni lento. / Pasó bastante rápido. / Se me pasó volando.
2. **Cuando terminaste de jugar, ¿con qué sensación te quedaste?** Campo `post_session_feeling`, selección única obligatoria. Categorías nominales: `another_night` (Me quedé con ganas de jugar otra noche.), `retry_better` (Me quedé con ganas de volver a intentar para hacerlo mejor.), `enough_for_now` (Sentí que había jugado suficiente por el momento.), `prefer_stop` (Prefería dejar de jugar.), `unsure` (No sabría decir.). Mantenerlas separadas, sin puntuación artificial.
3. **¿Qué momento de la partida recordás más y por qué?** Campo `memorable_moment`, texto opcional de hasta 1200 caracteres. Ayuda: “Puede ser algo que te gustó, te frustró o te aburrió. Contanos qué pasó.” Sin sugerencias concretas de mecánicas, sin pedir identidad.

Las traducciones conservan el mismo significado. No se agregan preguntas, perfiles, demografía ni email dentro de la encuesta.

## Experiencia y envío

`/preguntas/` / `/preguntas/en/`: una página con tres preguntas visibles, controles nativos, estados seleccionados, foco visible, errores junto al campo, un envío principal y agradecimiento después de confirmación real.

- Usar fuentes, colores, sprites y gramática del juego. Diseño de comanda breve, sin ocultar preguntas del formulario anterior.
- Q1/Q2 obligatorias; Q3 puede quedar vacía y se guarda `null`.
- Sin solicitudes al backend por cargar la encuesta.
- UUID aleatorio anónimo por sesión de envío, fecha del servidor, build configurada sólo en `playtest-config.js`.
- Bloquear envíos concurrentes. Conservar el mismo UUID y snapshot pendiente ante errores o recarga/cambio de idioma para reintento idempotente.
- Tras un envío incierto, bloquear edición del snapshot y permitir reintentar el mismo envío. No dar éxito hasta confirmar.
- `sessionStorage` temporal guarda snapshot pendiente; se elimina al confirmar y conserva sólo ID/estado. Si está bloqueado, recuperación sólo en memoria de la página. No garantiza evitar duplicados entre navegadores/pestañas independientes.
- Sin datos privados en consola ni mensajes de error técnicos al jugador.

## Datos y seguridad

Migración aditiva en `supabase/migrations/20261029233053_playtest_three_questions_and_consent.sql`, posterior al setup histórico.

- Tabla nueva `playtest_responses_v2`, restricciones estructuradas y UUID único. Histórica `playtest_responses` intacta.
- API pública escribe exclusivamente mediante `submit_playtest_v2`; no SELECT/INSERT/UPDATE/DELETE directos en tablas nuevas. RLS habilitada y sin políticas públicas.
- Mismo UUID y payload: confirmación idempotente; UUID existente y payload distinto: rechazar sin sobrescribir.
- Panel vía `playtest_results_v2(admin_password)`; historial vía RPC anterior `playtest_results`.
- Validación bcrypt del lado servidor usando verificador existente. Nunca contraseña hardcodeada ni clave privilegiada en navegador. `SECURITY DEFINER` con `search_path` fijo vacío y sólo EXECUTE a anon para funciones requeridas.
- No devolver UUID/id ni email en resultados de investigación. No exponer esquema privado. Revocar escrituras antiguas sin borrar registros al migrar.

## Panel privado

`/resultados/` / `/resultados/en/`, sin links públicos y `noindex`. Acceder por URL no devuelve datos. Elegir fuente actual o histórica y validar contraseña para cada consulta. Contraseña y datasets sólo en memoria, se limpian al cerrar, recargar o navegar.

Mostrar total, distribución completa del tiempo, cinco sensaciones separadas, porcentajes continuar y reintentar por separado con n/N, textos opcionales y comparación descriptiva por build con n. Filtrar distribuciones/comentarios por build. No inferir causalidad, significación, diversión ni retención por diferencias pequeñas. Históricos conservan métricas originales y aviso de no comparabilidad.

## Email independiente

Sólo después del éxito de encuesta y en `/wishlist/` / `/wishlist/en/`. Formulario independiente, email + consentimiento específico sin preselección para un único aviso de disponibilidad de wishlist Steam. Enlace de privacidad y textos breves. El sitio sólo registra los emails; el equipo enviará el aviso manualmente más adelante. No se necesita integrar un proveedor de envío en la web.

- Nueva tabla `launch_notice_consents`, email único, idioma, versión/aceptación de consentimiento y fecha, sin ID de encuesta/sesión ni clave de unión.
- Los emails se guardan en el mismo proyecto Supabase que las respuestas, configurado en `playtest-config.js`, pero en su tabla separada. No crear ni utilizar un proyecto de otra cuenta para este flujo.
- RPC `subscribe_launch_notice` con token aleatorio de 256 bits generado por cliente; base sólo almacena hash SHA-256. Respuesta uniforme y sin enumerar emails.
- Duplicado conserva el token original, nunca permite sustituir autoridad de retirada con sólo conocer un email. UI explica conservar enlace original.
- Durante petición incierta, email/token se mantienen en una clave de sessionStorage aparte para reintentar tras recarga. Se eliminan del almacenamiento al confirmar. Recibo con link privado y descarga .txt.
- `/retirar-aviso/` / `/retirar-aviso/en/` reciben token en fragmento, sin query/email ni referrer. Cargar el enlace no elimina nada; botón llama RPC `revoke_launch_notice` para eliminar el registro. Respuesta uniforme para token válido, desconocido o ya retirado.
- Sin token, canal atendido de privacidad con verificación proporcional de titularidad (externo pendiente). No reutilizar lista histórica sin base/consentimiento verificado. No enviar ni prometer promociones adicionales.
- La lista para el envío manual sólo se consulta con acceso del propietario en Supabase; no se agrega un endpoint público de exportación. Respetar las bajas y la finalidad del aviso al usarla.

## Legales y publicación

Privacidad, términos y cookies/almacenamiento en ES/EN, enlazados en formularios y footers. No banner de cookies: no hay analytics ni tecnologías de seguimiento agregadas. Explicar almacenamiento real, proveedores, logs técnicos, transferencias, conservación y derechos según fuentes argentinas vigentes.

Responsable informado por usuario: **Parrilla40.SA**, **Av gelly y obes 2267, Recoleta, CABA, 1425, Argentina**. No inventar CUIT, correo, hosting, región ni proveedor de envío. Faltan correo atendido y verificaciones operativas; legales quedan borrador/noindex y publicación pendiente. Ver `LEGAL_PUBLICACION.md`.

Conservación propuesta: encuesta e históricos 12 meses; email hasta aviso+30 días o máximo 12 meses, antes si retira. Requiere procedimiento real y revisar backups. No se afirma que la purga está automatizada.

## Validación y fuentes

`INVESTIGACION_PLAYTEST.md`: GUR, PXI, GEQ y Schell Games, sesgos y protocolo de comprensión. Sin participantes reales disponibles: validación empírica y objetivo de menos de un minuto pendientes.

`PLAYTEST_QA.md` y tests: validación, SQL/roles, envío válido/omitidos/red/reintento/doble clic, passwords correctos/incorrectos/directo, no lecturas públicas, histórico, XSS, consentimiento/retirada, mobile/desktop, temas, teclado, consola, ES/EN y SEO. No sustituir verificación del proyecto Supabase y hosting reales por fixtures locales.
