# Frentistas del Futuro · calle Feria, Sevilla 2126

Juego del trabajo final sobre la Casa Planes y la retromanía. La casa chorizo de Caballito aterriza en calle Feria (Sevilla, 2126) y los frentistas del futuro la rearman eligiendo piezas de un archivo de todas las épocas: planta con patios, corte y fachada.

**Jugar:** `node datos/servidor.js` y abrir http://localhost:5173 (o el link de GitHub Pages).

## Cómo se juega
La página se recorre en 5 pasos en orden (barra fija arriba y botón *Listo, seguir con…* al final de cada uno). En cada paso: arriba el **archivo** (mapa de nodos que se despliega, el número rojo cuenta cuántas veces usaste esa rama), un **aviso** que dice qué hacer, y abajo el dibujo grande con la **ficha** al costado.
1. **Patios:** primero se eligen, ubican y dimensionan los patios, con su función, suelo y objetos. Los ambientes se ven tenues y no se tocan. La planta está girada: calle Feria a la izquierda.
2. **Ambientes:** se habilita cuando hay al menos un patio. Los ambientes aparecen equipados (cama, mesa, sillones, mesada, sanitarios…) y los patios quedan fijos. La circulación se arma sola: si un ambiente no da a un patio, galería, pasillo o zaguán, se traza un pasillo automático por el espacio libre, y las puertas se abren solas. Con *+ Agregar nivel* se suman pisos (hasta 4): se sube con una *Escalera* puesta en el nivel de abajo, y los patios quedan como vacíos.
3. **Fachada:** 17 estilos (clásico, mudéjar, gótico, renacimiento, barroco sevillano, colonial, italianizante, academicismo, art nouveau, regionalismo sevillano, neocolonial, art déco, racionalismo, pintoresquista, brutalismo, contemporáneo y Sevilla 2126), con 6 a 9 piezas cada uno. Al tocar un estilo queda elegido y solo se habilitan los de **afinidad alta** con todos los elegidos (tabla *Combinaciones de fachadas · Casa Planes*, en `afines`/`contraste` de `js/catalogo.js`); los demás quedan en gris. Tocar de nuevo un estilo elegido, o su chip, lo suelta. Sevilla 2126 es comodín. *Remix del archivo* arma una casa al azar respetando las afinidades.
4. **Techos y corte:** el corte sale solo de la planta. Elegís un techo y hacés clic en un ambiente del corte.
5. **Lámina:** planta + fachada + corte + índice de procedencias. Se exporta en PNG o SVG.
- La casa se guarda sola en el navegador; *Guardar/Abrir* usa archivos `.json` para pasarla entre el grupo.

## Dónde se edita cada cosa
| Archivo | Qué tiene |
|---|---|
| `js/catalogo.js` | Todas las piezas (dibujo, nombre, época, año), techos, ambientes, patios, objetos, colores y eras |
| `js/archivo.js` | El mapa de nodos del catálogo |
| `js/app.js` | Estado de la casa, planta, corte, fachada, lámina, ficha y guardado |
| `css/style.css` | Estética retro de la interfaz |

Para sumar una pieza: copiar una línea `pz(...)` en `js/catalogo.js` y cambiar estilo, categoría, `id`, nombre, época y opciones. Muchas piezas se arman con los constructores `puerta`, `ventana`, `columna`, `cornisa` y `zocalo` (tipo de arco, carpintería, balcón, capitel, franjas…), así que no hace falta dibujar desde cero.

La versión anterior (collage de fotos + 3D) quedó en la rama `main` / historial de git. `js/barrio.js`, `js/geo.js` y `datos/` (Catastro de calle Feria) se guardan para el futuro mapa de la ciudad.
