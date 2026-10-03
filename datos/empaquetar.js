// Empaqueta recortes, texturas y créditos en js/imagenes.js (data URLs) para que el juego funcione abriendo index.html.
// Uso: node datos/empaquetar.js
const fs = require('fs'), path = require('path');
const dir = __dirname, salida = {};
// medidas de JPG/PNG leyendo los encabezados
function medidas(buf) {
  if (buf[0] === 0x89) return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
  let i = 2;
  while (i < buf.length) {
    const marca = buf[i + 1], largo = buf.readUInt16BE(i + 2);
    if (marca >= 0xc0 && marca <= 0xc3) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
    i += 2 + largo;
  }
}
for (const carpeta of ['recortes', 'texturas']) {
  for (const f of fs.readdirSync(path.join(dir, carpeta))) {
    const buf = fs.readFileSync(path.join(dir, carpeta, f)), [w, h] = medidas(buf);
    salida[path.parse(f).name] = { w, h, src: `data:image/${f.endsWith('.png') ? 'png' : 'jpeg'};base64,${buf.toString('base64')}` };
  }
}
const creditos = JSON.parse(fs.readFileSync(path.join(dir, 'creditos.json'), 'utf8'));
const js = `/* Imágenes del catálogo (Wikimedia Commons, ver CREDITOS) y texturas CC0 (Poly Haven). Generado por datos/empaquetar.js */
const IMAGENES = ${JSON.stringify(salida)};
const CREDITOS = ${JSON.stringify(creditos)};
`;
fs.writeFileSync(path.join(dir, '..', 'js', 'imagenes.js'), js);
console.log(Object.keys(salida).length, 'imágenes,', (js.length / 1048576).toFixed(1), 'MB');
