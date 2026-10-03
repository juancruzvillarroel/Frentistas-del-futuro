/* Etapa 1: la planta sobre la parcela real. Patios rectangulares (en metros, ejes del lote) dentro del polígono. */

const PASO = .5, MIN_PATIO = 1.5;
const FUNCIONES = [
  { id: 'encuentro', nombre: 'Encuentro', color: '#e7b25a' },
  { id: 'agua',      nombre: 'Agua y frescor', color: '#86b8d0' },
  { id: 'naranjos',  nombre: 'Naranjos', color: '#9cbf74' },
  { id: 'huerta',    nombre: 'Huerta', color: '#7f9f52' },
  { id: 'taller',    nombre: 'Taller', color: '#c48f68' },
  { id: 'luz',       nombre: 'Luz y aire', color: '#eadfa8' },
  { id: 'descanso',  nombre: 'Descanso', color: '#cfa3b8' },
];
const FUNC = Object.fromEntries(FUNCIONES.map(f => [f.id, f]));

// un patio es válido si sus cuatro esquinas (un poco adentro) caen en la parcela y no pisa a otro
function patioValido(c, patios, id) {
  const e = .05, esquinas = [[c.x + e, c.y + e], [c.x + c.w - e, c.y + e], [c.x + c.w - e, c.y + c.h - e], [c.x + e, c.y + c.h - e]];
  if (!esquinas.every(q => Geo.dentro(q, LOTE.poly))) return false;
  return patios.every(p => p.id === id || p.x >= c.x + c.w || c.x >= p.x + p.w || p.y >= c.y + c.h || c.y >= p.y + p.h);
}
const patioPoly = p => [[p.x, p.y], [p.x + p.w, p.y], [p.x + p.w, p.y + p.h], [p.x, p.y + p.h]];

