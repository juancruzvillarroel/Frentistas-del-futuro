# Frentistas del Futuro · Sevilla 2126

Juego del trabajo final sobre la Casa Planes y la retromanía: elegís una parcela real de calle Feria (Sevilla), diseñás la planta con patios, componés la fachada como collage de fragmentos de la casa argentina y le ponés techo.

**Jugar:** abrir `index.html` en Chrome/Edge (o el link de GitHub Pages del repositorio).

## Dónde se edita cada cosa
| Archivo | Qué tiene |
|---|---|
| `js/catalogo.js` | Estilos, piezas del catálogo (nombre, estilo, alto) y techos |
| `js/fachada.js` | Cómo se compone la fachada (pisos, módulos, puerta/ventana/balcón) |
| `js/planta.js` | Editor de patios y sus funciones |
| `js/escena.js` | El barrio 3D, la casa en volumen y los techos |
| `js/app.js` | Pantallas y flujo del juego |
| `css/style.css` | Estética de la interfaz |
| `js/imagenes.js`, `js/barrio.js` | Datos generados (no editar a mano) |

## Agregar fotos al catálogo
1. Anotar el recorte en `datos/recortes.js` (archivo de Wikimedia Commons + rectángulo en fracciones).
2. `node datos/servidor.js` y abrir `http://localhost:5173/datos/recortar.html` (baja, recorta y guarda las fotos y los créditos).
3. `node datos/empaquetar.js` para regenerar `js/imagenes.js`.
4. Sumar la pieza en `PIEZAS` de `js/catalogo.js`.

## Créditos
Fotos de Wikimedia Commons (ver botón *Créditos* en el juego; muchas son CC BY-SA y hay que mantener la atribución), texturas CC0 de Poly Haven, parcelario y edificación de la Dirección General del Catastro.
