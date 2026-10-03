// Convierte el GML del Catastro (parcelas y partes de edificio) en js/barrio.js
// Uso: node datos/convertir.js   (desde la carpeta del proyecto)
const fs = require('fs'), path = require('path');
const dir = __dirname;
const CENTRO = [235193, 4143158]; // calle Feria 37 (EPSG:25830)
const INICIAL = '5233602TG3453C';

const coords = txt => {
  const n = txt.trim().split(/\s+/).map(Number), p = [];
  for (let i = 0; i < n.length - 2; i += 2) p.push([+(n[i] - CENTRO[0]).toFixed(1), +(n[i + 1] - CENTRO[1]).toFixed(1)]);
  return p; // sin repetir el punto de cierre
};
const exterior = bloque => { const m = bloque.match(/<gml:exterior>[\s\S]*?<gml:posList[^>]*>([^<]+)</); return m ? coords(m[1]) : null; };

const gp = fs.readFileSync(path.join(dir, 'parcelas.gml'), 'latin1');
const parcelas = [];
for (const b of gp.split('<cp:CadastralParcel ').slice(1)) {
  const ref = b.match(/<cp:nationalCadastralReference>([^<]+)</)?.[1], area = +b.match(/<cp:areaValue[^>]*>([^<]+)</)?.[1];
  const p = exterior(b);
  if (ref && p && p.length > 2) parcelas.push({ ref, a: area, p });
}

const ge = fs.readFileSync(path.join(dir, 'edificios.gml'), 'latin1');
const edificios = [];
for (const b of ge.split('<bu-ext2d:BuildingPart ').slice(1)) {
  const id = b.match(/gml:id="ES\.SDGC\.BU\.([^"_]+)_/)?.[1], n = +(b.match(/<bu-ext2d:numberOfFloorsAboveGround>(\d+)</)?.[1] ?? 0);
  const p = exterior(b);
  if (id && p && p.length > 2 && n > 0) edificios.push({ ref: id, n, p });
}

const salida = `/* Parcelario y edificación de calle Feria (Sevilla), Dirección General del Catastro (INSPIRE).
   Coordenadas en metros relativas a calle Feria 37 (EPSG:25830): x = este, y = norte. */
const BARRIO = ${JSON.stringify({ inicial: INICIAL, parcelas, edificios })};
`;
fs.writeFileSync(path.join(dir, '..', 'js', 'barrio.js'), salida);
console.log(parcelas.length, 'parcelas,', edificios.length, 'partes de edificio,', (salida.length / 1024).toFixed(0), 'KB');
console.log('inicial:', parcelas.find(p => p.ref === INICIAL));
