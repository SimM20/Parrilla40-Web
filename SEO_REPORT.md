# Implementación SEO y optimización — 17 de octubre de 2026

## A. Resumen ejecutivo

Se optimizó **Parrilla 40**, el sitio estático del workspace y del remoto `SimM20/Parrilla40-Web`.
El repositorio y dominio de LoopSmith del ejemplo no corresponden a este proyecto.
El propietario confirmó `https://parrilla40.com.ar/` como dominio público.

Quedaron implementados metadatos por página, canonical, enlaces entre idiomas, `hreflang`, sitemap,
robots, JSON-LD, imágenes sociales, imágenes AVIF/WebP y fuentes WOFF2, temas claro/oscuro,
menú móvil accesible, control de movimiento y una página 404.
Se preservaron la composición, los sprites, las tipografías, la cocción interactiva, la jornada y el acceso privado.
El sitio conserva HTML/CSS/JavaScript nativos, sin nuevas dependencias de producción ni framework.

La mediana de Lighthouse móvil pasó de **66 a 96**, con LCP de **11,41 a 2,42 segundos**.
La transferencia durante la auditoría bajó aproximadamente **98%**.
La publicación, la verificación del hosting y las acciones en Search Console siguen pendientes.

## B. Cambios en código

| Archivos | Motivo |
|---|---|
| `index.html` | Metadatos, landmark principal, enlace de salto, controles accesibles, dimensiones/prioridad de imágenes y contenido estático útil sin JS. Mantiene secciones y diseño. |
| `index-en.html` | Versión inglesa completa con URL propia y contenido HTML rastreable. |
| `preguntas.html`, `preguntas-en.html`, `preguntas.js` | Las 15 preguntas se entregan en HTML inicial, con una sola definición compartida; estados y errores traducidos, envío y validación conservados. |
| `playtest.js` | Localización de errores; campos, opciones almacenadas y validación estructurada conservados. |
| `resultados.html` | Arranque de tema y control accesible; conserva `noindex`, gate y ausencia de datos iniciales. |
| `script.js`, `styles.css` | WOFF2, lectura de geometría fuera de los cuadros del reloj, pausa real sin rAF continuo, movimiento reducido y contenido visible ante fallo de JS; estados accesibles de cocción. |
| `site.js`, `site.css`, `site-data.js`, `translations.json` | Tema temprano/persistente, preferencia del sistema, almacenamiento bloqueado, menú, traducciones y fuentes de imágenes modernas. |
| `site-config.json`, `tools/generate-site.cjs` | Fuente central de URLs y metadatos; autoría reproducible de HTML, esquema, idiomas y cuestionario. No requiere un build en hosting. |
| `assets/optimized/`, `assets/og-es.png`, `assets/og-en.png`, `fonts/*.woff2`, `tools/optimize-assets.py` | Diez familias raster con dos tamaños y ambos formatos modernos, fallback original, dos tarjetas sociales 1200×630 y fuentes locales comprimidas. |
| `robots.txt`, `sitemap.xml`, `404.html`, `deploy/apache.htaccess` | Rastreo, mapa público, error de navegación y configuración Apache opcional, pendiente de validar en el hosting. |
| `tests/seo.cjs`, `tests/browser-seo.cjs`, `tests/browser.cjs` | Verificación de SEO, idiomas, temas, teclado, formatos y regresión. Se evitó que la prueba de configuración ausente use el proyecto real por accidente. |
| `tools/measure-performance.cjs`, `tools/package-site.cjs` | Auditoría comparable y copia de los archivos públicos de publicación. |
| `SEO_METRICS.json`, `SEO_DEPLOY.md`, `LEEME.md`, `PLAYTEST_SETUP.md` | Evidencia, mantenimiento y pasos del propietario. |

No se modificaron el SQL de seguridad ni la configuración pública de Supabase existente.
El formulario de marketing original ahora dice explícitamente que es una demo y que no envía ni guarda el correo.

## C. Cobertura SEO

| URL canónica | Idioma | HTML inicial |
|---|---|---|
| `https://parrilla40.com.ar/` | es | Landing completa |
| `https://parrilla40.com.ar/index-en.html` | en | Landing completa traducida |
| `https://parrilla40.com.ar/preguntas.html` | es | Introducción y 15 preguntas |
| `https://parrilla40.com.ar/preguntas-en.html` | en | Introducción y 15 preguntas traducidas |

