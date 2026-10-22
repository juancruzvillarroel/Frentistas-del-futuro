/* Máquina de composición y ornamentación · calle Feria, Sevilla 2157.
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
  let state = normalizar(load() || casaVacia());
  function normalizar(s) { s.niveles = s.niveles || 1; s.fachada.estilos = s.fachada.estilos || []; s.rooms.forEach(r => { r.nivel = r.nivel || 0; }); return s; }
  const ui = { paso: 'patios', nivel: 0, camino: { patios: [], ambientes: [], fachada: [], techos: [] }, tool: null, sel: null, drag: null };
  const ARBOLES = Archivo.arboles(CAT);
  const vista = () => PASOS[ui.paso].vista;

  /* ---------- Niveles: la planta baja es el nivel 0. Los patios solo van en planta baja y en los pisos de arriba
     quedan como vacíos; una escalera ocupa su lugar en su nivel y «llega» al nivel de arriba. ---------- */
  const niv = r => r.nivel || 0;
  const nombreNivel = n => n === 0 ? 'Planta baja' : `Piso ${n}`;
  const altoNivel = n => Math.max(3, ...state.rooms.filter(r => niv(r) === n && !r.patio).map(r => r.alto)) + 0.3;
  const baseNivel = n => { let b = 0; for (let k = 0; k < n; k++) b += altoNivel(k); return b; };
  const bloqueos = n => n > 0 ? state.rooms.filter(o => (niv(o) === 0 && o.patio) || (niv(o) === n - 1 && o.tipo === 'escalera')) : [];

  /* ---------- Afinidad entre estilos (tabla «Combinaciones de fachadas» del equipo) ----------
     Al tocar un estilo en el archivo queda elegido; después solo se habilitan los que tienen afinidad alta
     con TODOS los elegidos. Sevilla 2157 es el archivo: comodín, siempre habilitado y no restringe. */
  const elegidos = () => state.fachada.estilos;
  const habilitado = (id, lista = elegidos()) => lista.includes(id) || EST(id).comodin || lista.filter(e => !EST(e).comodin).every(e => EST(e).afines.includes(id));
  const sinAfinidad = id => elegidos().filter(e => !EST(e).comodin && !EST(e).afines.includes(id));

  const room = id => state.rooms.find(r => r.id === id);
  const facEl = id => state.facade.find(f => f.id === id);
  const choca = (a, o) => a.x < o.x + o.w - 1e-6 && o.x < a.x + a.w - 1e-6 && a.y < o.y + o.h - 1e-6 && o.y < a.y + a.h - 1e-6;
  const overlaps = r => state.rooms.filter(o => niv(o) === niv(r)).concat(bloqueos(niv(r))).some(o => o.id !== r.id && choca(r, o));
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
    <linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#86abc8"/><stop offset="0.6" stop-color="#b3cddd"/><stop offset="1" stop-color="#d9e4e6"/></linearGradient>
    <pattern id="medianera" patternUnits="userSpaceOnUse" width="0.5" height="0.24"><rect width="0.5" height="0.24" fill="#ebe0ca"/><path d="M0 0.12 H0.5 M0.25 0 V0.12 M0 0.12 V0.24 M0.5 0.12 V0.24" stroke="#dacbae" stroke-width="0.5" fill="none"/></pattern>
    <filter id="oleo" x="-25%" y="-40%" width="150%" height="180%">
      <!-- bordes deshilachados y desenfocados: el cielo no tiene límite marcado -->
      <feTurbulence type="fractalNoise" baseFrequency="0.32" numOctaves="3" seed="7" result="ruido"/>
      <feDisplacementMap in="SourceGraphic" in2="ruido" scale="2" xChannelSelector="R" yChannelSelector="G" result="borde"/>
      <feGaussianBlur in="borde" stdDeviation="0.5" result="suave"/>
      <!-- manchas: zonas más cargadas de pintura y zonas casi transparentes -->
      <feTurbulence type="fractalNoise" baseFrequency="0.22 0.7" numOctaves="2" seed="5" result="manchas"/>
      <feColorMatrix in="manchas" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.9 -0.3" result="mascara"/>
      <feComposite in="suave" in2="mascara" operator="in" result="irregular"/>
      <!-- pinceladas horizontales claras y oscuras dentro de la mancha -->
      <feTurbulence type="fractalNoise" baseFrequency="0.3 2.2" numOctaves="2" seed="3" result="pincel"/>
      <feColorMatrix in="pincel" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.3 -0.4" result="vetas"/>
      <feComposite in="vetas" in2="irregular" operator="in" result="vetasClaras"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.22 1.6" numOctaves="2" seed="21" result="pincel2"/>
      <feColorMatrix in="pincel2" type="matrix" values="0 0 0 0 0.27  0 0 0 0 0.45  0 0 0 0 0.62  0 0 0 1.5 -0.55" result="vetas2"/>
      <feComposite in="vetas2" in2="irregular" operator="in" result="vetasOscuras"/>
      <feMerge><feMergeNode in="irregular"/><feMergeNode in="vetasOscuras"/><feMergeNode in="vetasClaras"/></feMerge>
    </filter>
    <filter id="nube" x="-40%" y="-80%" width="180%" height="260%">
      <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="13" result="ruido"/>
      <feDisplacementMap in="SourceGraphic" in2="ruido" scale="0.8" xChannelSelector="R" yChannelSelector="G" result="borde"/>
      <feGaussianBlur in="borde" stdDeviation="0.3"/>
    </filter>
    <filter id="oleo-suave" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="11" result="ruido"/>
      <feDisplacementMap in="SourceGraphic" in2="ruido" scale="0.35" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <pattern id="vacio" patternUnits="userSpaceOnUse" width="0.6" height="0.6"><rect width="0.6" height="0.6" fill="#e9eef2"/><path d="M0 0.6 L0.6 0 M0 0 L0.6 0.6" stroke="#9db4cf" stroke-width="0.6"/></pattern>
  </defs>`;
  const STYLE = '<style>*{vector-effect:non-scaling-stroke}</style>';

  const txt = (x, y, t, size, o = {}) => `<text x="${x}" y="${y}" font-size="${size}" font-family="${FONT[o.font || 'serif']}" text-anchor="${o.anchor || 'middle'}" fill="${o.fill || C.tinta}" ${o.extra || ''}>${esc(t)}</text>`;
  const halo = `stroke="${C.cal}" stroke-width="3" paint-order="stroke" pointer-events="none"`;
  const art = (def, w, h) => def.img ? `<image href="${def.img}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none"/>` : def.draw(w, h);
  /* ---------- Habitantes de distintas épocas ----------
     Azar con semilla: mientras no cambien los ambientes, las mismas personas quedan en el mismo lugar. */
  function azarCon(semilla) {
    let h = 1779033703; for (const c of semilla) h = Math.imul(h ^ c.charCodeAt(0), 3432918353);
    return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
  }
  const barajar = (l, rnd) => { const a = [...l]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const semillaCasa = extra => state.rooms.map(r => r.id).sort().join('') + '|' + extra;

  // Planta: 2 a 4 personas en ambientes o patios, a un costado del equipamiento.
  function habitantesPlanta(E, n) {
    const rnd = azarCon(semillaCasa('p' + n)), lugares = barajar(E.base.filter(r => r.w * r.h >= 4 && r.tipo !== 'escalera'), rnd);
    let s = '';
    for (const r of lugares.slice(0, 2 + Math.floor(rnd() * 3))) {
      const p = CAT.personas[Math.floor(rnd() * CAT.personas.length)], largo = r.h >= r.w;
      const a = r.patio ? 0.3 + rnd() * 0.4 : (rnd() < 0.5 ? 0.2 : 0.8), b = 0.3 + rnd() * 0.4;
      const [X, Y] = scr(r.x + r.w * (largo ? b : a), r.y + r.h * (largo ? a : b));
      s += `<g transform="translate(${X} ${Y}) rotate(${Math.floor(rnd() * 360)}) scale(1.3)">${p.planta()}</g>`;
    }
    return `<g pointer-events="none">${s}</g>`;
  }

  // Corte: 2 o 3 personas paradas en los ambientes y patios cortados.
  function habitantesCorte(lugares) {
    const rnd = azarCon(semillaCasa('c')); let s = '';
    for (const c of barajar(lugares.filter(c => c.Lg >= 2), rnd).slice(0, 2 + Math.floor(rnd() * 2))) {
      // a un costado, para no tapar el nombre del ambiente que va al centro
      const p = CAT.personas[Math.floor(rnd() * CAT.personas.length)], x = c.s0 + c.Lg * (rnd() < 0.5 ? 0.15 + rnd() * 0.15 : 0.7 + rnd() * 0.15);
      s += `<g transform="translate(${x} ${c.suelo}) scale(${rnd() < 0.5 ? -1 : 1} 1)">${p.lado()}</g>`;
    }
    return `<g pointer-events="none">${s}</g>`;
  }

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

  function drawPlan(live, n = ui.nivel) {
    const { w, d } = state.lot; let s = '';
    if (live) {
      for (let x = 0; x <= d; x++) s += `<line x1="${x}" y1="0" x2="${x}" y2="${w}" stroke="#ddd0b4" stroke-width="0.5"/>`;
      for (let y = 0; y <= w; y++) s += `<line x1="0" y1="${y}" x2="${d}" y2="${y}" stroke="#ddd0b4" stroke-width="0.5"/>`;
    }
    s += `<rect x="0" y="0" width="${d}" height="${w}" fill="none" stroke="${C.tinta}" stroke-width="1" stroke-dasharray="6 4"/>`;
    s += `<line x1="-0.7" y1="-1.5" x2="-0.7" y2="${w + 1.5}" stroke="${C.tinta}" stroke-width="0.8"/>` + txt(-1.6, w / 2, 'CALLE FERIA', 0.6, { font: 'mono', extra: `letter-spacing="0.2" transform="rotate(-90 -1.6 ${w / 2})"` });
    s += txt(d + 1.4, w / 2, 'FONDO', 0.5, { font: 'mono', extra: `transform="rotate(90 ${d + 1.4} ${w / 2})"` });
    const E = espacios(n);
    if (n > 0) {   // referencia: el nivel de abajo en línea tenue, y los patios de planta baja como vacíos
      for (const r of state.rooms.filter(r => niv(r) === n - 1 && !r.patio)) { const q = scrRect(r); s += `<rect x="${q.X}" y="${q.Y}" width="${q.W}" height="${q.H}" fill="none" stroke="${C.tinta}" stroke-width="0.8" stroke-dasharray="3 3" opacity="0.4"/>`; }
      for (const r of E.vacios) { const q = scrRect(r); s += `<rect x="${q.X}" y="${q.Y}" width="${q.W}" height="${q.H}" fill="url(#vacio)" stroke="${C.tinta}" stroke-width="1"/>` + txt(q.X + q.W / 2, q.Y + q.H / 2, `Vacío · ${r.nombre}`, 0.42, { extra: `font-style="italic" ${halo}` }); }
    }
    s += dibujarPasillos(E);
    for (const r of E.llegadas) s += planRoom(r, false);
    for (const r of E.base) s += planRoom(r, live);
    if (n === 0) s += `<line x1="0" y1="0" x2="0" y2="${w}" stroke="${C.tinta}" stroke-width="4"/>`;
    if (!(live && ui.paso === 'patios')) s += dibujarPuertas(E, n);
    s += habitantesPlanta(E, n);
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
    const activo = live && !r.auto && niv(r) === ui.nivel && (ui.paso === 'patios' ? r.patio : ui.paso === 'ambientes' && !r.patio);
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

  /* ---------- Puertas y circulación (se calculan solas a partir de la planta) ----------
     1. Si un ambiente no da a ningún espacio de circulación (patio, galería, pasillo, zaguán, escalera),
        se traza un PASILLO automático por el espacio libre del lote hasta la circulación más cercana.
     2. Después se abren las puertas: cada ambiente hacia su circulación; si no hay lugar para un pasillo,
        hacia un ambiente vecino que ya tenga acceso (como en la casa chorizo). */
  const esCirc = r => r.patio || ['zaguan', 'pasillo', 'galeria', 'escalera', 'terraza'].includes(r.tipo);
  const abierto = r => r.patio || r.tipo === 'galeria' || r.tipo === 'terraza';
  const tocan = (a, b) => {   // comparten un borde, aunque sea corto
    const e = 1e-6, sy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y), sxx = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    return ((Math.abs(a.x + a.w - b.x) < e || Math.abs(b.x + b.w - a.x) < e) && sy > e) || ((Math.abs(a.y + a.h - b.y) < e || Math.abs(b.y + b.h - a.y) < e) && sxx > e);
  };

  // Espacios de circulación a los que se llega desde la entrada (la calle en planta baja; la escalera en los pisos).
  function alcanzables(R, n) {
    const ok = new Set(), cola = R.filter(r => esCirc(r) && (n === 0 ? Math.abs(r.y + r.h - state.lot.d) < 1e-6 : String(r.id).startsWith('lleg-')));
    while (cola.length) {
      const r = cola.shift(); if (ok.has(r.id)) continue; ok.add(r.id);
      for (const o of R) if (!ok.has(o.id) && esCirc(o) && (ladoComun(r, o) || (r.grupo !== undefined && r.grupo === o.grupo) || (r.auto && o.auto && tocan(r, o)))) cola.push(o);
    }
    return ok;
  }

  // Une celdas marcadas en rectángulos (fila por fila).
  function rectangulos(g, S) {
    const ny = g.length, nx = g[0].length, vis = g.map(f => new Uint8Array(nx)), out = [];
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      if (!g[j][i] || vis[j][i]) continue;
      let a = 1; while (i + a < nx && g[j][i + a] && !vis[j][i + a]) a++;
      let b = 1; while (j + b < ny && Array.from({ length: a }, (_, k) => g[j + b][i + k] && !vis[j + b][i + k]).every(Boolean)) b++;
      for (let y = j; y < j + b; y++) for (let x = i; x < i + a; x++) vis[y][x] = 1;
      out.push({ x: i * S, y: j * S, w: a * S, h: b * S, i, j });
    }
    return out;
  }

  function autoPasillos(B, vacios, n) {
    const { w, d } = state.lot, S = 0.5, nx = Math.round(w / S), ny = Math.round(d / S);
    const cor = Array.from({ length: ny }, () => new Uint8Array(nx));
    const vacio = { piezas: [], celdas: cor, S };
    if (!B.length) return vacio;
    const occ = Array.from({ length: ny }, () => new Uint8Array(nx));
    for (const r of B.concat(vacios)) for (let j = Math.round(r.y / S); j < Math.round((r.y + r.h) / S); j++) for (let i = Math.round(r.x / S); i < Math.round((r.x + r.w) / S); i++) if (occ[j]) occ[j][i] = 1;
    const libre = (i, j) => i >= 0 && j >= 0 && i + 1 < nx && j + 1 < ny && !occ[j][i] && !occ[j][i + 1] && !occ[j + 1][i] && !occ[j + 1][i + 1];
    const bloque = (i, j) => ({ x: i * S, y: j * S, w: 1, h: 1 });
    const piezas = () => {
      // grupos: componentes conectados de celdas de pasillo
      const grupo = cor.map(f => new Int16Array(nx).fill(-1)); let g = 0;
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) if (cor[j][i] && grupo[j][i] < 0) {
        const pila = [[i, j]]; grupo[j][i] = g;
        while (pila.length) { const [a, b] = pila.pop(); for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = a + da, y = b + db; if (x >= 0 && y >= 0 && x < nx && y < ny && cor[y][x] && grupo[y][x] < 0) { grupo[y][x] = g; pila.push([x, y]); } } }
        g++;
      }
      return rectangulos(cor, S).map((p, k) => ({ id: `pas-${n}-${k}`, tipo: 'pasillo', patio: false, auto: true, nombre: 'Pasillo', nivel: n, alto: 2.8, techo: 'losa', x: p.x, y: p.y, w: p.w, h: p.h, grupo: grupo[p.j][p.i] }));
    };
    const sinSalida = new Set();
    for (let it = 0; it < 16; it++) {
      const todos = B.concat(piezas()), T = alcanzables(todos, n), metas = todos.filter(r => T.has(r.id));
      const X = todos.find(r => !r.auto && !sinSalida.has(r.id) && (esCirc(r) ? !T.has(r.id) : !todos.some(o => T.has(o.id) && ladoComun(r, o))));
      if (!X) break;
      const meta = (i, j) => metas.some(r => ladoComun(bloque(i, j), r)) || (n === 0 && !metas.length && Math.abs((j + 2) * S - d) < 1e-6);
      const cola = [], prev = new Map();
      for (let j = 0; j + 1 < ny; j++) for (let i = 0; i + 1 < nx; i++) if (libre(i, j) && ladoComun(bloque(i, j), X)) { cola.push([i, j]); prev.set(j * nx + i, -1); }
      let fin = null;
      for (let q = 0; q < cola.length; q++) {
        const [i, j] = cola[q]; if (meta(i, j)) { fin = j * nx + i; break; }
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj, k = b * nx + a; if (!prev.has(k) && libre(a, b)) { prev.set(k, j * nx + i); cola.push([a, b]); } }
      }
      if (fin === null) { sinSalida.add(X.id); continue; }
      for (let k = fin; k !== -1; k = prev.get(k)) { const i = k % nx, j = Math.floor(k / nx); cor[j][i] = cor[j][i + 1] = cor[j + 1][i] = cor[j + 1][i + 1] = 1; }
    }
    return { piezas: piezas(), celdas: cor, S };
  }

  // Todo lo de un nivel: ambientes guardados, llegadas de escalera, vacíos de patio, pasillos automáticos y puertas.
  const memoEsp = new Map();
  function espacios(n) {
    const key = n + '|' + state.lot.w + '|' + state.lot.d + '|' + JSON.stringify(state.rooms.map(r => [r.id, r.tipo, r.patio, niv(r), r.x, r.y, r.w, r.h, r.nombre]));
    if (memoEsp.has(key)) return memoEsp.get(key);
    const base = state.rooms.filter(r => niv(r) === n);
    const llegadas = n > 0 ? state.rooms.filter(r => niv(r) === n - 1 && r.tipo === 'escalera').map(r => ({ ...r, id: 'lleg-' + r.id, nivel: n, auto: true, nombre: 'Llegada de escalera' })) : [];
    const vacios = n > 0 ? state.rooms.filter(r => niv(r) === 0 && r.patio) : [];
    const B = base.concat(llegadas), pas = autoPasillos(B, vacios, n), todos = B.concat(pas.piezas);
    const E = { base, llegadas, vacios, pasillos: pas, todos, ...calcularPuertas(todos, n) };
    if (memoEsp.size > 40) memoEsp.clear();
    memoEsp.set(key, E);
    return E;
  }

  // Pasillos automáticos: piso de color y muros solo en el borde exterior.
  function dibujarPasillos(E) {
    const { piezas, celdas: g, S } = E.pasillos; if (!piezas.length) return '';
    const d = state.lot.d, ny = g.length, nx = g[0].length; let s = '', m = '';
    for (const p of piezas) { const q = scrRect(p); s += `<rect x="${q.X}" y="${q.Y}" width="${q.W}" height="${q.H}" fill="${A('pasillo').color}"/>`; }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      if (!g[j][i]) continue;
      const x0 = i * S, x1 = x0 + S, y0 = j * S, y1 = y0 + S;   // en pantalla: X = d − y, Y = x
      if (i === 0 || !g[j][i - 1]) m += `M${d - y1} ${x0} H${d - y0} `;
      if (i === nx - 1 || !g[j][i + 1]) m += `M${d - y1} ${x1} H${d - y0} `;
      if (j === 0 || !g[j - 1][i]) m += `M${d - y0} ${x0} V${x1} `;
      if (j === ny - 1 || !g[j + 1][i]) m += `M${d - y1} ${x0} V${x1} `;
    }
    const mayor = piezas.reduce((a, b) => a.w * a.h >= b.w * b.h ? a : b), q = scrRect(mayor);
    return `<g pointer-events="none">${s}<path d="${m}" stroke="${C.tinta}" stroke-width="2.2" fill="none"/>${txt(q.X + q.W / 2, q.Y + q.H / 2 + 0.15, 'pasillo', 0.38, { extra: `font-style="italic" ${halo}` })}</g>`;
  }

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
  function calcularPuertas(R, n) {
    const { d } = state.lot, puertas = [], con = new Map(R.map(r => [r.id, new Set()])), vec = new Map(R.map(r => [r.id, []]));
    const unir = (a, b, lado, tipo) => { if (tipo) puertas.push({ a, b, lado, tipo }); con.get(a.id).add(b.id); con.get(b.id).add(a.id); };
    for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) {
      if (R[i].grupo !== undefined && R[i].grupo === R[j].grupo) { unir(R[i], R[j], null, null); continue; }   // tramos del mismo pasillo
      const l = ladoComun(R[i], R[j]); if (!l) continue;
      vec.get(R[i].id).push([R[j], l]); vec.get(R[j].id).push([R[i], l]);
      if (esCirc(R[i]) && esCirc(R[j])) unir(R[i], R[j], l, abierto(R[i]) && abierto(R[j]) ? 'abierto' : 'paso');
    }
    const prioridad = r => r.tipo === 'zaguan' ? 1 : 2;
    for (const r of R) if (!esCirc(r)) {
      const op = vec.get(r.id).filter(([o]) => esCirc(o)).sort((p, q) => prioridad(q[0]) - prioridad(p[0]) || (q[1].t1 - q[1].t0) - (p[1].t1 - p[1].t0))[0];
      if (op) unir(r, op[0], op[1], 'puerta');
    }
    const frente = n === 0 ? R.filter(r => Math.abs(r.y + r.h - d) < 1e-6) : [];
    const entrada = n === 0 ? frente.find(r => r.tipo === 'zaguan') || frente.find(r => r.auto) || frente.find(esCirc) || frente[0] : null;
    const inicio = n === 0 ? (entrada ? [entrada.id] : []) : R.filter(r => String(r.id).startsWith('lleg-')).map(r => r.id);
    const alcanzados = new Set();
    const recorrer = () => { alcanzados.clear(); const cola = [...inicio]; while (cola.length) { const id = cola.shift(); if (alcanzados.has(id)) continue; alcanzados.add(id); cola.push(...con.get(id)); } };
    recorrer();
    for (let cambio = true; cambio;) {
      cambio = false;
      for (const r of R) if (!alcanzados.has(r.id)) {
        const op = vec.get(r.id).find(([o]) => alcanzados.has(o.id));
        if (op) { unir(r, op[0], op[1], esCirc(r) && esCirc(op[0]) ? 'paso' : 'puerta'); recorrer(); cambio = true; }
      }
    }
    return { puertas, entrada, sinAcceso: R.filter(r => !r.auto && !alcanzados.has(r.id)) };
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

  function dibujarPuertas(E) {
    const { puertas, entrada } = E; let s = '';
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
    const { d } = state.lot, sx = state.sx, H = state.fachada.alto, N = state.niveles;
    // Lo que corta la línea A–A en cada nivel (ambientes, patios y pasillos automáticos; no las llegadas de escalera).
    const corta = n => espacios(n).todos.filter(r => !String(r.id).startsWith('lleg-') && sx > r.x && sx < r.x + r.w);
    const hmax = Math.max(H, baseNivel(N) + 2.5) + 4;   // aire arriba para el cielo
    // Fondo: un cielo pintado al óleo y, detrás de la casa, la medianera del vecino con la huella de una casa demolida
    const rm = azarCon(semillaCasa('m')), altoMed = Math.min(hmax - 3, baseNivel(N) + 1.2 + rm() * 1.5);
    const a = d * (0.08 + rm() * 0.3), b = Math.min(d - 0.5, a + d * (0.25 + rm() * 0.2)), hh = Math.min(altoMed - 1.2, 3.5 + rm() * 2);
    let s = `<g pointer-events="none">${cieloOleo(-0.35, G - hmax + 0.35, d + 0.35, hmax - 0.35 - altoMed + 0.6)}`   // solo por encima de la medianera
      + `<rect x="-0.35" y="${G - altoMed}" width="${d + 0.35}" height="${altoMed}" fill="url(#medianera)"/>`
      + `<path d="M${a} ${G} V${G - hh} L${(a + b) / 2} ${G - hh - 1.4} L${b} ${G - hh} V${G} Z" fill="#d8c6a2" opacity="0.7" filter="url(#oleo-suave)"/>`
      + [[0.12, 0.35, 2.2, 0.9], [0.55, 0.6, 1.6, 0.7], [0.8, 0.25, 2.6, 1.1]].map(([fx, fy, w2, h2]) => `<rect x="${d * fx}" y="${G - altoMed * fy - h2}" width="${w2}" height="${h2}" fill="#f5efe2" opacity="0.85" filter="url(#oleo-suave)"/>`).join('')
      + `<rect x="-0.45" y="${G - altoMed - 0.12}" width="${d + 0.55}" height="0.12" fill="#c7b28c" stroke="${C.tinta}" stroke-width="0.6"/></g>`;
    s += `<rect x="-2" y="${G}" width="${d + 4}" height="1.2" fill="url(#tierra)"/><line x1="-2" y1="${G}" x2="${d + 2}" y2="${G}" stroke="${C.tinta}" stroke-width="2"/>`;
    let alguno = false;
    const lugares = [];   // dónde pueden aparecer habitantes: { s0, Lg, suelo }
    for (let n = 0; n < N; n++) {
      const b = baseNivel(n), suelo = G - b, cut = corta(n), arriba = n + 1 < N ? corta(n + 1).filter(o => !o.patio) : [];
      for (const r of cut) {
        if (r.patio && n > 0) continue;
        alguno = true;
        const s0 = d - (r.y + r.h), Lg = r.h, sel = live && ui.sel && ui.sel.kind === 'room' && ui.sel.id === r.id;
        s += `<g ${live && !r.auto ? `data-room="${r.id}" style="cursor:pointer"` : ''}>`;
        if (live && !r.auto) s += `<rect x="${s0}" y="${suelo - (r.patio ? hmax - 1 - b : altoNivel(n))}" width="${Lg}" height="${r.patio ? hmax - 1 - b : altoNivel(n)}" fill="${sel ? C.albero : 'transparent'}" fill-opacity="${sel ? 0.18 : 0}"/>`;
        if (r.patio) {
          s += `<rect x="${s0}" y="${G - 0.08}" width="${Lg}" height="0.16" fill="url(#suelo-${r.suelo})" stroke="${C.tinta}" stroke-width="1"/>`;
          for (const o of r.objetos) s += `<g transform="translate(${d - (r.y + o.y)} ${G})">${OB(o.tipo).side()}</g>`;
          lugares.push({ s0, Lg, suelo: G });
          const ty = G - Math.min(hmax - 2, 5.5);
          s += txt(s0 + Lg / 2, ty, r.nombre, 0.5, { extra: 'font-style="italic"' }) + txt(s0 + Lg / 2, ty + 0.55, r.funcion.toUpperCase(), 0.4, { font: 'mono', fill: C.almagra });
        } else if (r.tipo === 'terraza') {
          s += `<rect x="${s0 - 0.15}" y="${suelo - 0.3}" width="${Lg + 0.3}" height="0.3" fill="${C.tinta}"/><rect x="${s0 - 0.15}" y="${suelo - 1.3}" width="0.25" height="1" fill="${C.tinta}"/><rect x="${s0 + Lg - 0.1}" y="${suelo - 1.3}" width="0.25" height="1" fill="${C.tinta}"/>`
            + txt(s0 + Lg / 2, suelo - 1.6, r.nombre, clamp(Lg / 6, 0.3, 0.5), { extra: 'font-style="italic"' });
        } else {
          const h = r.alto, top = suelo - h, cubierto = arriba.some(o => o.y < r.y + r.h - 1e-6 && r.y < o.y + o.h - 1e-6);
          s += `<rect x="${s0}" y="${top}" width="${Lg}" height="${h}" fill="#f6efdf"/>`;
          const mob = !r.auto && A(r.tipo) && A(r.tipo).corte;   // mobiliario visto de costado
          if (mob) s += `<g transform="translate(${s0} ${suelo})" pointer-events="none">${mob(Lg, h)}</g>`;
          if (n > 0) s += `<rect x="${s0 - 0.15}" y="${suelo}" width="${Lg + 0.3}" height="0.3" fill="${C.tinta}"/>`;
          s += cubierto ? `<rect x="${s0 - 0.15}" y="${top - 0.3}" width="${Lg + 0.3}" height="0.3" fill="${C.tinta}"/>` : `<g transform="translate(${s0} ${top})">${T(r.techo).draw(Lg)}</g>`;
          if (r.tipo === 'galeria') s += `<rect x="${s0}" y="${top}" width="0.12" height="${h}" fill="${C.tinta}"/><rect x="${s0 + Lg - 0.12}" y="${top}" width="0.12" height="${h}" fill="${C.tinta}"/>`;
          else s += `<rect x="${s0 - 0.15}" y="${top}" width="0.3" height="${h}" fill="${C.tinta}"/><rect x="${s0 + Lg - 0.15}" y="${top}" width="0.3" height="${h}" fill="${C.tinta}"/>`;
          if (r.tipo === 'escalera') { const sub = altoNivel(n), k = 10; s += `<path d="M${s0} ${suelo}${Array.from({ length: k }, (_, i) => ` V${suelo - sub * (i + 1) / k} H${s0 + Lg * (i + 1) / k}`).join('')}" fill="none" stroke="${C.tinta}" stroke-width="1.4"/>`; }
          s += txt(s0 + Lg / 2, top + h * 0.45, r.nombre, clamp(Lg / 6, 0.3, 0.5), { extra: `font-style="italic" ${halo}` });
          if (!cubierto && !r.auto) s += txt(s0 + Lg / 2, top + h * 0.45 + 0.5, T(r.techo).nombre, clamp(Lg / 8, 0.25, 0.38), { font: 'mono', fill: C.almagra, extra: halo });
          if (r.tipo !== 'escalera') lugares.push({ s0, Lg, suelo });
        }
        if (sel) s += `<rect x="${s0}" y="${suelo - altoNivel(n)}" width="${Lg}" height="${altoNivel(n)}" fill="none" stroke="${C.azul}" stroke-width="2.5" stroke-dasharray="6 3" pointer-events="none"/>`;
        s += '</g>';
      }
      if (N > 1) s += txt(d + 1.2, suelo - 0.4, n === 0 ? 'PB' : `P${n}`, 0.45, { font: 'mono', fill: C.almagra });
    }
    if (!alguno) s += txt(d / 2, G - 4, 'La línea A–A no atraviesa ningún ambiente', 0.6, { font: 'mono' });
    s += `<rect x="-0.35" y="${G - H}" width="0.35" height="${H}" fill="${C.tinta}"/>`;
    s += habitantesCorte(lugares);
    s += txt(-1, G + 0.9, 'CALLE', 0.45, { font: 'mono' }) + txt(d + 1, G + 0.9, 'FONDO', 0.45, { font: 'mono' });
    return { vb: [-2, G - hmax, d + 4, hmax + 1.6], body: s };
  }

  // Cielo pintado al óleo: una mancha celeste translúcida con pinceladas y nubes, en el rectángulo (x, y, w, h).
  function cieloOleo(x, y, w, h) {
    const nubes = [[0.18, 0.3, 0.11, 0.3], [0.58, 0.18, 0.08, 0.22], [0.85, 0.42, 0.06, 0.18]];
    return `<g opacity="0.55"><rect x="${x + 0.4}" y="${y + 0.3}" width="${Math.max(0, w - 0.8)}" height="${Math.max(0, h - 0.3)}" fill="url(#cielo)" filter="url(#oleo)"/>`
      + nubes.map(([fx, fy, rx, ry]) => `<ellipse cx="${x + w * fx}" cy="${y + h * fy}" rx="${Math.max(0.8, w * rx)}" ry="${Math.max(0.25, h * ry * 0.5)}" fill="#f4f1e8" opacity="0.6" filter="url(#nube)"/>`).join('') + '</g>';
  }

  /* ---------- Fachada ---------- */
  function facBox(e) {
    const d = F(e.el);
    return FULL.has(d.cat) ? { x: 0, y: e.y, w: state.lot.w, h: d.h * e.s } : { x: e.x, y: e.y, w: d.w * e.s, h: d.h * e.s };
  }

  function drawFacade(live) {
    const { w } = state.lot, H = state.fachada.alto, top = G - H;
    let s = `<g pointer-events="none">${cieloOleo(-1.2, top - 3.3, w + 2.4, 5)}</g>`;   // cielo detrás, por encima de la casa y los vecinos
    s += `<rect x="-1.2" y="${top + 1}" width="1.2" height="${H - 1}" fill="url(#semi)"/><rect x="${w}" y="${top + 1.5}" width="1.2" height="${H - 1.5}" fill="url(#semi)"/>`;
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
    s += txt(w / 2, G + 1, 'CALLE FERIA · SEVILLA 2157', 0.42, { font: 'mono', extra: 'letter-spacing="0.1"' });
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
    // Plantas: una por nivel, apiladas en el mismo marco
    const N = state.niveles, hp = (420 - 46) / N;
    s += `<rect x="40" y="40" width="1150" height="420" fill="${C.cal}" stroke="${C.tinta}" stroke-width="1.5"/>` + t(52, 66, N > 1 ? 'PLANTAS' : 'PLANTA', 22);
    for (let n = 0; n < N; n++) {
      const v = drawPlan(false, n), y0 = 76 + n * hp;
      if (N > 1) s += t(52, y0 + 18, nombreNivel(n).toUpperCase(), 16, 'mono', '', C.almagra);
      s += `<svg x="50" y="${y0}" width="1130" height="${hp - 6}" viewBox="${v.vb.join(' ')}" preserveAspectRatio="xMidYMid meet">${v.body}</svg>`;
    }
    s += marco(drawFacade(false), 40, 480, 560, 480, 'FACHADA') + marco(drawSection(false), 620, 480, 570, 480, 'CORTE A–A');
    const rx = 1210, cx = rx + 175;
    s += `<rect x="${rx}" y="40" width="350" height="920" fill="${C.cal}" stroke="${C.tinta}" stroke-width="1.5"/>`;
    for (let i = 0; i < 25; i++) for (let j = 0; j < 2; j++) s += `<rect x="${rx + i * 14}" y="${40 + j * 14}" width="14" height="14" fill="${(i + j) % 2 ? C.azul : C.cal}"/>`;
    let y = 120;
    s += t(cx, y - 14, 'Máquina de composición', 30, 'sc', 'text-anchor="middle"') + t(cx, y + 20, 'y ornamentación', 30, 'sc', 'text-anchor="middle"'); y += 54;
    s += t(cx, y, 'calle Feria · Sevilla · 2157', 20, 'mono', 'text-anchor="middle"'); y += 50;
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
      ambientes: `Estás armando: ${nombreNivel(ui.nivel)}. Elegí un ambiente en el archivo, o hacé clic en uno de la planta para editarlo. Si un ambiente no da a un patio, galería o pasillo, la casa le traza un pasillo sola.`,
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
    renderEstilos();
    if (ui.paso === 'lamina') return;
    const esEstilo = n => ui.paso === 'fachada' && String(n.id).startsWith('est:');
    Archivo.render($('#archivo-mapa'), ARBOLES[ui.paso], ui.camino[ui.paso], {
      estado: n => !esEstilo(n) ? null : elegidos().includes(n.id.slice(4)) ? 'elegido' : habilitado(n.id.slice(4)) ? null : 'bloqueado',
      titulo: n => {
        if (!esEstilo(n)) return '';
        const id = n.id.slice(4);
        if (elegidos().includes(id)) return 'Elegido. Abierto, tocalo de nuevo para soltarlo.';
        if (habilitado(id)) return '';
        const choque = elegidos().filter(e => EST(e).contraste.includes(id));
        return `Sin afinidad alta con ${sinAfinidad(id).map(x => EST(x).nombre).join(', ')}` + (choque.length ? ` · contraste fuerte con ${choque.map(x => EST(x).nombre).join(', ')}` : '');
      },
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

  // Barra de estilos elegidos (paso Fachada): se pueden soltar de a uno o todos.
  function renderEstilos() {
    const el = $('#estilos-elegidos'), L = elegidos();
    el.hidden = ui.paso !== 'fachada';
    if (el.hidden) return;
    if (!L.length) { el.innerHTML = '<span>Tocá un estilo para empezar. Después solo se habilitan los de <b>afinidad alta</b> con lo que elegiste; los demás quedan en gris.</span>'; return; }
    const afines = CAT.estilos.filter(e => !L.includes(e.id) && habilitado(e.id)).map(e => esc(e.nombre));
    el.innerHTML = '<span>Estilos elegidos:</span>' + L.map(id => `<button class="chip" data-quitar="${id}" title="Soltar este estilo">${esc(EST(id).nombre)} <b>×</b></button>`).join('')
      + '<button class="btn" data-quitar="*">Soltar todos</button>'
      + `<span class="afines">Afinidad alta disponible: ${afines.length ? afines.join(' · ') : 'ninguna más (soltá un estilo para abrir otras combinaciones)'}</span>`;
    el.querySelectorAll('[data-quitar]').forEach(b => b.onclick = () => {
      const id = b.dataset.quitar;
      state.fachada.estilos = id === '*' ? [] : L.filter(x => x !== id);
      if (id === '*' || ui.camino.fachada[0] === 'est:' + id) ui.camino.fachada = [];
      ui.tool = null; save(); renderArchivo(); renderAviso();
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
    if (ui.paso === 'fachada' && nivel === 0) {   // tocar un estilo lo elige; tocarlo de nuevo (abierto) lo suelta
      const id = n.id.slice(4), L = elegidos();
      if (!habilitado(id)) return toast(`«${EST(id).nombre}» no tiene afinidad alta con ${sinAfinidad(id).map(x => EST(x).nombre).join(' ni ')}. Soltá un estilo elegido para habilitarlo.`);
      if (L.includes(id) && cam[0] === n.id) { state.fachada.estilos = L.filter(x => x !== id); ui.camino.fachada = []; }
      else { if (!L.includes(id)) state.fachada.estilos = L.concat(id); ui.camino.fachada = [n.id]; }
      ui.tool = null; save(); renderArchivo(); return renderView();
    }
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
    if (p === 'patios') ui.nivel = 0;   // los patios van siempre en planta baja
    if (r && niv(r) !== ui.nivel && vista() === 'planta') ui.sel = null;
    renderNiveles(); renderArchivo(); renderView(); renderFicha();
  }

  // Selector de niveles (solo en el paso Ambientes): planta baja, pisos y botones para sumar o quitar.
  function renderNiveles() {
    const el = $('#niveles'), N = state.niveles;
    el.hidden = ui.paso !== 'ambientes';
    if (el.hidden) return;
    el.innerHTML = '<span class="niv-tit">Niveles</span>' + [...Array(N).keys()].map(n => `<button class="btn ${n === ui.nivel ? 'on' : ''}" data-niv="${n}">${nombreNivel(n)}</button>`).join('')
      + (N < 4 ? '<button class="btn mas" data-niv="mas">+ Agregar nivel</button>' : '') + (N > 1 ? '<button class="btn menos" data-niv="menos">− Quitar el último</button>' : '');
    el.querySelectorAll('[data-niv]').forEach(b => b.onclick = () => {
      const v = b.dataset.niv;
      if (v === 'mas') {
        state.niveles++; ui.nivel = state.niveles - 1;
        state.fachada.alto = Math.max(state.fachada.alto, Math.ceil(baseNivel(state.niveles) + 1));
        toast(`${nombreNivel(ui.nivel)} agregado. Para llegar, poné una «Escalera» en el nivel de abajo.`);
      } else if (v === 'menos') {
        const ultimo = state.niveles - 1, cuantos = state.rooms.filter(r => niv(r) === ultimo).length;
        if (cuantos && !confirm(`¿Quitar ${nombreNivel(ultimo)} y sus ${cuantos} ambientes?`)) return;
        state.rooms = state.rooms.filter(r => niv(r) !== ultimo); state.niveles--; ui.nivel = Math.min(ui.nivel, state.niveles - 1);
      } else ui.nivel = +v;
      ui.sel = null; ui.drag = null;
      renderNiveles(); commit(true);
    });
  }

  function renderStatus() {
    const rooms = state.rooms, pats = rooms.filter(r => r.patio), lote = state.lot.w * state.lot.d;
    const cub = rooms.filter(r => !r.patio).reduce((a, r) => a + r.w * r.h, 0), pa = pats.reduce((a, r) => a + r.w * r.h, 0);
    const estilos = new Set(usadas().map(d => d.estilo)).size;
    $('#status').innerHTML = `<span>Lote ${fmt(state.lot.w)}×${fmt(state.lot.d)} m</span><span>Cubierto ${fmt(cub)} m²</span>`
      + `<span>Patios ${pats.length} · ${fmt(pa)} m² (${Math.round(pa / lote * 100)}%)</span><span>Estilos mezclados: ${estilos}</span><span>Piezas nuevas: 0</span>`
      + (pats.length ? '' : '<span class="warn">⚠ Toda casa necesita al menos un patio</span>')
      + (state.niveles > 1 ? `<span>Niveles: ${state.niveles}</span>` : '')
      + (() => {
        const sin = []; for (let n = 0; n < state.niveles; n++) if (rooms.some(r => niv(r) === n)) sin.push(...espacios(n).sinAcceso.map(r => n ? `${r.nombre} (${nombreNivel(n)})` : r.nombre));
        const falta = [...Array(state.niveles).keys()].filter(n => n > 0 && rooms.some(r => niv(r) === n) && !rooms.some(r => niv(r) === n - 1 && r.tipo === 'escalera'));
        return (sin.length ? `<span class="warn">⚠ Sin acceso: ${sin.map(esc).join(', ')}</span>` : '') + (falta.length ? `<span class="warn">⚠ Falta una escalera para subir a: ${falta.map(nombreNivel).join(', ')}</span>` : '');
      })();
  }

  function commit(full) {
    renderView(); renderStatus(); renderArchivo(); renderNiveles();
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
      else h = `<div class="ftit">El lote</div><div class="fep">Calle Feria · Sevilla · 2157</div>`
        + `<p class="desc">La casa de Caballito aterrizó en Sevilla. Los frentistas del futuro no inventan: eligen en el archivo y recombinan.</p>`
        + text('frentista', state.frentista, 'Frentista (quién diseña)')
        + `<div class="row">${num('lot.w', state.lot.w, 6, 20, 0.5, 'Frente (m)')}${num('lot.d', state.lot.d, 12, 50, 0.5, 'Fondo (m)')}</div>`;
    } else if (s.kind === 'room') {
      const r = room(s.id);
      if (!r.patio) h = `<div class="ftit">${esc(r.nombre)}</div><div class="fep">Ambiente · ${nombreNivel(niv(r))} · ${fmt(r.w * r.h)} m²</div>`
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
        ? { id: uid(), tipo: def.id, patio: false, nombre: def.nombre, x, y, w, h, alto: ui.nivel ? 3.2 : 4.2, techo: def.techo, nivel: ui.nivel }
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
    const amb = (tipo, x, y, rw, rh, nivel = 0) => { const r = { id: uid(), tipo, patio: false, nombre: A(tipo).nombre, x, y, w: rw, h: rh, nivel, alto: snap(nivel ? rnd(3, 3.6) : rnd(3.6, 5), 0.1), techo: elegir(CAT.techos).id }; rooms.push(r); return r; };
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
    // La mitad de las veces, un piso alto: escalera al frente de la galería, galería arriba y ambientes
    // sobre los de abajo (los patios quedan como vacíos).
    state.niveles = 1;
    const tira = rooms.find(r => (r.tipo === 'galeria' || r.tipo === 'pasillo') && r.h >= 7);
    if (tira && Math.random() < 0.5) {
      tira.h -= 3;
      amb('escalera', tira.x, tira.y + tira.h, tira.w, 3);
      amb('galeria', tira.x, tira.y, tira.w, tira.h, 1);
      const pool2 = mezclar(['dormitorio', 'dormitorio', 'estudio', 'bano', 'terraza', 'dormitorio', 'estudio']);
      for (const r of rooms.filter(r => !r.nivel && !r.patio && !esCirc(r) || r.tipo === 'zaguan')) if (Math.random() < 0.85)
        amb(pool2.length ? pool2.shift() : elegir(['dormitorio', 'estudio', 'dormitorio']), r.x, r.y, r.w, r.h, 1);
      state.niveles = 2;
    }
    state.rooms = rooms;
    if (state.niveles > 1) {   // lo que quede aislado del otro lado de un vacío, no se construye
      const sin = new Set(espacios(1).sinAcceso.map(r => r.id));
      state.rooms = rooms.filter(r => !sin.has(r.id));
    }
    const p = elegir(rooms.filter(r => r.patio));
    state.sx = clamp(snap(p.x + p.w / 2, 0.25), 0.25, w - 0.25);   // el corte pasa por un patio
    return rooms.filter(r => r.y + r.h === d).sort((a, b) => a.x - b.x);
  }

  // La fachada responde a la planta: la puerta va frente al zaguán y las ventanas frente a los otros ambientes del frente.
  function remixFachada(frente) {
    // Estilos con afinidad alta entre sí, como si alguien los eligiera en el archivo (a veces suma Sevilla 2157)
    const L = [elegir(CAT.estilos.filter(e => !e.comodin)).id];
    while (L.length < 3 && Math.random() < 0.85) { const ops = CAT.estilos.filter(e => !e.comodin && !L.includes(e.id) && habilitado(e.id, L)); if (!ops.length) break; L.push(elegir(ops).id); }
    if (Math.random() < 0.25) L.push('futuro');
    state.fachada.estilos = L;
    const pick = cat => { const l = CAT.fachada.filter(e => e.cat === cat && L.includes(e.estilo)); return l.length ? elegir(l) : null; };
    const azar = p => Math.random() < p;
    const { w } = state.lot, H = state.fachada.alto = Math.max(snap(rnd(6, 9)), Math.ceil(baseNivel(state.niveles) + 1.5)), top = G - H, f = [];
    const add = (d, x, y, s = 1, flip = false) => d && f.push({ id: uid(), el: d.id, x, y, s, flip });
    const z = pick('zocalo'), zh = z ? z.h : 0; if (z) add(z, 0, G - zh);
    const c = azar(0.6) && pick('columna'); if (c) { const s = (H - zh - 0.6) / c.h; add(c, 0.15, G - zh - c.h * s, s); add(c, w - 0.15 - c.w * s, G - zh - c.h * s, s); }
    if (azar(0.5)) add(pick('moldura'), 0, top + H * 0.45);
    add(pick('moldura'), 0, top);
    const puerta = pick('puerta'), ven = pick('ventana'), ds = Math.min(1, (H - 1.5) / puerta.h);
    let px = w / 2;
    for (const r of frente) {
      const cx = r.x + r.w / 2;
      if (r.tipo === 'zaguan') { px = cx; add(puerta, cx - puerta.w * ds / 2, G - puerta.h * ds, ds); }
      else { const vs = Math.min(1, (r.w - 0.6) / ven.w, 2.6 / ven.h); add(ven, cx - ven.w * vs / 2, Math.min(G - 1.9 - ven.h * vs / 2, G - 0.3 - ven.h * vs), vs); }
    }
    // Ventanas del piso alto, frente a los ambientes de arriba que dan a la calle
    const ven2 = pick('ventana');
    for (const r of state.rooms.filter(r => r.nivel === 1 && r.y + r.h === state.lot.d)) {
      const vs = Math.min(1, (r.w - 0.6) / ven2.w, 2.2 / ven2.h), cy = G - baseNivel(1) - 1.6;
      add(ven2, r.x + r.w / 2 - ven2.w * vs / 2, Math.max(top + 0.3, cy - ven2.h * vs / 2), vs);
    }
    const o = azar(0.5) && pick('ornamento'); if (o) add(o, px - o.w / 2, G - puerta.h * ds - o.h - 0.25);
    const r = pick('remate'); if (r) add(r, w / 2 - r.w / 2, top - r.h + 0.05);
    state.facade = f;
    state.fachada.pano = elegir(CAT.panos).id;
    return L.map(EST);
  }

  function remix() {
    const frente = remixPlanta(), piezas = remixFachada(frente);
    const pats = state.rooms.filter(r => r.patio).length, ambs = state.rooms.length - pats;
    ui.sel = null; ui.tool = null;
    setPaso('lamina'); commit(true);
    toast(`Remix: ${pats} patio${pats === 1 ? '' : 's'}, ${ambs} ambientes · ${piezas.map(e => e.nombre).join(' + ')}`);
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
    state = normalizar(casaVacia()); ui.nivel = 0;
    nombre.value = state.nombre; ui.sel = null; ui.tool = null; setPaso('patios'); commit(true);
  };
  $('#b-original').onclick = () => {
    if (!confirm('¿Volver a la casa chorizo original? Si no guardaste la actual, se pierde.')) return;
    state = normalizar(casaInicial()); ui.nivel = 0; nombre.value = state.nombre; ui.sel = null; ui.tool = null; commit(true);
  };
  $('#b-guardar').onclick = () => bajar(slug() + '.json', new Blob([JSON.stringify(state, null, 1)], { type: 'application/json' }));
  $('#b-abrir').onclick = () => $('#f-abrir').click();
  $('#f-abrir').onchange = e => {
    const file = e.target.files[0]; if (!file) return;
    file.text().then(txt => {
      try { const s = JSON.parse(txt); if (s.version !== 2) throw 0; s.facade = s.facade.filter(f => F(f.el)); state = normalizar(s); ui.nivel = 0; nombre.value = state.nombre; ui.sel = null; commit(true); toast('Casa abierta.'); }
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
