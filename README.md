# El arte del cosmos

Pieza interactiva de desplazamiento largo que sube por las escalas del universo:
**planetas → estrellas → galaxias → halos → red cósmica**. Ilustración vectorial
plana en paleta oscura (azul profundo + coral + rosa pálido + crema).

## Estructura

```
index.html        Portada: cabecera, 5 escenas interactivas y cierre.
planetas.html     \
estrellas.html     |
galaxias.html      |- Páginas de detalle, una por escala.
halos.html         |
red-cosmica.html  /
css/style.css     Paleta (variables CSS), portada y páginas de detalle.
js/common.js      Compartido: fondo de estrellas, barra de progreso y aparición.
js/main.js        Portada: navegación y aparición de las escenas.
js/planets.js     El sistema planetario de la portada (órbitas keplerianas).
js/planets-blocks.js  Las cuatro piezas interactivas de planetas.html.
js/stars.js       La estrella de la portada (modelo de secuencia principal).
js/stars-blocks.js  Las cuatro piezas interactivas de estrellas.html.
js/galaxies.js    La galaxia de la portada (rotación diferencial y brazos).
js/galaxies-blocks.js  Las cuatro piezas interactivas de galaxias.html.
js/halos.js       Laboratorio de halos (portada + figura de halos.html).
js/halos-blocks.js  Las cuatro piezas interactivas de halos.html.
js/web.js         La red cósmica de la portada, con evolución temporal.
js/web-blocks.js  Las cuatro piezas interactivas de red-cosmica.html.
assets/           Para imágenes o SVG externos si los necesitas.
```

Cada escena de la portada tiene un botón **SABER MÁS** que lleva a su página de
detalle; las páginas de detalle enlazan entre sí (escala anterior / siguiente) y
vuelven a su escena en la portada.

## Las cinco escalas

| # | Escena | Escala | Interacción |
|---|--------|--------|-------------|
| 1 | PLANETS | ~10⁴ km | Slider de velocidad orbital |
| 2 | STARS | ~10⁶ km | Slider de temperatura: color, tamaño y tipo espectral |
| 3 | GALAXIES | ~100 000 años luz | Slider de inclinación: de frente a de canto |
| 4 | HALOS | ~1 millón de años luz | Botón que revela el halo y aplana la curva de rotación |
| 5 | COSMIC WEB | ~100 millones de años luz | Cúmulos que encienden sus filamentos al pasar el cursor |

## Ver la página

```bash
python3 -m http.server 8000   # y abrir http://localhost:8000
```

(Abrir `index.html` con doble clic también funciona; el servidor solo evita
sorpresas si más adelante cargas archivos con `fetch`.)

## Cómo extenderla

- **Cambiar colores:** todo sale de las variables en `:root` de `css/style.css`.
- **Añadir una escena:** copia un bloque `<section class="scene">`, dale un `id`
  nuevo, añade su punto en `.dots`, su `<p class="scene__scale">`, su botón
  `SABER MÁS` y escribe su `initMiEscena()` en `main.js`.
- **Texto de las páginas de detalle:** son HTML plano; se editan directamente.
  La estructura es `.article-head` (título, entradilla y figura), `.article`
  (bloques numerados y el bloque *En cifras*) y `.article-nav`.
- **Ilustraciones:** están inline como SVG para poder pintarlas con CSS. Si
  dibujas en Figma/Illustrator, exporta a SVG, pégalo dentro de `.scene__stage`
  y sustituye los `fill` por las clases (`.blob`, `.ring`, `.sun`, `.axes`).

## Idioma

Todo lo que se lee está en español: títulos, rótulos de las ilustraciones,
lecturas de los controles y nombres de archivo. Los identificadores del código
—clases de CSS, nombres de funciones, `id` de los SVG— siguen en inglés, que es
lo habitual al programar y evita tener que tocar los doce módulos.