Las cuatro tienen títulos/descripciones únicos, canonical absoluta propia, robots apropiado,
Open Graph y Twitter Cards, imagen social localizada, idioma HTML, un H1, `main` y enlaces rastreables.
Cada par contiene `hreflang` recíprocos `es`, `en` y `x-default`. El selector mantiene la sección de la landing cuando corresponde.
El sitemap sólo contiene estas cuatro URLs, sin fechas `lastmod` inventadas. No se agregaron meta keywords.

`resultados.html` y `404.html` conservan exclusión de indexación y no aparecen en el sitemap.
Robots permite su rastreo para leer `noindex`; esa etiqueta no reemplaza los permisos de la base.

El JSON-LD utiliza `WebSite`, `VideoGame` y `WebPage`, con IDs estables y referencias coherentes.
No se inventó una empresa, un restaurante físico, contacto, dirección, horarios, vídeos, reseñas ni ofertas.
No hay contenido real que justifique páginas artificiales de servicios, `LocalBusiness`, `VideoObject` o FAQ comercial.

Validación externa ejecutada por código del inicio:

- **Schema.org:** grafo reconocido como WebPage con WebSite y VideoGame relacionados; **0 errores, 0 advertencias**.
- **Google Rich Results Test:** **no detectó elementos elegibles para resultados enriquecidos**. No implica que el esquema sea inválido ni confirma indexación.
  [Resultado de la prueba](https://search.google.com/test/rich-results/result?id=8P9XP2PmS98s0daGKLLtfA).
- Las cuatro páginas se comprobaron localmente para sintaxis JSON, URLs absolutas, referencias e identificadores únicos.

## D. Rendimiento medido

Lighthouse **13.5.0**, Edge/Chromium **155**, headless, caché fría, servidor estático local sin compresión.
Tres ejecuciones por dispositivo antes y tres después; la tabla muestra medianas.
Móvil: 412×823, simulación de red de Lighthouse (RTT 150 ms, 1638,4 Kbps), CPU ×4.
Escritorio: 1350×940, RTT 40 ms, 10240 Kbps, CPU ×1.
Mismo comando, dispositivo, servidor y condiciones por comparación. Las oscilaciones de laboratorio no representan datos de usuarios reales.

| Métrica | Móvil antes | Móvil después | Escritorio antes | Escritorio después |
|---|---:|---:|---:|---:|
| Rendimiento /100 | 66 | **96** | 98 | **100** |
| LCP | 11,41 s | **2,42 s** | 0,99 s | **0,55 s** |
| CLS | 0 | **0** | 0,0299 | **0,00014** |
| TBT | 0 ms | 32 ms | 0 ms | 0 ms |
| Transferencia de la auditoría | 12,61 MB | **0,247 MB** | 12,61 MB | **0,255 MB** |
| Accesibilidad /100 | 96 | **100** | 96 | **100** |

El rendimiento móvil final osciló entre 94 y 96; TBT entre 0 y 179,5 ms. No se omitieron las ejecuciones más lentas.
Buenas prácticas finales y SEO: 100 en las seis ejecuciones. El SEO de Lighthouse ya era 100 antes: ese puntaje no cubre por sí solo sitemap, canonical, idiomas o toda la preparación realizada aquí.

El cuello principal eran PNG de guarniciones de 1–1,7 MB dibujados como iconos y fuentes TTF.
Se generaron tamaños adecuados, AVIF/WebP reales, `picture`, `srcset`, `sizes` y PNG fallback,
manteniendo los sprites pequeños que ya comprimían bien. La imagen LCP detectada (`heroStars`) es eager y tiene prioridad alta;
los recursos de secciones posteriores son lazy. Se dimensionaron las imágenes y se precarga la fuente principal usada.

Los resultados crudos compactos se conservan en `SEO_METRICS.json`; informes completos en
`test-artifacts/performance-before/` y `test-artifacts/performance-final/` (artefactos locales ignorados por Git).
Quedan recomendaciones de caché, compresión y entrega de recursos para el hosting real.
No se midió INP de campo ni percentil 75: TBT no sustituye INP. Confirmar Core Web Vitals en Search Console/CrUX cuando exista tráfico suficiente.

## E. Funcionalidad y pruebas

Pruebas ejecutadas satisfactoriamente:

- `tests/validation.cjs`: 15 preguntas, enumeraciones, escalas, límites, texto y ausencia de enlaces públicos a resultados.
- `tests/database.cjs`: SQL real en PostgreSQL efímero/PGlite 0.5.8, inserción, restricciones, RLS/permisos, denegación de lectura y escritura ajena, RPC cerrado sin verificador, contraseñas válidas/incorrectas y `search_path` fijo.
- `tests/browser.cjs`: envío válido y fallido, reintento, clic repetido, acceso privado correcto/incorrecto, XSS, filtros, 1200 filas, recarga, teclado y zoom; sin persistir contraseña/dataset. Ejecutado también contra la carpeta publicable.
- `tests/seo.cjs`: HTML inicial, idiomas, 15 campos estáticos por idioma, metadata, canonical, alternancias recíprocas, JSON-LD, sitemap/robots, archivos reales AVIF/WebP, enlaces de recursos, sintaxis y regeneración idempotente.
- `tests/browser-seo.cjs`: **40 combinaciones** de página/tema/ancho (320, 390, 768, 1440); menú por teclado y Escape, navegación equivalente, tema entre páginas, sistema y almacenamiento denegado, movimiento reducido, HTML sin JS, envío/error/reintento en inglés y fallback PNG real.
- axe **4.14.0**: sin violaciones automáticas en diez combinaciones de página/tema, reglas WCAG A/AA hasta 2.2; capturas de escritorio/móvil inspeccionadas. Esto no constituye una certificación completa de WCAG.
- `git diff --check` y comprobación de sintaxis JavaScript aprobados. No hay TypeScript, bundler, build de aplicación ni configuración de lint que ejecutar.

La integración de envío y login usa **solicitudes interceptadas con datos sintéticos**. Las pruebas no insertaron respuestas, consultaron datos privados ni cambiaron permisos en Supabase real.
El paquete público se probó en `http://127.0.0.1:8001/`; una URL inexistente devuelve 404.
El servidor Python devuelve su error nativo: la conexión de `404.html` al error del hosting se entrega como configuración y requiere verificación allí.
Una ejecución simultánea de las suites agotó la espera de inicialización del formulario. No se reprodujo al ejecutarlas por separado:
las dos suites finalizaron correctamente con comprobación estricta de consola. Los comandos reproducibles siguientes se ejecutan en serie.

Herramientas opcionales reproducibles, separadas del producto:

```powershell
npm install --prefix test-artifacts/qa --ignore-scripts --no-audit --no-fund playwright@1.62.1 @axe-core/playwright@4.14.0 lighthouse@13.5.0 @electric-sql/pglite@0.5.8
$env:PLAYWRIGHT_MODULE=(Resolve-Path test-artifacts/qa/node_modules/playwright).Path
$env:PGLITE_MODULE=(Resolve-Path test-artifacts/qa/node_modules/@electric-sql/pglite).Path
node tests/validation.cjs
node tests/database.cjs
node tests/seo.cjs
# Con el servidor estático abierto en el puerto 8000:
node tests/browser.cjs
node tests/browser-seo.cjs
node tools/measure-performance.cjs test-artifacts/performance-repeat
```

## F. Google Search Console

La guía [SEO_DEPLOY.md](SEO_DEPLOY.md) explica verificación de dominio, envío del sitemap,
inspección y solicitud de indexación, exclusiones, datos estructurados, Core Web Vitals e idiomas.
No se inició sesión ni se realizaron acciones en una propiedad de Search Console.

## G. Pendientes externos y límites

Confirmar el hosting, publicar el paquete, verificar TLS/301/404/MIME/caché/compresión reales,
probar Supabase en el proyecto configurado y completar Search Console.
La configuración Apache es opcional y no fue ejecutada en un servidor Apache local.
Revisar las fechas comerciales preexistentes de lanzamiento con el propietario; no se inventó una fecha nueva.

## H. Resultado final

La implementación y las comprobaciones locales están realizadas, con la estética original conservada y las funcionalidades verificadas.
La carpeta `test-artifacts/public` contiene los archivos que se pueden publicar.
No se modificó producción ni se confirmó indexación: Google decide el rastreo, la canonical seleccionada y la aparición en búsquedas.