const Planta = (() => {
  const PX = 20;
  let svg, capa, est, alCambiar, arrastre = null, sigId = 1, AL;
  const X = u => f2(u * PX), Y = v => f2((LOTE.fondo - v) * PX);
  const ruta = poly => 'M' + poly.map(([u, v]) => `${X(u)},${Y(v)}`).join('L') + 'Z';

  function fondo() {
    const AN = LOTE.anchoCaja * PX;
    let grilla = '';
    for (let v = 1; v < LOTE.fondo; v++) grilla += `<line x1="0" y1="${Y(v)}" x2="${f2(AN)}" y2="${Y(v)}" class="grilla"/>`;
    for (let u = 1; u < LOTE.anchoCaja; u++) grilla += `<line x1="${X(u)}" y1="0" x2="${X(u)}" y2="${f2(AL)}" class="grilla"/>`;
    const fr = LOTE.cadenaLocal, mf = fr[Math.floor(fr.length / 2)];
    return `<defs><pattern id="rayado" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><rect width="6" height="6" fill="#efe2c8"/><line x1="0" y1="0" x2="0" y2="6" stroke="#dccaa6" stroke-width="1.4"/></pattern>
      <clipPath id="recorteLote"><path d="${ruta(LOTE.poly)}"/></clipPath></defs>
      <rect x="-80" y="${f2(AL)}" width="${f2(AN + 160)}" height="40" fill="#cfc6b6"/>
      <text x="${f2(AN / 2)}" y="${f2(AL + 34)}" class="rotulo" text-anchor="middle">${LOTE.ref === BARRIO.inicial ? 'CALLE FERIA' : 'CALLE'} · SEVILLA</text>
      <path d="${ruta(LOTE.poly)}" fill="url(#rayado)"/>
      <g clip-path="url(#recorteLote)">${grilla}</g>
      <path d="${ruta(LOTE.poly)}" class="medianera"/>
      <path d="M${fr.map(([u, v]) => `${X(u)},${Y(v)}`).join('L')}" class="frente"/>
      <text x="${X(mf[0])}" y="${f2(+Y(mf[1]) + 16)}" class="cota" text-anchor="middle">fachada · ${fmtM(LOTE.ancho)} m</text>`;
  }

  function iniciar(el, estado, cb) {
    svg = el; est = estado; alCambiar = cb;
    svg.addEventListener('pointerdown', abajo);
    svg.addEventListener('pointermove', mover);
    svg.addEventListener('pointerup', soltar);
    svg.addEventListener('pointercancel', soltar);
  }
  // redibuja el fondo cuando cambia el lote
  function preparar() {
    AL = LOTE.fondo * PX;
    svg.setAttribute('viewBox', `-30 -24 ${f2(LOTE.anchoCaja * PX + 60)} ${f2(AL + 80)}`);
    svg.innerHTML = fondo() + '<g id="capaPlanta"></g>';
    capa = svg.querySelector('#capaPlanta');
    sigId = Math.max(0, ...est.patios.map(p => p.id)) + 1;
    render();
  }

  function render() {
    let s = '', tiradores = '';
    for (const p of est.patios) {
      const f = FUNC[p.funcion], sel = p.id === est.patioSel, x = +X(p.x), y = +Y(p.y + p.h), w = p.w * PX, h = p.h * PX;
      s += `<g data-patio="${p.id}" class="patio${sel ? ' sel' : ''}">
        <rect x="${x}" y="${y}" width="${f2(w)}" height="${f2(h)}" fill="${f.color}"/>
        <text x="${f2(x + w / 2)}" y="${f2(y + h / 2 - 2)}" class="pt-nombre" text-anchor="middle">${f.nombre}</text>
        <text x="${f2(x + w / 2)}" y="${f2(y + h / 2 + 9)}" class="pt-dim" text-anchor="middle">${fmtM(p.w)} × ${fmtM(p.h)} m</text>
      </g>`;
      tiradores += `<circle data-patio="${p.id}" data-handle="1" cx="${f2(x + w)}" cy="${f2(y)}" r="6" class="tirador${sel ? ' sel' : ''}"/>`;
    }
    capa.innerHTML = s + tiradores;
  }

  function punto(e) {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const q = pt.matrixTransform(capa.getScreenCTM().inverse());
    return { u: q.x / PX, v: LOTE.fondo - q.y / PX };
  }
  const redondo = v => Math.round(v / PASO) * PASO;
  function abajo(e) {
    const g = e.target.closest('[data-patio]'), id = g ? +g.dataset.patio : null;
    if (!id) { est.patioSel = null; render(); alCambiar(); return; }
    est.patioSel = id;
    arrastre = { modo: e.target.dataset.handle ? 'tam' : 'mover', p0: punto(e), orig: { ...est.patios.find(q => q.id === id) } };
    svg.setPointerCapture(e.pointerId);
    render(); alCambiar();
  }
  function mover(e) {
    if (!arrastre) return;
    const q = punto(e), o = arrastre.orig, du = redondo(q.u - arrastre.p0.u), dv = redondo(q.v - arrastre.p0.v), c = { ...o };
    if (arrastre.modo === 'mover') { c.x = o.x + du; c.y = o.y + dv; }
    else { c.w = Math.max(MIN_PATIO, o.w + du); c.h = Math.max(MIN_PATIO, o.h + dv); }
    const p = est.patios.find(x => x.id === o.id);
    if ((p.x === c.x && p.y === c.y && p.w === c.w && p.h === c.h) || !patioValido(c, est.patios, o.id)) return;
    Object.assign(p, c); render(); alCambiar();
  }
  function soltar() { arrastre = null; }

  function agregar() {
    const w = 3, h = 3;
    for (let y = 4; y <= LOTE.fondo - h; y += PASO) for (let x = 0; x <= LOTE.anchoCaja - w; x += PASO) {
      const c = { x, y, w, h };
      if (patioValido(c, est.patios, null)) {
        const p = { id: sigId++, ...c, funcion: FUNCIONES[est.patios.length % FUNCIONES.length].id };
        est.patios.push(p); est.patioSel = p.id; render(); return true;
      }
    }
    return false;
  }
  function quitar(id) { est.patios = est.patios.filter(p => p.id !== id); if (est.patioSel === id) est.patioSel = null; render(); }

  return { iniciar, preparar, render, agregar, quitar };
})();
