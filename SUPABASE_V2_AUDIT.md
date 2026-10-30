# Supabase: encuesta de tres preguntas y consentimiento

Fecha de revisión: 29 de octubre de 2026. Proyecto original configurado: `nyrkyrycfabytctgaewz`, organización **Parri**, región **us-west-2 (Oregon, EE. UU.)**. Migración aplicada y guardado de emails verificado en ese proyecto.

## Alcance real de la auditoría

Se revisaron `supabase/setup.sql`, `supabase/launch-notify.sql`, el contrato del cliente y las pruebas SQL existentes. La instalación documentada usa RLS, permisos de inserción por columnas y un RPC de resultados que valida bcrypt en el servidor. Los datos anteriores no tienen una restricción de deduplicación por sesión; los emails históricos permiten direcciones repetidas y no guardan evidencia de consentimiento específico.

El conector Supabase disponible no incluye el proyecto configurado y denegó el acceso. El usuario inició sesión con su cuenta en el Dashboard del proyecto original y se continuó por su SQL Editor. Se confirmaron 4 respuestas históricas, pgcrypto en `extensions`, RLS y la presencia del verificador de administración, sin leer ni cambiar su hash. No se consultaron ni modificaron proyectos ajenos.

## Migración aplicada y verificada

`supabase/migrations/20261029233053_playtest_three_questions_and_consent.sql` fue creado mediante CLI y ejecutado en PostgreSQL/WASM y en el SQL Editor del proyecto original. Requiere `setup.sql`; la tabla histórica `launch_notify_signups` es opcional, pues no existía en este proyecto. Se añadió una prueba para ese caso antes de aplicar. No volver a ejecutar la migración en el proyecto original. Su aplicación fue manual por SQL Editor, sin registrar una nueva entrada mediante CLI/MCP.

La migración es transaccional. Crea tablas independientes y conserva las 4 filas y el RPC de resultados históricos. Cierra inserciones antiguas y revoca los permisos públicos amplios de la tabla histórica que se encontraron en el proyecto, incluidos sus permisos de INSERT por columnas. No convierte respuestas anteriores ni les atribuye nuevas dimensiones. No convierte emails históricos en consentimientos.

Al revisar Advisor Center se encontró además que el RPC histórico tenía EXECUTE para `authenticated`. Se aplicó la migración separada `20261030012521_restrict_legacy_results_role.sql` (timestamp UTC generado por CLI): conserva función, verificador y datos, y deja únicamente EXECUTE a `anon`, igual que el acceso por contraseña previsto. Comprobación real: anon `true`, authenticated `false`, PUBLIC sin concesión directa y 4 históricos. Los avisos sobre RPC `SECURITY DEFINER` accesibles a `anon` corresponden a las entradas públicas deliberadas: escritura validada, retirada por token y lectura por contraseña, sin SELECT público de tablas.

### Respuestas nuevas

`public.playtest_responses_v2` guarda UUID de sesión único, fecha del servidor, build, `perceived_time_flow` (1–5), `post_session_feeling` (cinco categorías independientes) y `memorable_moment` (opcional, máximo 1200 caracteres Unicode). No contiene datos de identidad.

`submit_playtest_v2(p_session_id, p_build_version, p_perceived_time_flow, p_post_session_feeling, p_memorable_moment)` devuelve `void`. Repetir el mismo UUID y respuestas es idempotente. Un intento de cambiar las respuestas de un UUID ya guardado falla sin sobrescribirlo. La protección evita duplicar reintentos; no identifica personas ni impide que alguien use otro navegador o UUID para responder otra vez.

`playtest_results_v2(admin_password)` reutiliza el verificador bcrypt privado y devuelve sólo fecha, build y las tres respuestas. No devuelve UUID, ID, emails ni hashes. El RPC histórico `playtest_results(admin_password)` permanece separado e intacto.

### Consentimiento independiente

`public.launch_notice_consents` guarda email normalizado único, idioma, fecha del servidor, consentimiento afirmativo, versión de finalidad `steam-wishlist-v1` y hash SHA-256 del token de retiro. No tiene UUID de sesión, identificador de respuesta ni relación con la encuesta.

`subscribe_launch_notice(p_email, p_language, p_consent_version, p_consent, p_withdrawal_token)` requiere consentimiento `true`, la versión exacta y un token de 32 bytes aleatorios codificado como 64 caracteres hexadecimales minúsculos. El servidor sólo guarda su hash. El RPC devuelve `void` tanto para un alta nueva como para un email ya registrado, evitando un endpoint de consulta de direcciones.

Un duplicado conserva el token original. Reemplazarlo al volver a introducir un email permitiría que un tercero que conozca esa dirección obtuviera autorización para borrarla. El formulario debe explicar que, si la dirección ya estaba anotada, sigue vigente el enlace original. Si se pierde ese enlace, la recuperación/eliminación exige un canal del responsable con verificación adecuada de titularidad; no puede resolverse publicando un buscador de emails.

`revoke_launch_notice(p_withdrawal_token)` elimina sólo el registro cuyo hash coincide. Devuelve el mismo resultado para tokens desconocidos y ya utilizados. El enlace debe usar un fragmento URL, sin incluir el token en la consulta o en registros del servidor web, y requerir una acción expresa de retiro. El token es una capacidad de borrado: quien lo posea puede retirar ese consentimiento.

