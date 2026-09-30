# Playtest V1 — ejecución y conexión

Implementación estática, sin build ni servidor de aplicación. La conexión al proyecto Supabase y el despliegue se pospusieron por indicación del usuario. Los campos de configuración permanecen vacíos intencionalmente: no se simula un envío exitoso en el producto.

## Ejecutar localmente

Desde PowerShell en este equipo:

```powershell
cd D:\Git\Parrilla40-Web
& 'C:\Users\carge\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -m http.server 8000 --bind 127.0.0.1
```

En otro equipo con Python instalado: `python -m http.server 8000 --bind 127.0.0.1` desde la raíz del repositorio.

- Inicio: <http://127.0.0.1:8000/index.html>
- Encuesta: <http://127.0.0.1:8000/preguntas.html>
- Acceso privado, sólo mediante URL: <http://127.0.0.1:8000/resultados.html>

El cliente oficial Supabase está fijado a `2.117.2` por CDN; las páginas nuevas requieren conexión para cargarlo y para enviar/consultar datos. No usar `file://` para validar la integración. Sin configuración, se puede completar y validar la encuesta, pero enviar/consultar muestra un error recuperable.

## Conectar Supabase una vez

1. Confirmar el proyecto destinado a Parrilla Rutera. No reutilizar un proyecto ajeno por conveniencia. Hacer primero la prueba en un proyecto de desarrollo.
2. Abrir su SQL Editor como `postgres`. Comprobar dónde está `pgcrypto`:

   ```sql
   select n.nspname from pg_extension e
   join pg_namespace n on n.oid = e.extnamespace
   where e.extname = 'pgcrypto';
   ```

   Debe devolver `extensions` o ninguna fila. El setup lo instala si falta. Si está en otro esquema, adaptar las referencias `extensions.crypt` y `extensions.gen_salt` al esquema confirmado; no mover una extensión usada por otras funciones sin revisar sus dependencias.
3. Ejecutar completo `supabase/setup.sql` **una sola vez**. Es transaccional y falla ante objetos preexistentes, sin sobreescribirlos. Crea la tabla, restricciones, esquema privado, tabla del verificador, RLS y RPC. No repetirlo sobre una instalación existente; aplicar cambios futuros mediante migraciones específicas.
4. Configurar la contraseña acordada fuera del repositorio. Generar el hash localmente en una terminal privada (la contraseña se pide sin eco):

   ```powershell
   python -m venv "$env:TEMP\parrilla-admin"
   & "$env:TEMP\parrilla-admin\Scripts\python.exe" -m pip install bcrypt==5.0.0
   & "$env:TEMP\parrilla-admin\Scripts\python.exe" tools/admin-verifier.py
   ```

   En este equipo se puede sustituir el primer `python` por la ruta completa del comando de ejecución local. La herramienta imprime **sólo el hash bcrypt** con costo 12. No pasar la contraseña como argumento, no guardarla en archivos, historial de terminal, SQL Editor ni chats. Bcrypt admite hasta 72 bytes UTF-8; no se truncan contraseñas largas.
5. En el SQL Editor del proyecto confirmado, sustituir el marcador siguiente por el **hash generado**, nunca por la contraseña:

   ```sql
   insert into playtest_private.admin_verifier (singleton, password_hash)
   values (true, 'PEGAR_HASH_BCRYPT_AQUI')
   on conflict (singleton) do update set password_hash = excluded.password_hash;
   ```

   El mismo procedimiento sirve para cambiar la contraseña. El marcador no satisface el CHECK y no puede habilitar acceso accidentalmente. No publicar el hash. Sin verificador, el RPC rechaza todo acceso.
6. En la configuración Data API del proyecto, habilitar la API y exponer `public`. **No exponer `playtest_private`**. Mantener las concesiones del setup: `anon` sólo inserta las columnas de respuestas y ejecuta el RPC; no tiene SELECT, UPDATE, DELETE ni TRUNCATE. `authenticated` tampoco accede a estos objetos.
7. En `playtest-config.js`, completar únicamente:

   - `supabaseUrl`: URL HTTPS del proyecto confirmado.
   - `supabasePublicKey`: clave publishable (o legacy anon), nunca clave privada/service role.
   - `buildVersion`: identificador real de la build probada, de 1 a 100 caracteres. Se cambia sólo aquí.

8. Ejecutar las comprobaciones reales del apartado siguiente antes de publicar. No habilitar SELECT para resolver errores de inserción: el cliente inserta sin pedir filas de vuelta.

## Verificación de la conexión real

Con el sitio servido y el proyecto de desarrollo configurado:

1. Enviar una encuesta completa y comprobar en SQL Editor la fila: 15 respuestas, UUID de sesión, build correcta y `created_at` generado por la base.
2. Con la clave pública, realizar GET, PATCH y DELETE sobre `/rest/v1/playtest_responses`. Deben fallar por permisos y no devolver datos. No usar una clave privilegiada para esta prueba.
3. Abrir resultados directamente. No debe haber solicitudes de datos antes del submit. Una contraseña incorrecta debe devolver `P0001` sin filas; la correcta debe mostrar resultados.
4. Revisar permisos y configuración:

   ```sql
   select relrowsecurity from pg_class
   where oid = 'public.playtest_responses'::regclass;
   select cmd, roles from pg_policies
   where schemaname = 'public' and tablename = 'playtest_responses';
   select has_table_privilege('anon','public.playtest_responses','SELECT') as can_select,
          has_table_privilege('anon','public.playtest_responses','UPDATE') as can_update,
          has_table_privilege('anon','public.playtest_responses','DELETE') as can_delete;
   select prosecdef, proconfig from pg_proc
   where oid = 'public.playtest_results(text)'::regprocedure;
   ```

   Esperado: RLS `true`, única política `INSERT` para `anon`, tres permisos `false`, función definidora con `search_path` vacío. El permiso de INSERT es por columnas, no un permiso global de tabla.
5. Revisar los asesores de seguridad de Supabase. Validar permisos de la función y que el esquema privado no sea accesible por API.
6. Bloquear la solicitud de envío en DevTools y verificar respuestas conservadas, error y reintento. Refrescar resultados: debe volver al acceso por contraseña. Verificar también desde móvil y con teclado.

El RPC devuelve un único array JSON, evitando que el límite de filas de PostgREST recorte silenciosamente los totales. Excluye ID y UUID de sesión. Los resultados sólo quedan en memoria y DOM durante la sesión; cerrar, navegar o recargar los limpia. La contraseña viaja únicamente en el cuerpo HTTPS del RPC. No se guarda en almacenamiento del navegador ni se compara con una constante local.

Los textos tienen un máximo visible de 4000 caracteres por respuesta, validado también en la base; no hay truncamiento silencioso. La noche máxima usa el límite de almacenamiento de PostgreSQL `integer` (2147483647), no un límite inventado del juego. Un reintento después de una pérdida de conexión justo tras guardar puede generar otra fila; V1 bloquea envíos concurrentes, no implementa deduplicación entre solicitudes.

## Publicación con el modelo existente

El repositorio sólo documenta subir archivos a un hosting estático. No tiene workflow, dominio ni proveedor configurado verificable; no se eligió otro proveedor ni se desplegó infraestructura.

1. Conectar y verificar primero Supabase según lo anterior.
2. Actualizar `buildVersion` para la build del playtest y revisar que no haya secretos.
3. Subir al mismo directorio público del hosting existente, conservando rutas relativas:

   ```text
   index.html
   styles.css
   script.js
   preguntas.html
   preguntas.js
   resultados.html
   resultados.js
   playtest.css
   playtest.js
   playtest-config.js
   assets/ (completo)
   fonts/ (completo)
   ```

   No hay comando de build. No es necesario publicar `supabase/`, `tools/`, `tests/`, `prompts/` ni documentos internos. Si el hosting publica el repositorio completo, estos archivos tampoco contienen secretos; no agregar allí el verificador.
4. Usar HTTPS. Si existe CSP, permitir scripts desde `https://cdn.jsdelivr.net`, conexiones al URL HTTPS del proyecto y recursos locales. Servir `.js` con MIME JavaScript; no reescribir las dos páginas a `index.html`.
5. Evitar caché permanente de HTML y `playtest-config.js`; invalidar su caché tras una actualización. Si el hosting admite cabeceras por ruta, usar `Cache-Control: no-store` para las respuestas del RPC; no poner la API detrás de una caché pública.
6. Probar en la URL publicada: CTA, acceso directo a `preguntas.html`, envío real, acceso directo a `resultados.html`, contraseña incorrecta/correcta, filtro si existen varias builds, recarga, teclado y móvil. El panel no debe aparecer en navegación ni sitemap.

La verificación en hosting y Supabase reales queda pendiente hasta conectar ambos servicios.

## Pruebas locales reproducibles

Sin dependencias: `node tests/validation.cjs`.

Las herramientas opcionales de QA se instalan fuera del producto; no hay bundler ni dependencias npm en el sitio. Con Node y Edge instalados:

```powershell
npm install --prefix "$env:TEMP\parrilla-playtest-qa" --ignore-scripts --no-audit --no-fund @electric-sql/pglite@0.5.8 playwright@1.62.1
$env:PGLITE_MODULE="$env:TEMP\parrilla-playtest-qa\node_modules\@electric-sql\pglite"
$env:PLAYWRIGHT_MODULE="$env:TEMP\parrilla-playtest-qa\node_modules\playwright"
node tests/database.cjs
# Con el servidor local iniciado en otra terminal:
node tests/browser.cjs
```

`BROWSER_CHANNEL=chrome` permite usar Chrome. `TEST_URL` cambia la URL local. `SCREENSHOT_DIR` apunta a una carpeta existente para capturas. Las pruebas de navegador interceptan configuración y API con datos sintéticos: nunca envían a un proyecto real. Las pruebas SQL ejecutan el archivo real en PostgreSQL/WASM con pgcrypto, recreando los roles de Supabase; no sustituyen la prueba final de su Data API.

Referencias: [cliente oficial Supabase](https://supabase.com/docs/reference/javascript/installing), [funciones y permisos](https://supabase.com/docs/guides/database/functions), [extensiones de PGlite](https://pglite.dev/extensions/).
