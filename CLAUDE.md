# Máquina de composición y ornamentación (ex «Frentistas del Futuro») · contexto del proyecto

Trabajo final de facultad (arquitectura), hecho en equipo. Es un juego web.

## La idea
- **Obra de partida:** la Casa Planes, del estudio de Amero, en Caballito (Buenos Aires). Está construida sobre una casa chorizo preexistente y conserva su fachada original. Eso la vincula con la casa chorizo, la casa de patios, la inmigración y el trabajo de los frentistas (los yeseros que modelaban las fachadas).
- **Lente teórico:** la *retromanía* de Simon Reynolds. Con acceso infinito y permanente al archivo del pasado, la cultura queda atrapada en un loop: proyecta hacia adelante mirando hacia atrás y no logra crear algo nuevo.
- **Ficción futura:** la casa transformada se reubica en **Sevilla, 2157**, por su genealogía compartida: la casa andaluza de patio central, la tradición de los frentistas y la inmigración.
- **Los frentistas del futuro** ya no inventan fachadas: las arman recortando fragmentos de un catálogo de todas las épocas. El juego hace evidente la retromanía: solo podés recombinar el pasado, y la ficha final siempre dice "0 piezas nuevas".

## Versión 2 (rama `v2-retro`, octubre 2026): se rehízo desde cero
El usuario pidió arrancar de nuevo la estética y el juego, manteniendo la ubicación (calle Feria, Sevilla, futuro).
- **Estética retro** (retromanía): papel, tinta, azulejo, albero y almagra; tipografías IM Fell English + VT323; ventanas tipo sistema operativo viejo.
- **Todas las piezas dibujadas en vectores con el mismo estilo. Nada de fotos recortadas** (decisión explícita del usuario).
- **Catálogo como mapa de nodos que se despliega** (referencia: https://fede.dm/FIUBA-Map/): Archivo → sistema → categoría → época → pieza.
- Juego 2D sin objetivo de ganar: armar casas con planta (ambientes + patios con función, suelo y objetos), corte automático y fachada; la lámina final lista las procedencias y siempre dice "0 piezas nuevas".
- Pendiente: mapa de la ciudad con el parcelario real de calle Feria (`js/barrio.js`, `js/geo.js`) para elegir el lote; más piezas.
- `js/escena.js`, `js/fachada.js`, `js/planta.js` e `js/imagenes.js` son de la v1 y ya no se usan.

## Versión 1 (rama `main`): collage fotográfico + 3D
Barrio de calle Feria con el Catastro (lote calle Feria 37, parcela 5233602TG3453C), fachada con fotos recortadas de Wikimedia y casa en 3D con three.js.

## Técnica
- HTML + JS sin build ni frameworks. Para probar: `node datos/servidor.js` → http://localhost:5173.
- Al publicar cambios, subir el número `?v=` de los css/js en `index.html` (GitHub Pages cachea 10 minutos y si no el grupo ve la versión vieja).
- Se publica con **GitHub Pages** desde `main`: https://juancruzvillarroel.github.io/Frentistas-del-futuro/. Cada push a `main` actualiza el link.
- Código en español, sin abstracciones de más. Leer `README.md` para saber qué archivo editar para cada cosa.
- `js/imagenes.js` (fotos en data URL, unos 6 MB) y `js/barrio.js` (Catastro) **se generan**; no editarlos a mano:
  - Fotos: `datos/recortes.js`, después `node datos/servidor.js` y abrir `/datos/recortar.html`, y por último `node datos/empaquetar.js`.
  - Barrio: `node datos/convertir.js` (lee `datos/*.gml`).
- Las fotos son de Wikimedia Commons; muchas son CC BY-SA. Hay que conservar los créditos (`datos/creditos.json` y el botón *Créditos* del juego).
- Antes de editar, traer lo último de GitHub (`git pull`); al terminar, commit y push.
