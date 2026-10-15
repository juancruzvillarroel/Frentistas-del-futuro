/* Frentistas del Futuro · calle Feria, Sevilla 2126.
   El juego avanza en pasos: 1 planta y patios · 2 fachada · 3 techos y corte · 4 lámina.
   Acá están el estado de la casa, el dibujo de cada vista, la ficha, el aviso de ayuda y el guardado. */

(() => {
  'use strict';
  const CAT = window.CATALOGO, C = CAT.colores;
  const G = 10;              // línea de suelo (y) en fachada y corte
  const SNAP = 0.5;          // grilla de la planta en metros
  const KEY = 'frentistas-v3';
  const FULL = new Set(['moldura', 'zocalo']);  // piezas que ocupan todo el ancho
  const FONT = { serif: "'IM Fell English', Georgia, serif", sc: "'IM Fell English SC', Georgia, serif", mono: "VT323, 'Courier New', monospace" };

  const $ = s => document.querySelector(s);
  const uid = () => Math.random().toString(36).slice(2, 9);
  const snap = (v, s = SNAP) => Math.round(v / s) * s;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmt = n => String(Math.round(n * 10) / 10).replace('.', ',');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const byId = (l, id) => l.find(e => e.id === id);
  const F = id => byId(CAT.fachada, id), T = id => byId(CAT.techos, id) || CAT.techos[0];
  const A = id => byId(CAT.ambientes, id), PT = id => byId(CAT.patios, id), OB = id => byId(CAT.objetos, id);
  const EST = id => byId(CAT.estilos, id);
  const pano = () => byId(CAT.panos, state.fachada.pano) || CAT.panos[0];

  // Los pasos van en orden: primero los patios (el corazón de la casa), después los ambientes alrededor.
  const PASOS = {
    patios: { n: 1, vista: 'planta', titulo: 'Patios', sig: 'ambientes', texto: 'La casa empieza por sus patios. Elegí un tipo de patio en el archivo y hacé clic en el lote para ubicarlo, o arrastrá para dibujarlo del tamaño que quieras. Después tocalo para ajustar su tamaño, su función y sus objetos. Toda casa necesita al menos un patio.' },
    ambientes: { n: 2, vista: 'planta', titulo: 'Ambientes', sig: 'fachada', texto: 'Con los patios ubicados, armá la casa alrededor: living, cocina, dormitorios, baño… Cada ambiente aparece equipado. Los patios quedan fijos; para cambiarlos, volvé al paso 1.' },
    fachada: { n: 3, vista: 'fachada', titulo: 'Fachada', sig: 'techos', texto: 'Cada estilo del archivo tiene sus piezas: puertas, ventanas, columnas, molduras, zócalos, remates y ornamentos. Elegí una y hacé clic sobre la fachada para colocarla. Mezclar épocas es exactamente lo que hacen los frentistas del futuro.' },
    techos: { n: 4, vista: 'corte', titulo: 'Techos y corte', sig: 'lamina', texto: 'El corte se arma solo con tu planta. Elegí un techo en el archivo y hacé clic sobre un ambiente del corte para ponérselo. La posición del corte se cambia en la ficha.' },
    lamina: { n: 5, vista: 'lamina', titulo: 'Lámina', texto: 'La lámina junta planta, fachada y corte con el índice de procedencias: de qué época y lugar viene cada pieza que elegiste.' }
  };

  /* ---------- Estado ---------- */
  function casaInicial() {
    const amb = (tipo, x, y, w, h) => ({ id: uid(), tipo, patio: false, nombre: A(tipo).nombre, x, y, w, h, alto: 4.2, techo: A(tipo).techo });
    const pat = (tipo, x, y, w, h, objs) => ({ id: uid(), tipo, patio: true, nombre: PT(tipo).nombre, x, y, w, h, funcion: PT(tipo).funcion, suelo: PT(tipo).suelo,
      objetos: objs.map(([t, ox, oy]) => ({ id: uid(), tipo: t, x: ox, y: oy })) });
    const fac = (el, x, y) => ({ id: uid(), el, x, y, s: 1, flip: false });
    // La casa chorizo de Caballito tal como llega a Sevilla: piezas en fila junto a un patio lateral.
    return {
      version: 2, nombre: 'Casa Planes, en loop', frentista: '', lot: { w: 9, d: 30 }, sx: 7.5, fachada: { alto: 7, pano: 'cal' },
      rooms: [
        amb('living', 0, 25, 4.5, 5), amb('zaguan', 4.5, 25, 2, 5), amb('estudio', 6.5, 25, 2.5, 5),
        amb('dormitorio', 0, 20, 4.5, 5), amb('dormitorio', 0, 15, 4.5, 5), amb('comedor', 0, 10, 4.5, 5),
        amb('cocina', 0, 6, 4.5, 4), amb('bano', 0, 4, 4.5, 2), amb('galeria', 4.5, 4, 1.5, 21),
        pat('patio-principal', 6, 10, 3, 15, [['naranjo', 1.5, 3], ['fuente', 1.5, 8], ['macetas', 1.5, 12.5]]),
        amb('taller', 6, 4, 3, 6),
        pat('huerta', 0, 0, 9, 4, [['parra', 2, 2], ['tendedero', 6.5, 2]])
      ],
      facade: [
        fac('zocalo-simil', 0, G - 0.9), fac('cornisa-mensulas', 0, G - 7), fac('balaustrada', 0, G - 8.1),
        fac('jarron', 0, G - 9.1), fac('jarron', 8.4, G - 9.1),
        fac('ventana-balcon', 1.55, G - 3.9), fac('puerta-chorizo', 4.8, G - 3.4), fac('ventana-balcon', 7.05, G - 3.9),
        fac('cartela', 4.8, G - 4.5)
      ]
    };
  }

  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (!s || s.version !== 2) return null; s.facade = s.facade.filter(f => F(f.el)); return s; }
    catch { return null; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* sin guardado local */ } }

  // Se arranca con el lote vacío; la casa chorizo de Caballito queda como ejemplo en el botón «Casa chorizo».
  const casaVacia = () => ({ ...casaInicial(), nombre: 'Casa sin nombre', rooms: [], facade: [] });
  let state = load() || casaVacia();
  const ui = { paso: 'patios', camino: { patios: [], ambientes: [], fachada: [], techos: [] }, tool: null, sel: null, drag: null };
  const ARBOLES = Archivo.arboles(CAT);
  const vista = () => PASOS[ui.paso].vista;

  const room = id => state.rooms.find(r => r.id === id);
  const facEl = id => state.facade.find(f => f.id === id);
  const overlaps = r => state.rooms.some(o => o.id !== r.id && r.x < o.x + o.w - 1e-6 && o.x < r.x + r.w - 1e-6 && r.y < o.y + o.h - 1e-6 && o.y < r.y + r.h - 1e-6);
  const inside = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  const clampItems = r => r.patio && r.objetos.forEach(o => { o.x = clamp(o.x, 0, r.w); o.y = clamp(o.y, 0, r.h); });

  /* ---------- Dibujo compartido ---------- */
  const DEFS = `<defs>
    <pattern id="suelo-azulejo" patternUnits="userSpaceOnUse" width="0.6" height="0.6"><rect width="0.6" height="0.6" fill="${C.cal}"/><path d="M0.3 0.04 L0.56 0.3 L0.3 0.56 L0.04 0.3 Z" fill="${C.azul}" opacity="0.7"/><circle cx="0.3" cy="0.3" r="0.07" fill="${C.albero}"/></pattern>
    <pattern id="suelo-ladrillo" patternUnits="userSpaceOnUse" width="0.6" height="0.3"><rect width="0.6" height="0.3" fill="#c98466"/><path d="M0 0.15 H0.6 M0.3 0 V0.15 M0 0.15 V0.3 M0.6 0.15 V0.3" stroke="${C.tinta}" stroke-width="0.4" fill="none"/></pattern>
    <pattern id="suelo-albero" patternUnits="userSpaceOnUse" width="0.5" height="0.5"><rect width="0.5" height="0.5" fill="#e3b860"/><circle cx="0.1" cy="0.15" r="0.025" fill="#a8803a"/><circle cx="0.35" cy="0.38" r="0.02" fill="#a8803a"/></pattern>
    <pattern id="suelo-tierra" patternUnits="userSpaceOnUse" width="1" height="1"><rect width="1" height="1" fill="#b39466"/><path d="M0.2 0.8 l0.08 -0.3 M0.6 0.84 l-0.06 -0.28 M0.75 0.4 l0.06 -0.24" stroke="${C.verde}" stroke-width="1" fill="none"/></pattern>
    <pattern id="suelo-cal" patternUnits="userSpaceOnUse" width="0.5" height="0.5"><rect width="0.5" height="0.5" fill="${C.cal}"/><path d="M0 0 H0.5 M0 0 V0.5" stroke="#cdbf9f" stroke-width="0.6" fill="none"/></pattern>
    <pattern id="semi" patternUnits="userSpaceOnUse" width="0.4" height="0.4"><rect width="0.4" height="0.4" fill="#f1e8d4"/><path d="M0 0.4 L0.4 0" stroke="#bfae8a" stroke-width="0.6"/></pattern>
    <pattern id="tierra" patternUnits="userSpaceOnUse" width="0.5" height="0.5"><rect width="0.5" height="0.5" fill="#e2d4b4"/><path d="M0 0.5 L0.5 0" stroke="#b9a882" stroke-width="0.6"/></pattern>
  </defs>`;
  const STYLE = '<style>*{vector-effect:non-scaling-stroke}</style>';

  const txt = (x, y, t, size, o = {}) => `<text x="${x}" y="${y}" font-size="${size}" font-family="${FONT[o.font || 'serif']}" text-anchor="${o.anchor || 'middle'}" fill="${o.fill || C.tinta}" ${o.extra || ''}>${esc(t)}</text>`;
  const halo = `stroke="${C.cal}" stroke-width="3" paint-order="stroke" pointer-events="none"`;
  const art = (def, w, h) => def.img ? `<image href="${def.img}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none"/>` : def.draw(w, h);
  const figura = x => `<g transform="translate(${x} ${G})" fill="none" stroke="${C.tinta}" stroke-width="1" pointer-events="none"><circle cx="0" cy="-1.62" r="0.12"/><path d="M0 -1.5 V-0.85 L-0.15 0 M0 -0.85 L0.15 0 M-0.25 -1.05 L0 -1.4 L0.25 -1.05"/></g>`;

  function thumb(h) {
    if (h.kind === 'fac') { const d = F(h.id), w = FULL.has(d.cat) ? 3 : d.w; return `<svg viewBox="-0.4 -0.5 ${w + 0.8} ${d.h + 0.9}">${art(d, w, d.h)}</svg>`; }
    if (h.kind === 'amb') { const a = A(h.id), w = Math.max(a.w, a.h), d = Math.min(a.w, a.h); return `<svg viewBox="-0.3 -0.3 ${w + 0.6} ${d + 0.6}"><rect width="${w}" height="${d}" fill="${a.id === 'galeria' ? 'url(#semi)' : a.color}" stroke="${C.tinta}" stroke-width="1.6"/>${equipar(a, 0, 0, w, d)}</svg>`; }
    if (h.kind === 'patio') { const p = PT(h.id); return `<svg viewBox="-0.3 -0.3 ${p.w + 0.6} ${p.h + 0.6}"><rect width="${p.w}" height="${p.h}" fill="url(#suelo-${p.suelo})" stroke="${C.tinta}" stroke-width="1.2"/></svg>`; }
    if (h.kind === 'obj') { const o = OB(h.id); return `<svg viewBox="-1.5 ${-o.alto - 0.2} 3 ${o.alto + 0.4}">${o.side()}</svg>`; }
    if (h.kind === 'techo') return `<svg viewBox="-0.8 -4.4 5.6 5"><rect x="0" y="0" width="4" height="0.6" fill="#f6efdf"/><rect x="-0.15" y="0" width="0.3" height="0.6" fill="${C.tinta}"/><rect x="3.85" y="0" width="0.3" height="0.6" fill="${C.tinta}"/>${T(h.id).draw(4)}</svg>`;
    return '';
  }

  /* ---------- Planta (girada: la calle queda a la izquierda, el fondo a la derecha) ----------
     Coordenadas del lote: x = ancho (de medianera a medianera), y = profundidad (0 = fondo, d = calle).
     En pantalla: X = d − y, Y = x. */
  const scr = (x, y) => [state.lot.d - y, x];
  const scrRect = r => ({ X: state.lot.d - (r.y + r.h), Y: r.x, W: r.h, H: r.w });

  function drawPlan(live) {
    const { w, d } = state.lot; let s = '';
    if (live) {
      for (let x = 0; x <= d; x++) s += `<line x1="${x}" y1="0" x2="${x}" y2="${w}" stroke="#ddd0b4" stroke-width="0.5"/>`;
      for (let y = 0; y <= w; y++) s += `<line x1="0" y1="${y}" x2="${d}" y2="${y}" stroke="#ddd0b4" stroke-width="0.5"/>`;
    }
    s += `<rect x="0" y="0" width="${d}" height="${w}" fill="none" stroke="${C.tinta}" stroke-width="1" stroke-dasharray="6 4"/>`;
    s += `<line x1="-0.7" y1="-1.5" x2="-0.7" y2="${w + 1.5}" stroke="${C.tinta}" stroke-width="0.8"/>` + txt(-1.6, w / 2, 'CALLE FERIA', 0.6, { font: 'mono', extra: `letter-spacing="0.2" transform="rotate(-90 -1.6 ${w / 2})"` });
    s += txt(d + 1.4, w / 2, 'FONDO', 0.5, { font: 'mono', extra: `transform="rotate(90 ${d + 1.4} ${w / 2})"` });
    for (const r of state.rooms) s += planRoom(r, live);
    s += `<line x1="0" y1="0" x2="0" y2="${w}" stroke="${C.tinta}" stroke-width="4"/>`;
    if (!(live && ui.paso === 'patios')) s += dibujarPuertas();
    const sx = state.sx;
    s += `<line x1="-1" y1="${sx}" x2="${d + 1}" y2="${sx}" stroke="${C.almagra}" stroke-width="1.4" stroke-dasharray="10 4 2 4" pointer-events="none"/>`;
    for (const X of [-1, d + 1]) s += `<g ${live ? 'data-handle="corte" style="cursor:ns-resize"' : ''}><circle cx="${X}" cy="${sx}" r="0.45" fill="${C.almagra}" stroke="${C.tinta}" stroke-width="1"/>${txt(X, sx + 0.2, 'A', 0.55, { font: 'mono', fill: C.cal, extra: 'pointer-events="none"' })}</g>`;
    if (live) s += planSel() + planDraft();
    return { vb: [-2.4, -1.6, d + 4.6, w + 3.2], body: s };
  }

  // Dibuja el equipamiento de un ambiente dentro del rectángulo (X, Y, W, H): centrado, achicado si no entra
  // y girado si así entra mejor. La galería lo repite a lo largo.
  function equipar(a, X, Y, W, H) {
    const eq = a.equipo; if (!eq) return '';
    const [bw, bh] = eq.box, fit = (w, h) => Math.min(1, (W - 0.3) / w, (H - 0.3) / h);
    const s0 = fit(bw, bh), s90 = fit(bh, bw), rot = s90 > s0 * 1.1, s = rot ? s90 : s0;
    if (s < 0.3) return '';
    const largo = Math.max(W, H), paso = (rot ? bw : bw) * s + 0.8, n = eq.repetir ? Math.max(1, Math.floor(largo / paso)) : 1;
    let out = '';
    for (let i = 0; i < n; i++) {
      const cx = W >= H ? X + W * (i + 0.5) / n : X + W / 2, cy = W >= H ? Y + H / 2 : Y + H * (i + 0.5) / n;
      out += `<g transform="translate(${cx} ${cy}) rotate(${rot ? 90 : 0}) scale(${s}) translate(${-bw / 2} ${-bh / 2})">${eq.draw()}</g>`;
    }
    return `<g pointer-events="none">${out}</g>`;
  }

  function planRoom(r, live) {
    const fill = r.patio ? `url(#suelo-${r.suelo})` : (r.tipo === 'galeria' ? 'url(#semi)' : A(r.tipo).color);
    const q = scrRect(r);
    // En el paso Patios solo se tocan los patios (los ambientes se ven tenues); en Ambientes los patios quedan fijos.
    const activo = live && (ui.paso === 'patios' ? r.patio : ui.paso === 'ambientes' && !r.patio);
    const tenue = live && ui.paso === 'patios' && !r.patio;
    let s = `<g ${activo ? `data-room="${r.id}" style="cursor:move"` : ''} ${tenue ? 'opacity="0.35"' : ''}>`;
    s += `<rect x="${q.X}" y="${q.Y}" width="${q.W}" height="${q.H}" fill="${fill}" stroke="${C.tinta}" stroke-width="${r.patio ? 1.2 : 2.2}"/>`;
    if (r.patio) for (const o of r.objetos) { const [X, Y] = scr(r.x + o.x, r.y + o.y); s += `<g ${activo ? `data-item="${o.id}" data-room="${r.id}"` : ''} transform="translate(${X} ${Y})">${OB(o.tipo).plan()}</g>`; }
    else s += equipar(A(r.tipo), q.X, q.Y, q.W, q.H);
    const fs = clamp(Math.min(q.W, q.H) / 6, 0.28, 0.48), x = q.X + 0.18, y = q.Y + fs + 0.12;
    s += txt(x, y, r.nombre, fs, { anchor: 'start', extra: `font-style="italic" ${halo}` });
    s += txt(x, y + fs * 0.95, `${fmt(r.w * r.h)} m²`, fs * 0.8, { anchor: 'start', font: 'mono', extra: halo });
    return s + '</g>';
  }

  /* ---------- Puertas y circulación (se calculan solas a partir de la planta) ---------- */
  const esCirc = r => r.patio || ['zaguan', 'pasillo', 'galeria'].includes(r.tipo);
  const abierto = r => r.patio || r.tipo === 'galeria';

  // Lado compartido entre dos espacios (coordenadas del lote), si mide al menos 1 m.
  // eje 'x': muro en x = c que corre en y de t0 a t1; eje 'y': muro en y = c que corre en x.
  function ladoComun(a, b) {
    const e = 1e-6;
    for (const [p, q] of [[a, b], [b, a]]) {
      if (Math.abs(p.x + p.w - q.x) < e) { const t0 = Math.max(a.y, b.y), t1 = Math.min(a.y + a.h, b.y + b.h); if (t1 - t0 >= 1) return { eje: 'x', c: q.x, t0, t1 }; }
      if (Math.abs(p.y + p.h - q.y) < e) { const t0 = Math.max(a.x, b.x), t1 = Math.min(a.x + a.w, b.x + b.w); if (t1 - t0 >= 1) return { eje: 'y', c: q.y, t0, t1 }; }
    }
    return null;
  }

  // Cada ambiente se abre a un espacio de circulación vecino (patio, galería, pasillo, zaguán);
  // si no tiene, a un ambiente vecino que ya tenga acceso desde la calle.
  function calcularPuertas() {
    const R = state.rooms, { d } = state.lot, puertas = [], con = new Map(R.map(r => [r.id, new Set()])), vec = new Map(R.map(r => [r.id, []]));
    const unir = (a, b, lado, tipo) => { puertas.push({ a, b, lado, tipo }); con.get(a.id).add(b.id); con.get(b.id).add(a.id); };
    for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) {
      const l = ladoComun(R[i], R[j]); if (!l) continue;
      vec.get(R[i].id).push([R[j], l]); vec.get(R[j].id).push([R[i], l]);
      if (esCirc(R[i]) && esCirc(R[j])) unir(R[i], R[j], l, abierto(R[i]) && abierto(R[j]) ? 'abierto' : 'paso');
    }
    const prioridad = r => r.tipo === 'zaguan' ? 1 : 2;
    for (const r of R) if (!esCirc(r)) {
      const op = vec.get(r.id).filter(([o]) => esCirc(o)).sort((p, q) => prioridad(q[0]) - prioridad(p[0]) || (q[1].t1 - q[1].t0) - (p[1].t1 - p[1].t0))[0];
      if (op) unir(r, op[0], op[1], 'puerta');
    }
    const frente = R.filter(r => Math.abs(r.y + r.h - d) < 1e-6);
    const entrada = frente.find(r => r.tipo === 'zaguan') || frente.find(esCirc) || frente[0];
    const alcanzados = new Set();
    const recorrer = () => { alcanzados.clear(); const cola = entrada ? [entrada.id] : []; while (cola.length) { const id = cola.shift(); if (alcanzados.has(id)) continue; alcanzados.add(id); cola.push(...con.get(id)); } };
    recorrer();
    for (let cambio = true; cambio;) {
      cambio = false;
      for (const r of R) if (!alcanzados.has(r.id)) {
        const op = vec.get(r.id).find(([o]) => alcanzados.has(o.id));
        if (op) { unir(r, op[0], op[1], esCirc(r) && esCirc(op[0]) ? 'paso' : 'puerta'); recorrer(); cambio = true; }
      }
    }
    return { puertas, entrada, sinAcceso: R.filter(r => !alcanzados.has(r.id)) };
  }

  // Dibuja un vano en un muro (coordenadas del lote) pasándolo a pantalla. La hoja abre hacia «hacia».
  function vano(eje, c, t, a, tipo, hacia) {
    const d = state.lot.d, T = 0.34, GAP = '#f6efdf', st = `stroke="${C.tinta}" fill="none"`;
    if (eje === 'x') {   // en pantalla: muro horizontal en Y = c, centrado en X = d − t
      const Y = c, X = d - t, s = hacia.x + hacia.w / 2 > c ? 1 : -1, hx = X - a / 2;
      let o = `<rect x="${hx}" y="${Y - T / 2}" width="${a}" height="${T}" fill="${GAP}"/>` + `<path d="M${hx} ${Y - T / 2} V${Y + T / 2} M${hx + a} ${Y - T / 2} V${Y + T / 2}" ${st} stroke-width="1.4"/>`;
      if (tipo === 'abierto') o += `<line x1="${hx}" y1="${Y}" x2="${hx + a}" y2="${Y}" ${st} stroke-width="0.8" stroke-dasharray="4 3"/>`;
      if (tipo === 'puerta') o += `<path d="M${hx} ${Y} V${Y + s * a}" ${st} stroke-width="1.4"/><path d="M${hx} ${Y + s * a} A${a} ${a} 0 0 ${s > 0 ? 0 : 1} ${hx + a} ${Y}" ${st} stroke-width="0.7" stroke-dasharray="3 2"/>`;
      return o;
    }
    // eje 'y': en pantalla, muro vertical en X = d − c, centrado en Y = t
    const X = d - c, s = hacia.y + hacia.h / 2 < c ? 1 : -1, hy = t - a / 2;
    let o = `<rect x="${X - T / 2}" y="${hy}" width="${T}" height="${a}" fill="${GAP}"/>` + `<path d="M${X - T / 2} ${hy} H${X + T / 2} M${X - T / 2} ${hy + a} H${X + T / 2}" ${st} stroke-width="1.4"/>`;
    if (tipo === 'abierto') o += `<line x1="${X}" y1="${hy}" x2="${X}" y2="${hy + a}" ${st} stroke-width="0.8" stroke-dasharray="4 3"/>`;
    if (tipo === 'puerta') o += `<path d="M${X} ${hy} H${X + s * a}" ${st} stroke-width="1.4"/><path d="M${X + s * a} ${hy} A${a} ${a} 0 0 ${s > 0 ? 1 : 0} ${X} ${hy + a}" ${st} stroke-width="0.7" stroke-dasharray="3 2"/>`;
    return o;
  }

  function dibujarPuertas() {
    const { puertas, entrada } = calcularPuertas(); let s = '';
    for (const p of puertas) {
      const l = p.lado, L = l.t1 - l.t0, bano = p.a.tipo === 'bano' || p.b.tipo === 'bano';
      const a = p.tipo === 'abierto' ? Math.max(0.8, L - 0.5) : Math.min(p.tipo === 'paso' ? 1.2 : bano ? 0.75 : 0.9, L - 0.3);
      const t = p.tipo === 'abierto' ? (l.t0 + l.t1) / 2 : l.t0 + Math.min(L / 2, 0.3 + a / 2);
      s += vano(l.eje, l.c, t, a, p.tipo, !esCirc(p.a) ? p.a : p.b);
    }
    if (entrada) s += vano('y', state.lot.d, entrada.x + entrada.w / 2, Math.min(1.2, entrada.w - 0.3), 'puerta', entrada);
    return `<g pointer-events="none">${s}</g>`;
  }

  function planSel() {
    const s = ui.sel; if (!s) return '';
    if (s.kind === 'room') {
      const r = room(s.id); if (!r) return '';
      const q = scrRect(r);
      return `<rect x="${q.X}" y="${q.Y}" width="${q.W}" height="${q.H}" fill="none" stroke="${C.azul}" stroke-width="3" stroke-dasharray="6 3" pointer-events="none"/>`
        + `<rect data-handle="resize" x="${q.X + q.W - 0.4}" y="${q.Y + q.H - 0.4}" width="0.8" height="0.8" fill="${C.azul}" stroke="${C.cal}" stroke-width="1.5" style="cursor:nwse-resize"/>`;
    }
    if (s.kind === 'item') {
      const r = room(s.room), o = r && r.objetos.find(o => o.id === s.id); if (!o) return '';
      const [X, Y] = scr(r.x + o.x, r.y + o.y);
      return `<circle cx="${X}" cy="${Y}" r="1" fill="none" stroke="${C.azul}" stroke-width="2.5" stroke-dasharray="4 3" pointer-events="none"/>`;
    }
    return '';
  }

  function planDraft() {
    const d = ui.drag; if (!d || d.mode !== 'draw') return '';
    const r = { x: Math.min(d.x0, d.x1), y: Math.min(d.y0, d.y1), w: Math.abs(d.x1 - d.x0), h: Math.abs(d.y1 - d.y0) }, q = scrRect(r);
    return `<rect x="${q.X}" y="${q.Y}" width="${q.W}" height="${q.H}" fill="${C.albero}" fill-opacity="0.35" stroke="${C.azul}" stroke-width="2" stroke-dasharray="5 3"/>`
      + (r.w && r.h ? txt(q.X + q.W / 2, q.Y + q.H / 2, `${fmt(r.w)} × ${fmt(r.h)} m`, 0.55, { font: 'mono', extra: halo }) : '');
  }

  /* ---------- Corte A-A (se genera solo desde la planta; la calle queda a la izquierda) ---------- */
  function drawSection(live) {
    const { d } = state.lot, sx = state.sx, H = state.fachada.alto;
    const cut = state.rooms.filter(r => sx > r.x && sx < r.x + r.w);
    const hmax = Math.max(H, ...cut.filter(r => !r.patio).map(r => r.alto + 3)) + 1.5;
    let s = `<rect x="-2" y="${G}" width="${d + 4}" height="1.2" fill="url(#tierra)"/><line x1="-2" y1="${G}" x2="${d + 2}" y2="${G}" stroke="${C.tinta}" stroke-width="2"/>`;
    let fig = null;
    for (const r of cut) {
      const s0 = d - (r.y + r.h), Lg = r.h, sel = live && ui.sel && ui.sel.kind === 'room' && ui.sel.id === r.id;
      s += `<g data-room="${r.id}" ${live ? 'style="cursor:pointer"' : ''}>`;
      if (live) s += `<rect x="${s0}" y="${G - hmax + 1}" width="${Lg}" height="${hmax - 1}" fill="${sel ? C.albero : 'transparent'}" fill-opacity="${sel ? 0.18 : 0}"/>`;
      if (r.patio) {
        s += `<rect x="${s0}" y="${G - 0.08}" width="${Lg}" height="0.16" fill="url(#suelo-${r.suelo})" stroke="${C.tinta}" stroke-width="1"/>`;
        for (const o of r.objetos) s += `<g transform="translate(${d - (r.y + o.y)} ${G})">${OB(o.tipo).side()}</g>`;
        const ty = G - Math.min(hmax - 2, 5.5);
        s += txt(s0 + Lg / 2, ty, r.nombre, 0.5, { extra: 'font-style="italic"' }) + txt(s0 + Lg / 2, ty + 0.55, r.funcion.toUpperCase(), 0.4, { font: 'mono', fill: C.almagra });
      } else {
        const h = r.alto, top = G - h;
        s += `<rect x="${s0}" y="${top}" width="${Lg}" height="${h}" fill="#f6efdf"/>`;
        s += `<g transform="translate(${s0} ${top})">${T(r.techo).draw(Lg)}</g>`;
        if (r.tipo === 'galeria') s += `<rect x="${s0}" y="${top}" width="0.12" height="${h}" fill="${C.tinta}"/><rect x="${s0 + Lg - 0.12}" y="${top}" width="0.12" height="${h}" fill="${C.tinta}"/>`;
        else s += `<rect x="${s0 - 0.15}" y="${top}" width="0.3" height="${h}" fill="${C.tinta}"/><rect x="${s0 + Lg - 0.15}" y="${top}" width="0.3" height="${h}" fill="${C.tinta}"/>`;
        s += txt(s0 + Lg / 2, top + h * 0.45, r.nombre, clamp(Lg / 6, 0.3, 0.5), { extra: 'font-style="italic"' });
        s += txt(s0 + Lg / 2, top + h * 0.45 + 0.5, T(r.techo).nombre, clamp(Lg / 8, 0.25, 0.38), { font: 'mono', fill: C.almagra });
        if (fig === null && Lg > 2) fig = s0 + Lg * 0.25;
      }
      if (sel) s += `<rect x="${s0}" y="${G - hmax + 1}" width="${Lg}" height="${hmax - 1}" fill="none" stroke="${C.azul}" stroke-width="2.5" stroke-dasharray="6 3" pointer-events="none"/>`;
      s += '</g>';
    }
    if (!cut.length) s += txt(d / 2, G - 4, 'La línea A–A no atraviesa ningún ambiente', 0.6, { font: 'mono' });
    s += `<rect x="-0.35" y="${G - H}" width="0.35" height="${H}" fill="${C.tinta}"/>`;
    if (fig !== null) s += figura(fig);
    s += txt(-1, G + 0.9, 'CALLE', 0.45, { font: 'mono' }) + txt(d + 1, G + 0.9, 'FONDO', 0.45, { font: 'mono' });
    return { vb: [-2, G - hmax, d + 4, hmax + 1.6], body: s };
  }

  /* ---------- Fachada ---------- */
  function facBox(e) {
    const d = F(e.el);
    return FULL.has(d.cat) ? { x: 0, y: e.y, w: state.lot.w, h: d.h * e.s } : { x: e.x, y: e.y, w: d.w * e.s, h: d.h * e.s };
  }

  function drawFacade(live) {
    const { w } = state.lot, H = state.fachada.alto, top = G - H;
    let s = `<rect x="-1.2" y="${top + 1}" width="1.2" height="${H - 1}" fill="url(#semi)"/><rect x="${w}" y="${top + 1.5}" width="1.2" height="${H - 1.5}" fill="url(#semi)"/>`;
    s += `<rect x="0" y="${top}" width="${w}" height="${H}" fill="${pano().color}" stroke="${C.tinta}" stroke-width="1.6"/>`;
    for (const e of state.facade) {
      const d = F(e.el); if (!d) continue;
      const b = facBox(e);
      const inner = FULL.has(d.cat)
        ? `<g transform="translate(0 ${e.y})">${art(d, w, b.h)}</g>`
        : `<g transform="translate(${e.x} ${e.y}) scale(${e.s})"><g ${e.flip ? `transform="translate(${d.w} 0) scale(-1 1)"` : ''}>${art(d, d.w, d.h)}</g></g>`;
      s += `<g data-fac="${e.id}" ${live ? 'style="cursor:move"' : ''}>${inner}${live ? `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="transparent"/>` : ''}</g>`;
    }
    s += `<rect x="-1.2" y="${G}" width="${w + 2.4}" height="0.25" fill="${C.piedra}" stroke="${C.tinta}" stroke-width="1"/>`;
    s += txt(w / 2, G + 1, 'CALLE FERIA · SEVILLA 2126', 0.42, { font: 'mono', extra: 'letter-spacing="0.1"' });
    if (live && ui.sel && ui.sel.kind === 'fac') {
      const e = facEl(ui.sel.id);
      if (e) { const b = facBox(e); s += `<rect x="${b.x - 0.08}" y="${b.y - 0.08}" width="${b.w + 0.16}" height="${b.h + 0.16}" fill="none" stroke="${C.azul}" stroke-width="2.5" stroke-dasharray="6 3" pointer-events="none"/>`; }
    }
    return { vb: [-1.2, top - 3.5, w + 2.4, H + 5], body: s };
  }

  /* ---------- Lámina ---------- */
  function usadas() {
    const m = new Map();
    for (const f of state.facade) { const d = F(f.el); if (d) m.set(d.id, d); }
    for (const r of state.rooms) if (!r.patio) { const t = T(r.techo); m.set(t.id, t); }
    return [...m.values()].sort((a, b) => a.anio - b.anio);
  }

  function wrap(str, n) {
    const out = []; let line = '';
    for (const w of String(str).split(' ')) { if ((line + ' ' + w).trim().length > n && line) { out.push(line); line = w; } else line = (line + ' ' + w).trim(); }
    if (line) out.push(line); return out;
  }

  function drawLamina(pw = 1600, ph = 1000) {
    const t = (x, y, s, size, font = 'mono', extra = '', fill = C.tinta) => `<text x="${x}" y="${y}" font-size="${size}" font-family="${FONT[font]}" fill="${fill}" ${extra}>${esc(s)}</text>`;
    const marco = (v, x, y, w, h, titulo) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.cal}" stroke="${C.tinta}" stroke-width="1.5"/>` + t(x + 12, y + 26, titulo, 22)
      + `<svg x="${x + 10}" y="${y + 36}" width="${w - 20}" height="${h - 46}" viewBox="${v.vb.join(' ')}" preserveAspectRatio="xMidYMid meet">${v.body}</svg>`;
    let s = `<rect width="1600" height="1000" fill="${C.papel}"/><rect x="20" y="20" width="1560" height="960" fill="none" stroke="${C.tinta}" stroke-width="3"/><rect x="27" y="27" width="1546" height="946" fill="none" stroke="${C.tinta}" stroke-width="1"/>`;
    s += marco(drawPlan(false), 40, 40, 1150, 420, 'PLANTA') + marco(drawFacade(false), 40, 480, 560, 480, 'FACHADA') + marco(drawSection(false), 620, 480, 570, 480, 'CORTE A–A');
    const rx = 1210, cx = rx + 175;
    s += `<rect x="${rx}" y="40" width="350" height="920" fill="${C.cal}" stroke="${C.tinta}" stroke-width="1.5"/>`;
    for (let i = 0; i < 25; i++) for (let j = 0; j < 2; j++) s += `<rect x="${rx + i * 14}" y="${40 + j * 14}" width="14" height="14" fill="${(i + j) % 2 ? C.azul : C.cal}"/>`;
    let y = 120;
    s += t(cx, y, 'Frentistas del Futuro', 34, 'sc', 'text-anchor="middle"'); y += 30;
    s += t(cx, y, 'calle Feria · Sevilla · 2126', 20, 'mono', 'text-anchor="middle"'); y += 50;
    for (const l of wrap(state.nombre || 'Casa sin nombre', 20)) { s += t(rx + 20, y, l, 30, 'serif', 'font-style="italic"'); y += 34; }
    y += 6; s += t(rx + 20, y, 'FRENTISTA: ' + (state.frentista || '—').toUpperCase(), 19); y += 34;
    const cub = state.rooms.filter(r => !r.patio).reduce((a, r) => a + r.w * r.h, 0), pats = state.rooms.filter(r => r.patio);
    s += t(rx + 20, y, `Lote ${fmt(state.lot.w)} × ${fmt(state.lot.d)} m · cubierto ${fmt(cub)} m²`, 19); y += 24;
    s += t(rx + 20, y, `${pats.length} patio${pats.length === 1 ? '' : 's'} · ${fmt(pats.reduce((a, r) => a + r.w * r.h, 0))} m²`, 19); y += 24;
    for (const p of pats.slice(0, 4)) { s += t(rx + 32, y, `· ${p.nombre}: ${p.funcion.toLowerCase()}`, 17); y += 21; }
    y += 18; s += `<line x1="${rx + 20}" y1="${y - 14}" x2="${rx + 330}" y2="${y - 14}" stroke="${C.tinta}" stroke-dasharray="4 3"/>`;
    s += t(rx + 20, y + 8, 'Índice de procedencias', 24, 'sc'); y += 36;
    const lista = usadas(), cabe = Math.floor((900 - y) / 22);
    lista.slice(0, cabe).forEach(d => { s += t(rx + 20, y, d.nombre, 16, 'serif') + t(rx + 330, y, d.epoca, 14, 'mono', 'text-anchor="end"', C.almagra); y += 22; });
    if (lista.length > cabe) s += t(rx + 20, y, `… y ${lista.length - cabe} más`, 16);
    s += t(rx + 20, 930, `${lista.length} piezas del archivo · 0 piezas nuevas`, 18, 'mono', '', C.almagra);
    s += t(rx + 20, 950, new Date().toLocaleDateString('es-AR'), 16);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}" viewBox="0 0 1600 1000">${STYLE}${DEFS}${s}</svg>`;
  }

  /* ---------- Render ---------- */
  const stage = $('#stage');

  function renderView() {
    const v = vista();
    let out;
    if (v === 'lamina') { out = drawLamina(); stage.style.aspectRatio = '1600 / 1000'; }
    else {
      const r = v === 'planta' ? drawPlan(true) : v === 'fachada' ? drawFacade(true) : drawSection(true);
      out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r.vb.join(' ')}" preserveAspectRatio="xMidYMid meet">${r.body}</svg>`;
      stage.style.aspectRatio = `${r.vb[2]} / ${r.vb[3]}`;
    }
    stage.innerHTML = out;
    stage.dataset.view = v;
    renderAviso();
  }

  const nombreHoja = h => ({ fac: F, amb: A, patio: PT, obj: OB, techo: T }[h.kind](h.id) || {}).nombre;

  // Cartel que explica qué está pasando y qué hacer después
  function renderAviso() {
    const t = ui.tool, s = ui.sel, v = vista(), el = $('#aviso');
    let msg, modo = 'info', cancelar = false;
    if (t) {
      modo = 'tool'; cancelar = true;
      const n = `«${nombreHoja(t)}»`;
      msg = t.kind === 'obj' ? `Colocando ${n}: hacé clic adentro de un patio de la planta.`
        : t.kind === 'fac' ? `Colocando ${n}: hacé clic sobre la fachada, donde la quieras.`
        : t.kind === 'techo' ? `Techo ${n} elegido: hacé clic sobre un ambiente del corte para ponérselo.`
        : `Colocando ${n}: hacé clic en la planta para ubicarlo, o arrastrá para dibujarlo del tamaño que quieras.`;
    } else if (s && s.kind === 'room' && room(s.id)) {
      const r = room(s.id); modo = 'sel'; cancelar = true;
      msg = v === 'corte' ? `Seleccionaste «${r.nombre}». ${r.patio ? 'Los patios no llevan techo.' : 'Elegí un techo en el archivo o en la ficha de la derecha.'}`
        : `Seleccionaste «${r.nombre}». Arrastralo para moverlo, tirá del cuadrito azul para cambiar su tamaño, o editalo en la ficha de la derecha.${r.patio ? ' Para sumarle objetos, abrí «Objetos de patio» en el archivo.' : ''}`;
    } else if (s && s.kind === 'item') { modo = 'sel'; cancelar = true; msg = 'Seleccionaste un objeto del patio. Arrastralo para moverlo; para quitarlo usá la ficha o la tecla Supr.'; }
    else if (s && s.kind === 'fac' && facEl(s.id)) { const d = F(facEl(s.id).el); modo = 'sel'; cancelar = true; msg = `Seleccionaste «${d.nombre}» (${d.epoca}). Arrastrala para moverla; en la ficha podés escalarla, espejarla o borrarla.`; }
    else msg = {
      patios: state.rooms.some(r => r.patio) ? 'Elegí otro tipo de patio en el archivo, o tocá un patio de la planta para cambiar su tamaño, función u objetos. Cuando estén listos, seguí con los ambientes.' : 'Empezá eligiendo un tipo de patio en el archivo de arriba.',
      ambientes: 'Elegí un ambiente en el archivo de arriba, o hacé clic en uno de la planta para editarlo. Los patios quedan fijos.',
      fachada: 'Elegí una pieza en el archivo de arriba, o hacé clic en una pieza de la fachada para editarla.',
      techos: 'Hacé clic en un ambiente del corte para elegir su techo.', lamina: 'Exportá la lámina como imagen (PNG) o como dibujo vectorial (SVG).' }[ui.paso];
    el.className = 'aviso ' + modo;
    el.innerHTML = `<span>${esc(msg)}</span>${cancelar ? `<button class="btn" id="b-cancelar">${t ? 'Cancelar' : 'Listo'}</button>` : ''}`;
    const b = $('#b-cancelar'); if (b) b.onclick = () => { ui.tool = null; ui.sel = null; commit(true); };
  }

  function renderArchivo() {
    const box = $('#archivo');
    box.hidden = ui.paso === 'lamina';
    $('#exportar').hidden = ui.paso !== 'lamina';
    if (ui.paso === 'lamina') return;
    Archivo.render($('#archivo-mapa'), ARBOLES[ui.paso], ui.camino[ui.paso], {
      usos: h => h.kind === 'fac' ? state.facade.filter(f => f.el === h.id).length
        : h.kind === 'amb' ? state.rooms.filter(r => !r.patio && r.tipo === h.id).length
        : h.kind === 'patio' ? state.rooms.filter(r => r.patio && r.tipo === h.id).length
        : h.kind === 'obj' ? state.rooms.filter(r => r.patio).reduce((a, r) => a + r.objetos.filter(o => o.tipo === h.id).length, 0)
        : state.rooms.filter(r => !r.patio && r.techo === h.id).length,
      armado: h => !!ui.tool && ui.tool.kind === h.kind && ui.tool.id === h.id,
      thumb,
      onClick: elegirNodo
    });
  }

  function irAMesa() {
    const r = $('#trabajo').getBoundingClientRect();
    if (r.top > window.innerHeight * 0.5 || r.top < 0) $('#trabajo').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function elegirNodo(n, ci) {
    const cam = ui.camino[ui.paso];
    if (ci === 0) { ui.camino[ui.paso] = []; ui.tool = null; renderArchivo(); return renderAviso(); }
    const nivel = ci - 1;
    if (n.hoja) {
      ui.camino[ui.paso] = cam.slice(0, nivel).concat(n.id);
      const igual = ui.tool && ui.tool.kind === n.hoja.kind && ui.tool.id === n.hoja.id;
      if (n.hoja.kind === 'techo') {
        const r = ui.sel && ui.sel.kind === 'room' && room(ui.sel.id);
        if (r && !r.patio) { r.techo = n.hoja.id; ui.tool = null; commit(true); toast(`${r.nombre}: ${T(r.techo).nombre}`); irAMesa(); return; }
      }
      ui.tool = igual ? null : { ...n.hoja };
      if (ui.tool) { ui.sel = null; renderFicha(); irAMesa(); }
    } else {
      ui.camino[ui.paso] = cam[nivel] === n.id ? cam.slice(0, nivel) : cam.slice(0, nivel).concat(n.id);
    }
    renderArchivo(); renderView();
  }

  function setPaso(p) {
    if (p === 'ambientes' && !state.rooms.some(r => r.patio)) { toast('Primero ubicá al menos un patio: la casa se arma alrededor de él.'); p = 'patios'; }
    ui.paso = p; ui.tool = null; ui.drag = null;
    const r = ui.sel && ui.sel.kind === 'room' && room(ui.sel.id);
    if (ui.sel && ui.sel.kind === 'fac' && p !== 'fachada') ui.sel = null;
    if (ui.sel && ui.sel.kind !== 'fac' && p === 'fachada') ui.sel = null;
    if (ui.sel && ui.sel.kind === 'item' && p !== 'patios') ui.sel = null;
    if (r && ((p === 'patios' && !r.patio) || (p === 'ambientes' && r.patio))) ui.sel = null;
    if (p === 'lamina') ui.sel = null;
    const sig = PASOS[p].sig;
    $('#b-siguiente').hidden = !sig;
    if (sig) $('#b-siguiente').textContent = `Listo, seguir con: ${PASOS[sig].titulo} →`;
    document.querySelectorAll('#pasos button').forEach(b => b.classList.toggle('on', b.dataset.paso === p));
    const info = PASOS[p];
    $('#paso-titulo').innerHTML = `<b>Paso ${info.n}</b> ${info.titulo}`;
    $('#paso-texto').textContent = info.texto;
    $('#mesa-titulo').textContent = { planta: 'Planta', fachada: 'Fachada', corte: 'Corte A–A', lamina: 'Lámina' }[info.vista];
    document.body.dataset.paso = p;
    renderArchivo(); renderView(); renderFicha();
  }

  function renderStatus() {
    const rooms = state.rooms, pats = rooms.filter(r => r.patio), lote = state.lot.w * state.lot.d;
    const cub = rooms.filter(r => !r.patio).reduce((a, r) => a + r.w * r.h, 0), pa = pats.reduce((a, r) => a + r.w * r.h, 0);
    const estilos = new Set(usadas().map(d => d.estilo)).size;
    $('#status').innerHTML = `<span>Lote ${fmt(state.lot.w)}×${fmt(state.lot.d)} m</span><span>Cubierto ${fmt(cub)} m²</span>`
      + `<span>Patios ${pats.length} · ${fmt(pa)} m² (${Math.round(pa / lote * 100)}%)</span><span>Estilos mezclados: ${estilos}</span><span>Piezas nuevas: 0</span>`
      + (pats.length ? '' : '<span class="warn">⚠ Toda casa necesita al menos un patio</span>')
      + (() => { const sin = rooms.length ? calcularPuertas().sinAcceso : []; return sin.length ? `<span class="warn">⚠ Sin acceso: ${sin.map(r => esc(r.nombre)).join(', ')} (sumá un pasillo o movelos)</span>` : ''; })();
  }

  function commit(full) {
    renderView(); renderStatus(); renderArchivo();
    if (full) renderFicha();
    save();
  }

  /* ---------- Ficha (panel derecho) ---------- */
  function renderFicha() {
    const s = ui.sel, box = $('#ficha-body'); let h = '';
    const num = (f, v, min, max, step, lab) => `<label>${lab}<input type="number" data-f="${f}" value="${v}" min="${min}" max="${max}" step="${step}"></label>`;
    const sel = (f, v, opts, lab) => `<label>${lab}<select data-f="${f}">${opts.map(([id, n]) => `<option value="${esc(id)}" ${id === v ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>`;
    const text = (f, v, lab) => `<label>${lab}<input type="text" data-f="${f}" value="${esc(v)}"></label>`;
    const rango = (f, v, min, max, step, lab, out) => `<label>${lab} <output>${out}</output><input type="range" data-f="${f}" min="${min}" max="${max}" step="${step}" value="${v}"></label>`;
    const tam = r => `<div class="row">${num('w', r.w, 1, state.lot.w, 0.5, 'Ancho (m)')}${num('h', r.h, 1, state.lot.d, 0.5, 'Profundidad (m)')}</div>`;
    const btn = (act, lab, cls = '') => `<button class="btn ${cls}" data-act="${act}">${lab}</button>`;
    const v = vista();

    if (!s) {
      if (v === 'corte') h = `<div class="ftit">El corte</div><p class="desc">El corte atraviesa la casa a lo largo, por la línea roja A–A de la planta. Movela para cortar por otro lado.</p>`
        + rango('sx', state.sx, 0.25, state.lot.w - 0.25, 0.25, 'Posición del corte', `${fmt(state.sx)} m`);
      else if (v === 'fachada') h = `<div class="ftit">La fachada</div><p class="desc">El frente sobre calle Feria. Las molduras y los zócalos ocupan todo el ancho; el resto se ubica donde quieras.</p>`
        + num('fachada.alto', state.fachada.alto, 4, 12, 0.5, 'Altura de fachada (m)')
        + `<label>Color del paño</label><div class="swatches">${CAT.panos.map(p => `<button class="sw ${p.id === state.fachada.pano ? 'on' : ''}" data-act="pano" data-id="${p.id}" title="${p.nombre}" style="background:${p.color}"></button>`).join('')}</div>`;
      else h = `<div class="ftit">El lote</div><div class="fep">Calle Feria · Sevilla · 2126</div>`
        + `<p class="desc">La casa de Caballito aterrizó en Sevilla. Los frentistas del futuro no inventan: eligen en el archivo y recombinan.</p>`
        + text('frentista', state.frentista, 'Frentista (quién diseña)')
        + `<div class="row">${num('lot.w', state.lot.w, 6, 20, 0.5, 'Frente (m)')}${num('lot.d', state.lot.d, 12, 50, 0.5, 'Fondo (m)')}</div>`;
    } else if (s.kind === 'room') {
      const r = room(s.id);
      if (!r.patio) h = `<div class="ftit">${esc(r.nombre)}</div><div class="fep">Ambiente · ${fmt(r.w * r.h)} m²</div>`
        + text('nombre', r.nombre, 'Nombre') + sel('tipo', r.tipo, CAT.ambientes.map(a => [a.id, a.nombre]), 'Tipo') + tam(r)
        + rango('alto', r.alto, 2.4, 7, 0.1, 'Altura interior', `${fmt(r.alto)} m`)
        + `<label>Techo</label><div class="techo-ficha">${thumb({ kind: 'techo', id: r.techo })}</div>`
        + sel('techo', r.techo, CAT.techos.map(t => [t.id, `${t.nombre} · ${t.epoca}`]), '')
        + `<div class="acts">${btn('borrar', 'Borrar ambiente', 'peligro')}</div>`;
      else h = `<div class="ftit">${esc(r.nombre)}</div><div class="fep">Patio · ${fmt(r.w * r.h)} m²</div>`
        + text('nombre', r.nombre, 'Nombre') + sel('tipo', r.tipo, CAT.patios.map(p => [p.id, p.nombre]), 'Tipo')
        + sel('funcion', r.funcion, CAT.funciones.map(f => [f, f]), 'Función') + sel('suelo', r.suelo, CAT.suelos.map(x => [x.id, x.nombre]), 'Suelo') + tam(r)
        + `<label>Objetos</label><ul class="objs">${r.objetos.map(o => `<li>${esc(OB(o.tipo).nombre)}<button data-act="del-obj" data-id="${o.id}" title="Quitar">×</button></li>`).join('') || '<li class="vacio">Sin objetos: sumalos desde Archivo › Objetos de patio.</li>'}</ul>`
        + `<div class="acts">${btn('borrar', 'Borrar patio', 'peligro')}</div>`;
    } else if (s.kind === 'item') {
      const r = room(s.room), o = r.objetos.find(o => o.id === s.id), d = OB(o.tipo);
      h = `<div class="fthumb">${thumb({ kind: 'obj', id: d.id })}</div><div class="ftit">${esc(d.nombre)}</div><div class="fep">En ${esc(r.nombre)}</div><p class="desc">${esc(d.desc)}</p><div class="acts">${btn('borrar', 'Quitar', 'peligro')}</div>`;
    } else if (s.kind === 'fac') {
      const e = facEl(s.id), d = F(e.el);
      h = `<div class="fthumb">${thumb({ kind: 'fac', id: d.id })}</div><div class="ftit">${esc(d.nombre)}</div><div class="fep">${esc(EST(d.estilo).nombre)} · ${esc(d.epoca)}</div><p class="desc">${esc(d.desc)}</p>`
        + rango('s', e.s, 0.4, 2.5, 0.05, 'Escala', `${e.s.toFixed(2)}×`)
        + `<div class="acts">${FULL.has(d.cat) ? '' : btn('espejar', 'Espejar')}${btn('duplicar', 'Duplicar')}${btn('frente', 'Al frente')}${btn('atras', 'Atrás')}${btn('borrar', 'Borrar', 'peligro')}</div>`;
    }
    box.innerHTML = h;
    box.querySelectorAll('[data-f]').forEach(inp => inp.addEventListener(inp.type === 'number' || inp.tagName === 'SELECT' ? 'change' : 'input', () => setField(inp)));
    box.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => act(b.dataset.act, b.dataset.id)));
  }

  function setField(inp) {
    const f = inp.dataset.f, s = ui.sel, out = inp.parentElement.querySelector('output');
    let v = inp.type === 'number' || inp.type === 'range' ? parseFloat(inp.value) : inp.value;
    if ((inp.type === 'number' || inp.type === 'range') && !isFinite(v)) return renderFicha();
    if (!s) {
      if (f === 'lot.w' || f === 'lot.d') {
        const k = f.slice(4), need = Math.max(k === 'w' ? 6 : 12, ...state.rooms.map(r => k === 'w' ? r.x + r.w : r.y + r.h));
        if (v < need) toast(`Hay ambientes que no entrarían: el mínimo es ${fmt(need)} m.`);
        state.lot[k] = clamp(snap(v), need, k === 'w' ? 20 : 50);
        state.sx = clamp(state.sx, 0.25, state.lot.w - 0.25);
        return commit(true);
      }
      if (f === 'fachada.alto') state.fachada.alto = clamp(snap(v), 4, 12);
      else if (f === 'sx') { state.sx = v; if (out) out.textContent = `${fmt(v)} m`; }
      else state[f] = v;
      return commit(false);
    }
    if (s.kind === 'room') {
      const r = room(s.id);
      if (f === 'w' || f === 'h') {
        const c = { ...r, [f]: snap(v) };
        if (c.w < 1 || c.h < 1 || c.x + c.w > state.lot.w || c.y + c.h > state.lot.d || overlaps(c)) { toast('No entra: se sale del lote o se superpone con otro ambiente.'); return renderFicha(); }
        r[f] = c[f]; clampItems(r); return commit(true);
      }
      if (f === 'tipo') {
        const viejo = r.patio ? PT(r.tipo) : A(r.tipo), nuevo = r.patio ? PT(v) : A(v);
        if (r.nombre === viejo.nombre) r.nombre = nuevo.nombre;
        r.tipo = v;
        if (r.patio) { r.suelo = nuevo.suelo; r.funcion = nuevo.funcion; }
        return commit(true);
      }
      r[f] = v;
      if (out) out.textContent = `${fmt(v)} m`;
      if (f === 'nombre') $('#ficha-body .ftit').textContent = v;
      if (f === 'techo') return commit(true);
      return commit(false);
    }
    if (s.kind === 'fac') { facEl(s.id).s = v; if (out) out.textContent = `${v.toFixed(2)}×`; return commit(false); }
  }

  function act(a, id) {
    const s = ui.sel;
    if (a === 'pano') { state.fachada.pano = id; return commit(true); }
    if (a === 'borrar') return borrarSel();
    if (a === 'del-obj') { const r = room(s.id); r.objetos = r.objetos.filter(o => o.id !== id); return commit(true); }
    const e = s && s.kind === 'fac' && facEl(s.id); if (!e) return;
    if (a === 'espejar') e.flip = !e.flip;
    if (a === 'duplicar') { const c = { ...e, id: uid(), x: e.x + 0.5, y: FULL.has(F(e.el).cat) ? e.y - 0.5 : e.y }; state.facade.push(c); ui.sel = { kind: 'fac', id: c.id }; return commit(true); }
    if (a === 'frente') state.facade = state.facade.filter(x => x !== e).concat(e);
    if (a === 'atras') state.facade = [e].concat(state.facade.filter(x => x !== e));
    commit(false);
  }

  function borrarSel() {
    const s = ui.sel; if (!s) return;
    if (s.kind === 'room') state.rooms = state.rooms.filter(r => r.id !== s.id);
    if (s.kind === 'item') { const r = room(s.room); r.objetos = r.objetos.filter(o => o.id !== s.id); }
    if (s.kind === 'fac') state.facade = state.facade.filter(f => f.id !== s.id);
    ui.sel = null; commit(true);
  }

  /* ---------- Interacción con el mouse ---------- */
  function pt(e) {
    const svg = stage.querySelector('svg'), p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    const q = p.matrixTransform(svg.getScreenCTM().inverse());
    return vista() === 'planta' ? { x: q.y, y: state.lot.d - q.x } : q;   // en planta, pasar de pantalla a coordenadas del lote
  }

  stage.addEventListener('pointerdown', e => {
    const v = vista();
    if (v === 'planta') downPlan(e);
    else if (v === 'fachada') downFacade(e);
    else if (v === 'corte') downCorte(e);
  });

  window.addEventListener('pointercancel', () => { ui.drag = null; renderView(); });

  function downPlan(e) {
    const p = pt(e), tool = ui.tool, t = e.target;
    ui.drag = null;   // si un arrastre anterior quedó colgado, se descarta
    if (tool && (tool.kind === 'amb' || tool.kind === 'patio')) { const x = snap(p.x), y = snap(p.y); ui.drag = { mode: 'draw', x0: x, y0: y, x1: x, y1: y }; return renderView(); }
    if (tool && tool.kind === 'obj') {
      const r = state.rooms.find(r => r.patio && inside(p, r));
      if (!r) return toast('Los objetos van adentro de un patio.');
      const o = { id: uid(), tipo: tool.id, x: snap(p.x - r.x, 0.25), y: snap(p.y - r.y, 0.25) };
      r.objetos.push(o); ui.sel = { kind: 'item', room: r.id, id: o.id }; ui.tool = null;
      return commit(true);
    }
    const h = t.closest('[data-handle]'), it = t.closest('[data-item]'), rm = t.closest('[data-room]');
    if (h && h.dataset.handle === 'corte') ui.drag = { mode: 'corte' };
    else if (h && h.dataset.handle === 'resize') ui.drag = { mode: 'resize', id: ui.sel.id };
    else if (it) { ui.sel = { kind: 'item', room: it.dataset.room, id: it.dataset.item }; ui.drag = { mode: 'item' }; }
    else if (rm) { const r = room(rm.dataset.room); ui.sel = { kind: 'room', id: r.id }; ui.drag = { mode: 'move', dx: p.x - r.x, dy: p.y - r.y }; }
    else ui.sel = null;
    commit(true);
  }

  function downFacade(e) {
    const p = pt(e);
    if (ui.tool && ui.tool.kind === 'fac') {
      const d = F(ui.tool.id), full = FULL.has(d.cat);
      const n = { id: uid(), el: d.id, s: 1, flip: false, x: full ? 0 : snap(p.x - d.w / 2, 0.05), y: snap(p.y - d.h / 2, 0.05) };
      if (d.cat === 'zocalo' || d.cat === 'puerta') n.y = G - d.h;
      state.facade.push(n); ui.sel = { kind: 'fac', id: n.id }; ui.tool = null;
      return commit(true);
    }
    const f = e.target.closest('[data-fac]');
    if (f) { const el = facEl(f.dataset.fac); ui.sel = { kind: 'fac', id: el.id }; ui.drag = { mode: 'fac', dx: p.x - el.x, dy: p.y - el.y }; }
    else ui.sel = null;
    commit(true);
  }

  function downCorte(e) {
    const rm = e.target.closest('[data-room]'), r = rm && room(rm.dataset.room);
    if (ui.tool && ui.tool.kind === 'techo') {
      if (!r || r.patio) return toast(r ? 'Los patios no llevan techo: elegí un ambiente cubierto.' : 'Hacé clic sobre un ambiente del corte.');
      r.techo = ui.tool.id; ui.sel = { kind: 'room', id: r.id };
      toast(`${r.nombre}: ${T(r.techo).nombre}`);
      return commit(true);
    }
    ui.sel = r ? { kind: 'room', id: r.id } : null;
    commit(true);
  }

  window.addEventListener('pointermove', e => {
    const d = ui.drag; if (!d) return;
    const p = pt(e), { w: lw, d: ld } = state.lot;
    if (d.mode === 'draw') { d.x1 = snap(p.x); d.y1 = snap(p.y); }
    else if (d.mode === 'corte') state.sx = clamp(snap(p.x, 0.25), 0.25, lw - 0.25);
    else if (d.mode === 'move') {
      const r = room(ui.sel.id), nx = clamp(snap(p.x - d.dx), 0, lw - r.w), ny = clamp(snap(p.y - d.dy), 0, ld - r.h);
      if (!overlaps({ ...r, x: nx, y: ny })) { r.x = nx; r.y = ny; }
    } else if (d.mode === 'resize') {
      // El cuadrito está en la esquina de abajo a la derecha en pantalla: cambia el ancho y el borde del fondo.
      const r = room(d.id), nw = clamp(snap(p.x - r.x), 1, lw - r.x), ny = clamp(snap(p.y), 0, r.y + r.h - 1), nh = r.y + r.h - ny;
      if (!overlaps({ ...r, w: nw, y: ny, h: nh })) { r.w = nw; r.y = ny; r.h = nh; clampItems(r); }
    } else if (d.mode === 'item') {
      const r = room(ui.sel.room), o = r.objetos.find(o => o.id === ui.sel.id);
      o.x = clamp(snap(p.x - r.x, 0.25), 0, r.w); o.y = clamp(snap(p.y - r.y, 0.25), 0, r.h);
    } else if (d.mode === 'fac') {
      const el = facEl(ui.sel.id), b = facBox(el), H = state.fachada.alto;
      if (!FULL.has(F(el.el).cat)) el.x = clamp(snap(p.x - d.dx, 0.05), -b.w / 2, lw - b.w / 2);
      el.y = clamp(snap(p.y - d.dy, 0.05), G - H - 3.5, G - b.h);
      if (Math.abs(el.y + b.h - G) < 0.15) el.y = G - b.h;
    }
    d.moved = true;
    renderView(); renderStatus();
  });

  window.addEventListener('pointerup', () => {
    const d = ui.drag; if (!d) return;
    ui.drag = null;
    if (d.mode === 'draw') {
      const tool = ui.tool, def = tool.kind === 'amb' ? A(tool.id) : PT(tool.id), { w: lw, d: ld } = state.lot;
      let x = Math.min(d.x0, d.x1), y = Math.min(d.y0, d.y1), w = Math.abs(d.x1 - d.x0), h = Math.abs(d.y1 - d.y0);
      if (w < 1 || h < 1) { w = Math.min(def.w, lw); h = Math.min(def.h, ld); x = clamp(snap(d.x0 - w / 2), 0, lw - w); y = clamp(snap(d.y0 - h / 2), 0, ld - h); }
      x = clamp(x, 0, lw); y = clamp(y, 0, ld); w = Math.min(w, lw - x); h = Math.min(h, ld - y);
      const r = tool.kind === 'amb'
        ? { id: uid(), tipo: def.id, patio: false, nombre: def.nombre, x, y, w, h, alto: 4.2, techo: def.techo }
        : { id: uid(), tipo: def.id, patio: true, nombre: def.nombre, x, y, w, h, funcion: def.funcion, suelo: def.suelo, objetos: [] };
      if (w < 1 || h < 1 || overlaps(r)) { toast('No entra ahí: se superpone con otro ambiente o se sale del lote. Probá en un lugar libre, o borrá algo antes.'); return renderView(); }
      state.rooms.push(r); ui.sel = { kind: 'room', id: r.id }; ui.tool = null;
      return commit(true);
    }
    if (d.moved) commit(true);
  });

  document.addEventListener('keydown', e => {
    if (e.target.matches('input, select, textarea')) return;
    if (e.key === 'Escape') { ui.tool = null; ui.drag = null; ui.sel = null; commit(true); }
    if ((e.key === 'Delete' || e.key === 'Backspace') && ui.sel) { e.preventDefault(); borrarSel(); }
  });

  /* ---------- Remix del archivo: una casa entera al azar (planta, techos del corte y fachada) ---------- */
  const rnd = (a, b) => a + Math.random() * (b - a);
  const elegir = l => l[Math.floor(Math.random() * l.length)];
  const mezclar = l => l.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(v => v[1]);

  // La planta se arma en franjas desde la calle hacia el fondo: adelante zaguán y living, después
  // franjas de ambientes y de patios alternadas (patio entero, central o lateral) y al fondo un patio o huerta.
  function remixPlanta() {
    const { w, d } = state.lot, rooms = [];
    const amb = (tipo, x, y, rw, rh) => rooms.push({ id: uid(), tipo, patio: false, nombre: A(tipo).nombre, x, y, w: rw, h: rh, alto: snap(rnd(3.6, 5), 0.1), techo: elegir(CAT.techos).id });
    const pat = (tipo, x, y, rw, rh) => {
      const p = PT(tipo), n = Math.floor(rnd(1, 4)), largo = rw >= rh;
      const objetos = Array.from({ length: n }, (_, i) => ({ id: uid(), tipo: elegir(CAT.objetos).id,
        x: snap(largo ? rw * (i + 1) / (n + 1) : rw / 2, 0.25), y: snap(largo ? rh / 2 : rh * (i + 1) / (n + 1), 0.25) }));
      rooms.push({ id: uid(), tipo, patio: true, nombre: p.nombre, x, y, w: rw, h: rh, objetos,
        funcion: Math.random() < 0.5 ? p.funcion : elegir(CAT.funciones), suelo: Math.random() < 0.6 ? p.suelo : elegir(CAT.suelos).id });
    };
    const partir = (x0, ancho, n, min) => { n = Math.max(1, Math.min(n, Math.floor(ancho / min))); const a = snap(ancho / n); return Array.from({ length: n }, (_, i) => [x0 + i * a, i < n - 1 ? a : ancho - (n - 1) * a]); };
    const pool = mezclar(['comedor', 'cocina', 'dormitorio', 'dormitorio', 'bano', 'estudio', 'taller', 'dormitorio']);
    const hayBano = () => rooms.some(r => r.tipo === 'bano');
    const siguiente = () => {   // un solo baño por casa
      let t = pool.length ? pool.shift() : elegir(['dormitorio', 'estudio', 'comedor']);
      if (t === 'bano' && hayBano()) t = elegir(['dormitorio', 'estudio']);
      return t;
    };

    // Frente sobre calle Feria: el zaguán queda del lado de la circulación
    const fl = snap(rnd(4.5, 5.5)), zIzq = Math.random() < 0.5;
    let y = d - fl;
    amb('zaguan', zIzq ? 0 : w - 2, y, 2, fl);
    partir(zIzq ? 2 : 0, w - 2, w - 2 > 6 ? 2 : 1, 2.5).forEach(([x, a], i) => amb(i === 0 ? 'living' : 'estudio', x, y, a, fl));

    // Una galería o un pasillo recorre la casa de adelante hacia el fondo, del lado del zaguán:
    // así todos los ambientes y patios del medio quedan conectados.
    const sw = elegir([1.2, 1.5]), x0 = zIzq ? sw : 0, W2 = w - sw;
    let ultima = 'amb';
    while (y > 0) {
      if (y <= 6.5) { pat(elegir(['huerta', 'patio-trabajo', 'patio-naranjos']), 0, 0, w, y); break; }
      let len = snap(rnd(3.5, 6)); if (y - len < 3.5) len = y - 3.5;
      y -= len;
      if (ultima === 'amb' ? Math.random() < 0.65 : Math.random() < 0.2) {
        const tipo = elegir(['patio-principal', 'patio-naranjos', 'patio-agua', 'patio-luz']), modo = elegir(W2 >= 7 ? ['total', 'centro', 'lado'] : W2 >= 6.5 ? ['total', 'lado'] : ['total']);
        if (modo === 'total') pat(tipo, x0, y, W2, len);
        else if (modo === 'centro') { const s = snap(rnd(2.5, 3)); amb(siguiente(), x0, y, s, len); pat(tipo, x0 + s, y, W2 - 2 * s, len); amb(siguiente(), x0 + W2 - s, y, s, len); }
        else { const s = snap(rnd(3.5, Math.min(5, W2 - 3))), izq = Math.random() < 0.5; amb(siguiente(), izq ? x0 : x0 + W2 - s, y, s, len); pat(tipo, izq ? x0 + s : x0, y, W2 - s, len); }
        ultima = 'patio';
      } else {
        partir(x0, W2, elegir(W2 > 7 ? [2, 3] : [1, 2]), 2.5).forEach(([x, a]) => amb(a < 2.6 && !hayBano() ? 'bano' : siguiente(), x, y, a, len));
        ultima = 'amb';
      }
    }
    const fondo = Math.min(...rooms.filter(r => r.y === 0).map(r => r.h)), largo = d - fl - fondo;
    if (largo >= 1) amb(sw >= 1.5 ? 'galeria' : 'pasillo', zIzq ? 0 : w - sw, fondo, sw, largo);
    if (!hayBano()) {   // si no salió ningún baño, el ambiente más chico del medio pasa a serlo
      const r = rooms.filter(r => !r.patio && !['zaguan', 'living', 'galeria', 'pasillo'].includes(r.tipo)).sort((a, b) => a.w * a.h - b.w * b.h)[0];
      if (r) { r.tipo = 'bano'; r.nombre = A('bano').nombre; r.techo = elegir(CAT.techos).id; }
    }
    state.rooms = rooms;
    const p = elegir(rooms.filter(r => r.patio));
    state.sx = clamp(snap(p.x + p.w / 2, 0.25), 0.25, w - 0.25);   // el corte pasa por un patio
    return rooms.filter(r => r.y + r.h === d).sort((a, b) => a.x - b.x);
  }

  // La fachada responde a la planta: la puerta va frente al zaguán y las ventanas frente a los otros ambientes del frente.
  function remixFachada(frente) {
    const pick = cat => elegir(CAT.fachada.filter(e => e.cat === cat));
    const azar = p => Math.random() < p;
    const { w } = state.lot, H = state.fachada.alto = snap(rnd(6, 9)), top = G - H, f = [];
    const add = (d, x, y, s = 1, flip = false) => f.push({ id: uid(), el: d.id, x, y, s, flip });
    const z = pick('zocalo'); add(z, 0, G - z.h);
    if (azar(0.6)) { const c = pick('columna'), s = (H - z.h - 0.6) / c.h; add(c, 0.15, G - z.h - c.h * s, s); add(c, w - 0.15 - c.w * s, G - z.h - c.h * s, s); }
    if (azar(0.5)) add(pick('moldura'), 0, top + H * 0.45);
    add(pick('moldura'), 0, top);
    const puerta = pick('puerta'), ven = pick('ventana'), ds = Math.min(1, (H - 1.5) / puerta.h);
    let px = w / 2;
    for (const r of frente) {
      const cx = r.x + r.w / 2;
      if (r.tipo === 'zaguan') { px = cx; add(puerta, cx - puerta.w * ds / 2, G - puerta.h * ds, ds); }
      else { const vs = Math.min(1, (r.w - 0.6) / ven.w); add(ven, cx - ven.w * vs / 2, Math.min(G - H * 0.45 - ven.h * vs / 2, G - 0.3 - ven.h * vs), vs); }
    }
    if (azar(0.5)) { const o = pick('ornamento'); add(o, px - o.w / 2, G - puerta.h * ds - o.h - 0.25); }
    const r = pick('remate'); add(r, w / 2 - r.w / 2, top - r.h + 0.05);
    state.facade = f;
    state.fachada.pano = elegir(CAT.panos).id;
    return [puerta, ven, r];
  }

  function remix() {
    const frente = remixPlanta(), piezas = remixFachada(frente);
    const pats = state.rooms.filter(r => r.patio).length, ambs = state.rooms.length - pats;
    ui.sel = null; ui.tool = null;
    setPaso('lamina'); commit(true);
    toast(`Remix: ${pats} patio${pats === 1 ? '' : 's'}, ${ambs} ambientes · ${piezas.map(d => EST(d.estilo).nombre).join(' + ')}`);
  }

  /* ---------- Archivos ---------- */
  const slug = () => (state.nombre || 'casa').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'casa';
  function bajar(nombre, blob) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  function exportarPNG() {
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement('canvas'); cv.width = 3200; cv.height = 2000;
      cv.getContext('2d').drawImage(img, 0, 0, 3200, 2000);
      cv.toBlob(b => bajar(slug() + '.png', b));
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(drawLamina(3200, 2000));
  }

  let toastT;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3500);
  }

  /* ---------- Inicio ---------- */
  document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${DEFS}</svg>`);
  const nombre = $('#nombre');
  nombre.value = state.nombre;
  nombre.addEventListener('input', () => { state.nombre = nombre.value; save(); if (vista() === 'lamina') renderView(); });
  document.querySelectorAll('#pasos button').forEach(b => b.addEventListener('click', () => setPaso(b.dataset.paso)));
  $('#b-remix').onclick = remix;
  $('#b-nueva').onclick = () => {
    if (!confirm('¿Empezar una casa vacía? Si no guardaste la actual, se pierde.')) return;
    state = casaVacia();
    nombre.value = state.nombre; ui.sel = null; ui.tool = null; setPaso('patios'); commit(true);
  };
  $('#b-original').onclick = () => {
    if (!confirm('¿Volver a la casa chorizo original? Si no guardaste la actual, se pierde.')) return;
    state = casaInicial(); nombre.value = state.nombre; ui.sel = null; ui.tool = null; commit(true);
  };
  $('#b-guardar').onclick = () => bajar(slug() + '.json', new Blob([JSON.stringify(state, null, 1)], { type: 'application/json' }));
  $('#b-abrir').onclick = () => $('#f-abrir').click();
  $('#f-abrir').onchange = e => {
    const file = e.target.files[0]; if (!file) return;
    file.text().then(txt => {
      try { const s = JSON.parse(txt); if (s.version !== 2) throw 0; s.facade = s.facade.filter(f => F(f.el)); state = s; nombre.value = state.nombre; ui.sel = null; commit(true); toast('Casa abierta.'); }
      catch { toast('Ese archivo no es una casa de este juego.'); }
    });
    e.target.value = '';
  };
  $('#b-png').onclick = exportarPNG;
  $('#b-svg').onclick = () => bajar(slug() + '.svg', new Blob([drawLamina()], { type: 'image/svg+xml' }));

  $('#b-siguiente').onclick = () => { const sig = PASOS[ui.paso].sig; if (!sig) return; setPaso(sig); if (ui.paso === sig) window.scrollTo({ top: 0, behavior: 'smooth' }); };

  let resizeT;
  window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(renderArchivo, 120); });

  setPaso('patios'); renderStatus();
})();
