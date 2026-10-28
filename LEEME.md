# Parrilla 40 — página de marketing

Sitio estático para el juego, en español e inglés, sin framework ni build de producción.
Para revisar todas las rutas, usá un servidor HTTP estático según `PLAYTEST_SETUP.md`.
Las fuentes, imágenes e interacciones de la landing son locales; la encuesta y el panel usan Supabase.

## Qué hay adentro

```
index.html     la página
styles.css     estilos y animaciones
script.js      parallax, reveals, cocinero interactivo, ciclo de día, formulario
assets/        sprites copiados del proyecto Unity
fonts/         Bungee y Nunito, las mismas del juego
```

## Lo interactivo

| Sección | Qué hace |
|---|---|
| Hero | Parallax de nubes y paisaje al scrollear, humo, contadores animados |
| El punto | Slider de cocción: cambia el sprite real del corte por cada punto y dice si te pagan o te clavan un strike. Se puede cambiar de corte |
| La jornada | Ciclo de día en loop (16 s): cielo, sol y luna siguen la hora, con botón de pausa |
| Los clientes | Barras de paciencia que se llenan al entrar en pantalla; el impaciente tiembla |
| Strikes | Las tres X se estampan y aparece el CERRADO |

## Cosas a tener en cuenta

- **El formulario no manda nada.** Valida el mail y muestra un mensaje, pero no hay backend.
  Si querés que funcione de verdad, hay que apuntarlo a un servicio (Formspree, Mailchimp, etc.).
- **El estado "Quemado"** usa el sprite del juego para tira, chorizo y paty. Vacío y choripán
  todavía no tienen uno, así que la página usa el de "Pasado" oscurecido por CSS. Cuando existan,
  copiá los PNG a `assets/cortes/` y sacalos de `NO_BURNT_SPRITE` en `script.js`.
- Los textos salen de cómo funciona el juego hoy (jornada de 06:30 a 21:00 en 5 minutos,
  6 puntos de cocción, 3 strikes, tienda entre noches). Si cambiás el diseño, revisalos.
- Respeta `prefers-reduced-motion`: con esa opción activada del sistema, se apagan las animaciones.

## Si la querés publicar

Es HTML plano: sirve cualquier hosting estático (GitHub Pages, Netlify, itch.io).
Subís la carpeta entera tal cual está.

## Encuesta de playtest V1

El índice incluye un acceso a `preguntas.html`. La encuesta requiere un servidor HTTP
estático y configurar Supabase para enviar respuestas. El panel privado se abre sólo
por su URL y valida la contraseña en la base de datos.

Ver [PLAYTEST_SETUP.md](PLAYTEST_SETUP.md) para ejecutar localmente, conectar Supabase,
provisionar el verificador sin guardar la contraseña, probar y publicar la V1.

## Ranking del evento

`ranking-evento.html` muestra el leaderboard del evento (rama `event/leaderboard` del juego):
la mejor run de cada nombre según la plata total cobrada, sin restar lo gastado. No está enlazada
ni en el sitemap y lleva `noindex`; se abre sólo con el link y se actualiza sola cada 20 s.
Usa su propio proyecto de Supabase (`ranking-evento-config.js`), separado del de la encuesta. Antes de usarla,
correr una vez `supabase/event-leaderboard.sql` en el SQL Editor de ese proyecto.

## SEO, idiomas y rendimiento

El dominio canónico confirmado es `https://parrilla40.com.ar/`. Las versiones públicas son
`index.html`, `index-en.html`, `preguntas.html` y `preguntas-en.html`. El panel conserva su acceso privado.

Ver [SEO_REPORT.md](SEO_REPORT.md) para cambios, pruebas y mediciones, y
[SEO_DEPLOY.md](SEO_DEPLOY.md) para publicar los archivos correctos y conectar Search Console.

Al editar contenido en español, metadatos, traducciones o preguntas, ejecutar `node tools/generate-site.cjs`
y `node tests/seo.cjs`. Este paso de autoría actualiza el HTML estático que se guarda en Git;
el hosting sólo sirve archivos. `node tools/package-site.cjs` reúne los archivos públicos en `test-artifacts/public`.
