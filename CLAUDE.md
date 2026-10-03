# Frentistas del Futuro · contexto del proyecto

Trabajo final de facultad (arquitectura), hecho en equipo. Es un juego web.

## La idea
- **Obra de partida:** la Casa Planes, del estudio de Amero, en Caballito (Buenos Aires). Está construida sobre una casa chorizo preexistente y conserva su fachada original. Eso la vincula con la casa chorizo, la casa de patios, la inmigración y el trabajo de los frentistas (los yeseros que modelaban las fachadas).
- **Lente teórico:** la *retromanía* de Simon Reynolds. Con acceso infinito y permanente al archivo del pasado, la cultura queda atrapada en un loop: proyecta hacia adelante mirando hacia atrás y no logra crear algo nuevo.
- **Ficción futura:** la casa transformada se reubica en **Sevilla, 2126**, por su genealogía compartida: la casa andaluza de patio central, la tradición de los frentistas y la inmigración.
- **Los frentistas del futuro** ya no inventan fachadas: las arman recortando fragmentos de un catálogo de todas las épocas. El juego hace evidente la retromanía: solo podés recombinar el pasado, y la ficha final siempre dice "0 piezas nuevas".

## Cómo se juega
0. **Ciudad:** el barrio real de **calle Feria, Sevilla**, con el parcelario y las alturas del Catastro español. El lote inicial es **calle Feria 37** (parcela 5233602TG3453C, de esquina, con 20,4 m de frente sobre Feria). Al pasar el mouse la parcela se resalta; con un clic se construye ahí.
1. **Planta:** la forma real de la parcela. Se agregan patios, se los mueve, se les cambia el tamaño y se les asigna una función.
2. **Fachada:** se eligen pisos y módulos, y se toca cada hueco para que sea puerta, ventana, balcón o muro ciego. Después se viste con el catálogo, que funciona como un carrito con piezas en "globitos".
3. **Casa:** volumen 3D en su lugar del barrio, con elección de techo, vistas y corte para ver las plantas. Al guardar, la casa queda en la ciudad (en el localStorage de cada navegador).

## Decisiones de diseño (pedidas por el equipo)
- **Estética de collage realista**, nada de dibujito animado: fragmentos fotográficos recortados, con sombras y relieve.
- **Catálogo por estilos de la casa argentina**, más lo moderno y un puente sevillano: colonial, italianizante, academicismo francés, art nouveau, neocolonial, art déco, racionalismo, chalet pintoresquista, brutalismo, contemporáneo y sevillano.
- El barrio tiene que verse como la foto aérea real: muros encalados, tejas rojizas, azoteas claras, calles angostas y pocos árboles variados.
- Pendiente: más piezas para contemporáneo y brutalismo, más ornamentos y, quizás, la fachada original de la Casa Planes como pieza.

## Técnica
- HTML + JS sin build ni frameworks. three.js 0.147 se carga desde jsdelivr (versión UMD, con `examples/js/controls/OrbitControls.js`).
- Se publica con **GitHub Pages** desde `main`: https://juancruzvillarroel.github.io/Frentistas-del-futuro/. Cada push a `main` actualiza el link.
- Código en español, sin abstracciones de más. Leer `README.md` para saber qué archivo editar para cada cosa.
- `js/imagenes.js` (fotos en data URL, unos 6 MB) y `js/barrio.js` (Catastro) **se generan**; no editarlos a mano:
  - Fotos: `datos/recortes.js`, después `node datos/servidor.js` y abrir `/datos/recortar.html`, y por último `node datos/empaquetar.js`.
  - Barrio: `node datos/convertir.js` (lee `datos/*.gml`).
- Las fotos son de Wikimedia Commons; muchas son CC BY-SA. Hay que conservar los créditos (`datos/creditos.json` y el botón *Créditos* del juego).
- Antes de editar, traer lo último de GitHub (`git pull`); al terminar, commit y push.
