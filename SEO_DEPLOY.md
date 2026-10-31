# Publicación SEO — Parrilla 40

Dominio confirmado por el propietario: **https://parrilla40.com.ar/**, sin `www`.
No se modificaron DNS, infraestructura, producción ni ninguna propiedad de Google.
El hosting efectivo no está declarado en el repositorio. El acceso público no pudo confirmarse desde la herramienta de consulta web.

## Archivos y mantenimiento

1. Editar la landing española en `index.html` y la introducción de la encuesta en `preguntas/index.html`.
2. Mantener las 15 preguntas/opciones en **un solo lugar**, `playtest.js`. Los valores almacenados no dependen del idioma.
3. Actualizar `translations.json` si cambia texto. El generador rechaza textos de la landing sin traducción.
4. Cambiar dominio, títulos o descripciones en `site-config.json` y ejecutar:

   ```powershell
   node tools/generate-site.cjs
   node tests/validation.cjs
   node tests/seo.cjs
   node tools/package-site.cjs
   ```

5. Publicar el **contenido** de `test-artifacts/public` en la raíz del hosting existente.
   Incluye HTML ES/EN, páginas privada/404, CSS, JS, sitemap, robots, fuentes e imágenes.
   No publicar `test-artifacts/qa`, pruebas, herramientas, SQL ni documentos internos.
   No hay instalación npm ni ejecución de Node en producción.

`en/index.html`, `preguntas/en/index.html`, los bloques SEO, el cuestionario HTML y `site-data.js` son salidas de autoría guardadas en Git.
No editar esas salidas directamente: se sobrescriben al regenerar. Las etiquetas e instrucciones ES/EN se traducen; nunca se traducen las respuestas escritas por los participantes.

Los originales PNG/TTF se conservan. Para regenerar derivados, usar Python con Pillow 12.3.0,
fonttools 4.67.0 y brotli 1.2.0, ejecutar `python tools/optimize-assets.py` y luego el generador.
Estas herramientas no forman parte del sitio. `tools/optimize-assets.py` contiene la composición reproducible de las imágenes sociales.

## Contrato del hosting

| Petición | Comportamiento requerido |
|---|---|
| `https://parrilla40.com.ar/` | 200, HTML español |
| `/en/`, `/preguntas/`, `/preguntas/en/` | 200, HTML de la página solicitada |
| HTTP o `www` | 301 directo a la misma ruta en HTTPS sin `www`; conservar parámetros |
| `/index.html` | 301 directo a `https://parrilla40.com.ar/`, también si la petición viene por HTTP/www |
| URL inexistente | **404 real**, mostrando `404.html`; nunca reescribir todo a un inicio con 200 |
| `/resultados/` | Shell estático con `noindex`; sin datos hasta validar la contraseña mediante RPC |
| `/preguntas.html` y demás direcciones `.html` anteriores | Redirigen a la carpeta equivalente conservando parámetros y `#token` (`deploy/apache.htaccess` usa 301) |
| `/robots.txt` | 200, `text/plain`, permitir recursos y lectura del `noindex` |
| `/sitemap.xml` | 200, XML; sólo las cuatro URLs públicas canónicas |

Las variantes con parámetros apuntan mediante canonical a la URL limpia; no se eliminan parámetros que el hosting pueda necesitar.
No se crearon alias de rutas ni redirecciones por idioma del navegador. Cada idioma se enlaza con un `<a>` normal.

Se entrega `deploy/apache.htaccess` como configuración **opcional para Apache**, con redirecciones,
404, tipos MIME, caché revalidable de HTML/JS/CSS y compresión Brotli/gzip.
Copiarla como `.htaccess` únicamente si el proveedor confirma Apache, los módulos y `AllowOverride` requeridos.
No fue ejecutada contra Apache en este entorno. Si TLS termina en un proxy/CDN, resolver la redirección HTTPS allí para evitar bucles.
En otro hosting, configurar el contrato de esta tabla mediante sus mecanismos existentes; no instalar Apache ni migrar el sitio.

Servir AVIF como `image/avif`, WebP como `image/webp`, WOFF2 como `font/woff2`, y JavaScript con un MIME apropiado.
Habilitar compresión de texto y revalidación de HTML/JS/CSS. La configuración opcional permite una semana de caché de imágenes/fuentes;
invalidarla al reemplazar archivos con el mismo nombre. No usar `immutable` con estos nombres sin hash.
No cachear respuestas del RPC de resultados. Conservar la política de Supabase descrita en `PLAYTEST_SETUP.md`.

