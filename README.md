# Frentistas del Futuro · calle Feria, Sevilla 2126

Juego del trabajo final sobre la Casa Planes y la retromanía. La casa chorizo de Caballito aterriza en calle Feria (Sevilla, 2126) y los frentistas del futuro la rearman eligiendo piezas de un archivo de todas las épocas: planta con patios, corte y fachada.

**Jugar:** `node datos/servidor.js` y abrir http://localhost:5173 (o el link de GitHub Pages).

## Cómo se juega
- **Archivo** (arriba): el catálogo es un mapa de nodos que se despliega: Archivo → Planta / Patios / Fachada / Techos → categoría → época → pieza. El número rojo cuenta cuántas veces usaste esa rama.
- **Planta:** se dibujan ambientes y patios sobre el lote, se mueven, se cambia su tamaño y se ponen objetos en los patios.
- **Corte A–A:** sale solo de la planta; la línea roja de la planta define por dónde corta. Los techos se eligen en el archivo con un ambiente seleccionado.
- **Fachada:** collage de piezas dibujadas (puertas, ventanas, columnas, molduras, zócalos, remates, ornamentos). *Remix del archivo* arma una al azar.
- **Lámina:** planta + fachada + corte + índice de procedencias. Se exporta en PNG o SVG.
- La casa se guarda sola en el navegador; *Guardar/Abrir* usa archivos `.json` para pasarla entre el grupo.

## Dónde se edita cada cosa
| Archivo | Qué tiene |
|---|---|
| `js/catalogo.js` | Todas las piezas (dibujo, nombre, época, año), techos, ambientes, patios, objetos, colores y eras |
| `js/archivo.js` | El mapa de nodos del catálogo |
| `js/app.js` | Estado de la casa, planta, corte, fachada, lámina, ficha y guardado |
| `css/style.css` | Estética retro de la interfaz |

Para sumar una pieza: copiar una en `js/catalogo.js`, cambiar `id`, `nombre`, `epoca`, `anio` y el dibujo. El año decide en qué era del mapa aparece.

La versión anterior (collage de fotos + 3D) quedó en la rama `main` / historial de git. `js/barrio.js`, `js/geo.js` y `datos/` (Catastro de calle Feria) se guardan para el futuro mapa de la ciudad.
