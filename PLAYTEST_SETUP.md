# Encuesta de tres preguntas — operación y publicación

Estado del 29/10/2026: migración aplicada en el proyecto original `nyrkyrycfabytctgaewz`, organización **Parri**, mediante su SQL Editor con la cuenta del usuario. Las 4 respuestas históricas se conservaron. Emails y encuesta usan este mismo proyecto. Guardado y baja verificados con la API pública y el formulario real; pruebas eliminadas. No se desplegó el sitio en el hosting público.

## Ejecutar y verificar

Desde la raíz: `python -m http.server 8000 --bind 127.0.0.1`. Abrir `http://127.0.0.1:8000/preguntas/`, `/preguntas/en/`, `/wishlist/` o `/resultados/` (este último nunca tiene enlaces públicos).

No hay build de producto. `node tools/generate-site.cjs` regenera preguntas ES/EN, metadatos y páginas traducidas desde `playtest.js`, fuentes HTML, `translations.json` y `site-config.json`. Legales y shells de resultados tienen fuente ES/EN propia. No editar a mano el bloque generado de preguntas ni duplicar sus definiciones.

Comandos de QA:

```powershell
node tests/validation.cjs
$env:PGLITE_MODULE = "$PWD/test-artifacts/qa/node_modules/@electric-sql/pglite"
node tests/database.cjs
node tests/seo.cjs
# Con servidor local en ejecución:
node tests/browser.cjs
node tests/browser-seo.cjs
node tools/package-site.cjs
```

QA usa Node, Edge, Playwright 1.62.1, PGlite 0.5.8 y axe 4.14.0 instalados fuera del producto en `test-artifacts/qa`. Para reproducir desde cero: `npm install --prefix test-artifacts/qa --ignore-scripts --no-audit --no-fund @electric-sql/pglite@0.5.8 playwright@1.62.1 @axe-core/playwright@4.14.0`. `PLAYWRIGHT_MODULE`, `AXE_MODULE`, `BROWSER_CHANNEL`, `TEST_URL` y `SCREENSHOT_DIR` permiten cambiar rutas/entorno. Todas las llamadas browser de QA están interceptadas; no graban pruebas en producción.

## Migración segura

1. Obtener acceso al proyecto exacto. Auditar esquema, políticas, extensión pgcrypto, verificador existente y conteos históricos, sin mostrar emails/secretos en reportes. Ver `SUPABASE_V2_AUDIT.md`.
2. Si es instalación nueva, ejecutar una sola vez `supabase/setup.sql`. La tabla histórica de emails es opcional; la migración no requiere `supabase/launch-notify.sql`. En una existente, no repetir el setup. No cambiar ni publicar la contraseña real.
3. `supabase/migrations/20261029233053_playtest_three_questions_and_consent.sql` **ya está aplicada en el proyecto original: no repetirla**. Es transaccional: crea tablas/RPC v2 y revoca escrituras y permisos públicos de las tablas antiguas; no elimina históricos. Para otra instalación, aplicar una sola vez y coordinar con los archivos estáticos nuevos, pues clientes anteriores dejan de poder enviar. Comprobar conteos antes/después.

   También está aplicada `20261030012521_restrict_legacy_results_role.sql`, que limita el RPC histórico al rol anon previsto, manteniendo su contraseña. En instalaciones nuevas aplicar ambas en ese orden.
4. El verificador bcrypt actual es compartido por los dos paneles. Si falta, generarlo fuera del repositorio con `tools/admin-verifier.py` (bcrypt costo 12); insertar **el hash** mediante terminal/editor seguro en `playtest_private.admin_verifier`. Nunca pegar la contraseña en SQL, código, chat o argumentos.
5. Data API expone `public`, nunca `playtest_private`. No conceder lectura directa para arreglar errores. El navegador sólo usa clave publishable existente. Revisar asesores de seguridad.
6. Verificar con clave pública: GET/PATCH/DELETE y INSERT directo sobre tablas nuevas denegados; RPC de envío válido y su repetición generan una fila; cambios con UUID usado se rechazan; no leer emails ni respuestas. Probar consentimiento y retirada reales con dirección de prueba controlada y eliminarla.
7. Verificar RPC v2 y antiguo con contraseña incorrecta (sin datos) y correcta (datos mínimos). No guardarla en el navegador; recargar/cerrar limpia el panel. Probar builds y red interrumpida.

## Configuración

`playtest-config.js` centraliza URL pública, clave publicable y build. `buildVersion` actual `playtest-2026-10` debe corresponder al ejecutable entregado. No añadir claves privadas. Cliente Supabase CDN fijado en 2.117.2, sin persistencia de autenticación.

`steam-config.js`: conservar vacío hasta disponer de URL real del store. El flujo wishlist sólo redirige a HTTPS de `store.steampowered.com`; las URL de otros hosts se ignoran.

El sitio sólo guarda emails y consentimiento en el mismo proyecto que las respuestas. El equipo enviará el aviso manualmente; no se necesita integrar SMTP, un proveedor de correo ni sus credenciales en la web. El registro depende de que la migración esté aplicada al proyecto configurado. No utilizar históricos como lista consentida.

Para consultar la lista desde el SQL Editor del proyecto, con acceso del propietario:

```sql
select email, language, created_at
from public.launch_notice_consents
where consent and consent_version = 'steam-wishlist-v1'
order by created_at;
```

Los emails son únicos y las bajas eliminan el registro. Consultar la lista vigente cerca del envío, respetar las bajas, enviar sólo el aviso consentido y retirar las copias exportadas cuando dejen de ser necesarias. No publicar esta consulta como RPC ni conceder SELECT al cliente público.

## Publicación

Antes de publicar resolver checklist de `LEGAL_PUBLICACION.md`: correo atendido, identidad/domicilio confirmados, proveedores/región/transferencias, trámites AAIP si corresponden y retención real. Los legales están visibles como borradores y noindex; retirarlo sólo cuando sean definitivos.

`node tools/package-site.cjs` copia exclusivamente runtime público y assets a `test-artifacts/public`. Subir **el contenido** al hosting estático existente, conservando `/wishlist/`, fuentes, JS, CSS y rutas HTML. No publicar SQL, herramientas, tests, docs ni recibos de prueba. No se eligió otro hosting ni se hizo deploy.

Usar HTTPS; servir JS con MIME correcto; conservar robots/sitemap/canonical. No reescribir páginas a index. Si hay CSP permitir jsDelivr y conexiones al proyecto HTTPS. Evitar caché permanente del HTML/configuración e invalidar al publicar. No poner RPC de resultados detrás de caché pública. Recuperación local usa sessionStorage: UUID/estado, respuestas pendientes y, en otra clave, email/token pendiente; se borra contenido pendiente al confirmar. En almacenamiento bloqueado sólo se recupera dentro de la página abierta.

Reversión: restaurar archivos previos sólo si también se restaura explícitamente el permiso de escritura anterior revisado. No borrar tablas v2 ni filas para revertir. Se puede dejar todo protegido, deshabilitar el CTA y conservar resultados mientras se corrige. La migración no tiene rollback destructivo automático.

Finalmente repetir en hosting real: idiomas, enlaces legales, mobile/teclado, envío, error/reintento, recibo y retirada, panel nuevo/histórico, contraseña y ausencia de lectura pública. PGlite y las APIs simuladas no acreditan este último paso.