Si existe CSP, permitir el arranque inline del tema mediante su hash actualizado, scripts locales y el CDN Supabase existente,
y conexiones HTTPS al proyecto configurado. No desactivar una CSP existente para resolver errores.

Después de publicar, verificar cada variante con `curl.exe -I` y `curl.exe -IL` y comprobar certificados válidos para los hosts utilizados.
Una etiqueta canonical no sustituye una redirección HTTP. La configuración del servidor y sus respuestas públicas siguen pendientes de validar en el hosting real.

## Search Console: pasos del propietario

1. Abrir [Google Search Console](https://search.google.com/search-console/welcome), agregar una propiedad de **Dominio** y escribir `parrilla40.com.ar`, sin protocolo ni ruta.
   Copiar el registro TXT que Google genere al panel DNS del dominio, esperar propagación y verificar.
   No se inventó un token ni se agregó un archivo de verificación falso. Si se elige una propiedad de prefijo de URL,
   usar `https://parrilla40.com.ar/` y publicar el archivo HTML auténtico facilitado por Google. [Ayuda oficial](https://support.google.com/webmasters/answer/34592).
2. En **Sitemaps**, enviar `https://parrilla40.com.ar/sitemap.xml`. Confirmar que Google lo pudo leer y que contiene cuatro URLs.
   [Ayuda del informe](https://support.google.com/webmasters/answer/7451001).
3. En **Inspección de URLs**, probar la raíz, `/en/`, `/preguntas/` y `/preguntas/en/`.
   Revisar HTML, captura, acceso permitido, respuesta 200 y canonical declarada. Comparar con la canonical elegida por Google cuando esté disponible.
4. Usar **Probar URL publicada** y luego **Solicitar indexación** para las páginas principales.
   Enviar una solicitud no confirma que la página haya sido indexada. [Inspección oficial](https://support.google.com/webmasters/answer/9012289).
5. Revisar **Indexación → Páginas** y filtrar por sitemap. Investigar errores de servidor, duplicados, canonical inesperada o exclusiones accidentales.
   `/resultados/` y `404.html` deben permanecer excluidos. `robots.txt` permite rastrearlos para que Google pueda leer su `noindex`.
   El acceso a resultados se protege en Supabase, independientemente de las etiquetas SEO. [Regla noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing).
6. Revisar datos estructurados con [Schema.org](https://validator.schema.org/) y [Rich Results Test](https://search.google.com/test/rich-results).
   Este sitio usa `WebSite`, `WebPage` y `VideoGame`; no se espera una mejora específica de Google para esos tipos por sí solos.
   El test por código realizado no detectó elementos elegibles para resultados enriquecidos.
7. En **Métricas web principales**, seguir móvil y escritorio cuando haya suficientes datos reales.
   Lighthouse es una medición de laboratorio. Evaluar LCP ≤2,5 s, INP ≤200 ms y CLS ≤0,1 al percentil 75;
   el informe de campo utiliza una ventana de 28 días. [Web Vitals](https://web.dev/articles/vitals), [informe oficial](https://support.google.com/webmasters/answer/9205520).
8. Inspeccionar ambas versiones de cada página y revisar en el HTML los `hreflang` recíprocos `es`, `en` y `x-default`.
   Cada versión se canoniza a sí misma. En Rendimiento, filtrar las URLs inglesas y españolas para observar su aparición en búsquedas.
   [Guía oficial de versiones localizadas](https://developers.google.com/search/docs/specialty/international/localized-versions).

## Comprobaciones pendientes fuera del repositorio

- Confirmar hosting, TLS, redirecciones, caché, compresión y 404 en la URL publicada.
- Comprobar esquema, RLS y verificador en el proyecto Supabase real; las pruebas automatizadas usan una base efímera y solicitudes interceptadas.
- Conectar Search Console con la cuenta del propietario, verificar dominio, enviar sitemap y solicitar indexación.
- Revisar las fechas de lanzamiento existentes en la ficha del juego: se conservaron como contenido de origen y no se usaron como `datePublished`, `uploadDate` ni `lastmod`.
- No se creó empresa, dirección, teléfono, redes, calificaciones, vídeos, servicios ni testimonios ficticios. No hay entidad empresarial verificada ni vídeos reales que justifiquen `Organization`/`LocalBusiness` o `VideoObject`.
- El formulario de marketing preexistente sigue siendo una demo, con un mensaje explícito de que no envía ni guarda el correo. No se agregó recolección de identidad.

La preparación técnica y las pruebas locales están implementadas. La publicación y la indexación real requieren los pasos del propietario.
