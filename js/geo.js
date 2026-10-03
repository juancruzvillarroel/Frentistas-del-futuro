/* Geometría de parcelas reales: frente a la calle y sistema de coordenadas de cada lote.
   Coordenadas del barrio: x = este, y = norte (metros). En 3D: X = x, Z = -y. */

const Geo = (() => {
  const area = p => p.reduce((a, q, i) => { const r = p[(i + 1) % p.length]; return a + q[0] * r[1] - r[0] * q[1]; }, 0) / 2;
  function dentro([x, y], p) {
    let c = false;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const [xi, yi] = p[i], [xj, yj] = p[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  function distSeg([px, py], [ax, ay], [bx, by]) {
    const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
    const t = l ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l)) : 0;
    return Math.hypot(px - ax - t * dx, py - ay - t * dy);
  }
  const caja = p => p.reduce((b, [x, y]) => [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)], [Infinity, Infinity, -Infinity, -Infinity]);
  const centroide = p => { const [a, b, c, d] = caja(p); return [(a + c) / 2, (b + d) / 2]; };
  return { area, dentro, distSeg, caja, centroide };
})();

const PARCELA = Object.fromEntries(BARRIO.parcelas.map(p => [p.ref, p]));
BARRIO.parcelas.forEach(p => { p.caja = Geo.caja(p.p); });

// lados de la parcela que no tocan a ninguna vecina: dan a la calle
function frenteDe(par) {
  const p = par.p, n = p.length, [x0, y0, x1, y1] = par.caja;
  const vecinas = BARRIO.parcelas.filter(q => q !== par && q.caja[0] < x1 + 1 && q.caja[2] > x0 - 1 && q.caja[1] < y1 + 1 && q.caja[3] > y0 - 1);
  const cerca = pt => vecinas.some(q => q.p.some((c, k) => Geo.distSeg(pt, c, q.p[(k + 1) % q.p.length]) < .4));
  const calle = p.map((a, i) => {
    const b = p[(i + 1) % n];
    const libres = [.2, .5, .8].filter(t => !cerca([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])).length;
    return libres >= 2;
  });
  // dos lados de calle siguen el mismo frente si no doblan una esquina (las parcelas de esquina tienen dos frentes)
  const dir = i => { const a = p[i], b = p[(i + 1) % n], l = Math.hypot(b[0] - a[0], b[1] - a[1]); return { x: (b[0] - a[0]) / l, y: (b[1] - a[1]) / l, l }; };
  // compara con el último lado de largo significativo (los lados mínimos de las esquinas no cuentan)
  const sigue = (ref, j) => {
    if (!calle[j]) return false;
    const b = dir(j);
    return !ref || b.l < .6 || ref.x * b.x + ref.y * b.y > Math.cos(35 * Math.PI / 180);
  };
  // el tramo continuo de calle más largo (la lista es circular)
  let mejor = null;
  for (let i = 0; i < n; i++) {
    if (!calle[i]) continue;
    const idx = [i];
    let ref = dir(i).l >= .6 ? dir(i) : null;
    for (let k = 1; k < n && sigue(ref, (i + k) % n); k++) { const j = (i + k) % n; idx.push(j); if (dir(j).l >= .6) ref = dir(j); }
    const largo = idx.reduce((s, j) => s + Math.hypot(p[(j + 1) % n][0] - p[j][0], p[(j + 1) % n][1] - p[j][1]), 0);
    if (!mejor || largo > mejor.largo) mejor = { idx, largo };
  }
  if (!mejor || mejor.largo < 3) return null;
  return { cadena: [...mejor.idx.map(j => p[j]), p[(mejor.idx.at(-1) + 1) % n]], largo: mejor.largo };
}

// prepara un lote: cadena de fachada, ejes locales (u hacia la derecha mirando desde la calle, v hacia el fondo)
function prepararLote(ref) {
  const par = PARCELA[ref], fr = par && frenteDe(par);
  if (!fr) return null;
  let cadena = fr.cadena;
  const a = cadena[0], b = cadena.at(-1), L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const d = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], sg = Geo.area(par.p) > 0 ? 1 : -1;
  let n = [-d[1] * sg, d[0] * sg];
  const medio = [(a[0] + b[0]) / 2 + n[0] * .6, (a[1] + b[1]) / 2 + n[1] * .6];
  if (!Geo.dentro(medio, par.p)) n = [-n[0], -n[1]];
  const r = [n[1], -n[0]];
  if ((b[0] - a[0]) * r[0] + (b[1] - a[1]) * r[1] < 0) cadena = [...cadena].reverse();
  const s = cadena[0], proy = q => [(q[0] - s[0]) * r[0] + (q[1] - s[1]) * r[1], (q[0] - s[0]) * n[0] + (q[1] - s[1]) * n[1]];
  const loc0 = par.p.map(proy), umin = Math.min(...loc0.map(q => q[0])), vmin = Math.min(...loc0.map(q => q[1]));
  const o = [s[0] + umin * r[0] + vmin * n[0], s[1] + umin * r[1] + vmin * n[1]];
  const local = q => { const [u, v] = proy(q); return [u - umin, v - vmin]; };
  const poly = par.p.map(local);
  return {
    ref, area: par.a, poly, polyMundo: par.p, cadena, cadenaLocal: cadena.map(local),
    o, r, n, ancho: fr.largo, anchoCaja: Math.max(...poly.map(q => q[0])), fondo: Math.max(...poly.map(q => q[1])),
    mundo: ([u, v]) => [o[0] + u * r[0] + v * n[0], o[1] + u * r[1] + v * n[1]],
  };
}

let LOTE = null;
function usarLote(lote) { LOTE = lote; }
const fmtM = v => v.toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