El alcance acordado es registro y retirada en la base; el equipo enviará el único aviso manualmente. No se necesita integrar un proveedor de correo en el sitio. Consultar sólo consentimientos vigentes, respetar bajas y finalidad, y no reutilizar emails históricos sin evidencia suficiente. La consulta del propietario está en `PLAYTEST_SETUP.md`.

## Controles de acceso

Ambas tablas nuevas tienen RLS activo y carecen de políticas/grants para acceso directo público. `anon` sólo ejecuta los cuatro RPC previstos; `authenticated` y `PUBLIC` no reciben EXECUTE. Las funciones definidoras tienen `search_path = ''`, referencias de esquema explícitas y salidas mínimas. No se usaron claves privilegiadas en el navegador.

La ausencia de políticas en estas tablas es deliberada: todo acceso público directo debe fallar. El RPC de envío necesita privilegios de definición para resolver la deduplicación sin conceder SELECT al cliente. No agregar políticas públicas de lectura para resolver errores del frontend.

## Pruebas ejecutadas

```powershell
$env:PGLITE_MODULE='D:\Git\Parrilla40-Web\test-artifacts\qa\node_modules\@electric-sql\pglite'
node tests/database.cjs
```

Resultado: PASS. Se ejecutaron los SQL originales y la migración exacta con roles `anon` y `authenticated`, además de fixtures históricos. Las pruebas comprobaron límites y valores, texto opcional y Unicode, UUID/reintentos, rechazo de sobrescritura, conservación de históricos, consentimiento específico, deduplicación, hashes, retiro válido/repetido/ajeno, cierre de inserciones antiguas, bloqueo de lectura/edición/borrado directo, RLS aun ante un grant de SELECT accidental, acceso privado con y sin verificador, contraseña correcta/incorrecta/nula/larga, campos mínimos y concesiones de las funciones.

Además se verificó el proyecto real: la API pública guardó un email reservado de QA, aceptó su reintento sin duplicarlo, rechazó consentimiento falso y negó lectura pública. El formulario real `/wishlist/` confirmó otra alta y su baja. Ambos registros se eliminaron mediante sus tokens. Se probó el envío de encuesta como `anon`, con repetición idempotente y rollback para no dejar respuestas ficticias. Estado final: 4 históricos, 0 respuestas nuevas y 0 emails, RLS activo y sin SELECT público en las tres tablas. Contraseña incorrecta del panel rechazada; la correcta no se solicitó ni capturó durante esta conexión. Evidencia en `test-artifacts/live-database-verified.png`.

## Orden de publicación y comprobaciones externas

1. Conectar la cuenta con acceso al proyecto configurado. Inspeccionar tablas, políticas, permisos de columna, funciones, esquema de pgcrypto y presencia del verificador sin extraer su valor. Confirmar región/proveedores para la política de privacidad y obtener un respaldo adecuado.
2. Revisar la migración contra ese esquema. Aplicarla completa **una sola vez** mediante migración/SQL Editor con permisos de propietario. Mantener `playtest_private` fuera de los esquemas expuestos por Data API; exponer únicamente las funciones requeridas en `public`.
3. Publicar inmediatamente los HTML/JS/CSS nuevos y purgar la caché de formularios/configuración. Entre el SQL y el nuevo frontend, los formularios viejos mostrarán un error recuperable porque se cerraron sus escrituras. Programar ambas acciones en la misma ventana.
4. Con clave pública, comprobar que GET/PATCH/DELETE e inserciones directas sobre las tablas fallan sin devolver datos; probar ambos RPC de resultados con contraseña inválida y con la real fuera del chat/historial.
5. En una base de prueba real, enviar formulario, repetir el mismo UUID/payload y confirmar una sola fila; probar otra build, alta/reintento, retiro y separación de datos. Evitar contaminar resultados reales con datos de QA.
6. Ejecutar asesores de Supabase y revisar resultados: [asesores de base de datos](https://supabase.com/docs/guides/database/database-advisors). Completar los pendientes legales y el proveedor de correo antes de anunciar avisos funcionales.

Si se revierte el frontend, conservar las tablas y filas nuevas. Puede congelarse temporalmente la nueva escritura revocando EXECUTE de `submit_playtest_v2` y `subscribe_launch_notice` para `anon`; no bloquear el retiro de consentimientos. Para restaurar clientes históricos se deben restaurar expresamente sólo sus antiguos grants de INSERT por columnas después de revisar el alcance legal; nunca volver a ejecutar `setup.sql` ni borrar tablas para hacer rollback. Rehabilitar la versión nueva exige devolver sólo sus grants documentados de EXECUTE.

Fuentes técnicas consultadas: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [funciones y privilegios](https://supabase.com/docs/guides/database/functions), [changelog oficial](https://supabase.com/changelog). La consulta de changelog no identificó un cambio que exija modificar este contrato; la retirada anunciada de cifrados TLS 1.2 antiguos requiere navegadores/sistemas mantenidos, sin alterar el SQL preparado.
