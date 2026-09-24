# Parrilla 40 — página de marketing

Landing estática para el juego. **Abrí `index.html` con doble clic** y listo: no necesita servidor
ni conexión (fuentes, sprites y scripts son todos locales).

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
- **El estado "Quemado" no tiene sprite propio** en el proyecto, así que la página usa el de
  "Pasado" oscurecido por CSS. Si en algún momento dibujás los quemados, cambiá el array
  `STATES` en `script.js` y copiá los PNG a `assets/cortes/`.
- Los textos salen de cómo funciona el juego hoy (jornada de 06:30 a 21:00 en 5 minutos,
  6 puntos de cocción, 3 strikes, tienda entre noches). Si cambiás el diseño, revisalos.
- Respeta `prefers-reduced-motion`: con esa opción activada del sistema, se apagan las animaciones.

## Si la querés publicar

Es HTML plano: sirve cualquier hosting estático (GitHub Pages, Netlify, itch.io).
Subís la carpeta entera tal cual está.
