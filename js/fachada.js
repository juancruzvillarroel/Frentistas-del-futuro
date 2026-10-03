/* Etapa 2: la fachada como collage. Una grilla de pisos × módulos donde cada celda es puerta, ventana,
   balcón o muro ciego, vestida con los fragmentos fotográficos elegidos del catálogo. */

const ALTO_NIVEL = 3.6;
const TIPOS_PB = ['puerta', 'ventana', 'ciego'], TIPOS_ALTO = ['ventana', 'balcon', 'ciego'];

function fachadaInicial(ancho) {
  const modulos = Math.max(1, Math.min(8, Math.round(ancho / 3.2)));
  return { pisos: 2, modulos, celdas: [Array.from({ length: modulos }, (_, i) => i === 0 ? 'puerta' : 'ventana'), Array(modulos).fill('balcon')] };
}
// ajusta la grilla cuando cambian pisos o módulos, conservando lo que ya estaba
function redimensionarFachada(fa, pisos, modulos) {
  fa.pisos = Math.max(1, Math.min(5, pisos));
  fa.modulos = Math.max(1, Math.min(10, modulos));
  fa.celdas = Array.from({ length: fa.pisos }, (_, f) => Array.from({ length: fa.modulos }, (_, i) => {
    const prev = fa.celdas[f]?.[i];
    if (prev && (f === 0 ? TIPOS_PB : TIPOS_ALTO).includes(prev)) return prev;
    return f === 0 ? (i === 0 ? 'puerta' : 'ventana') : 'balcon';
  }));
  if (!fa.celdas[0].includes('puerta')) fa.celdas[0][0] = 'puerta';
}
function ciclarCelda(fa, f, i) {
  const tipos = f === 0 ? TIPOS_PB : TIPOS_ALTO, t = fa.celdas[f][i];
  fa.celdas[f][i] = tipos[(tipos.indexOf(t) + 1) % tipos.length];
}

function medidasFachada(sel, fa) {
  const W = LOTE.ancho * S, FH = ALTO_NIVEL * S, H = fa.pisos * FH, cor = sel.coronamiento && PIEZA[sel.coronamiento];
  const hCor = cor ? cor.alto * S : 0;
  return { W, FH, H, hCor, tope: H + hCor };
}

function componerFachada(sel, fa, { exportar = false, interactiva = false } = {}) {
  const pz = cat => sel[cat] ? PIEZA[sel[cat]] : null;
  const { W, FH, H, hCor, tope } = medidasFachada(sel, fa);
  const k = uid('f'), nb = fa.modulos, bw = W / nb;
  // cada foto se incrusta una sola vez como símbolo y se reutiliza (el SVG exportado pesa mucho menos)
  const usadas = new Set();
  const imagen = (id, x, y, w, h, extra = '') => { usadas.add(id); return `<use href="#i${k}-${id}" x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}"${extra}/>`; };
  const hueco = (x, y, w, h) => `<rect x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" fill="#2a1d12" fill-opacity=".12" stroke="#2a1d12" stroke-width="1.2" stroke-dasharray="5 4"/>`;
  // tamaño de una pieza respetando su proporción y el lugar disponible
  const medir = (p, maxW, maxH) => {
    const a = img(p.img).w / img(p.img).h;
    let h = Math.min(p.alto * S, maxH), w = h * a;
    if (w > maxW) { w = maxW; h = w / a; }
    return [w, h];
  };

  let defs = `<defs>
    <filter id="sombra${k}" x="-10%" y="-10%" width="125%" height="125%"><feDropShadow dx="3" dy="4" stdDeviation="2.5" flood-color="#1b120a" flood-opacity=".5"/></filter>
    <linearGradient id="luz${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#1b120a" stop-opacity=".22"/></linearGradient>
    <linearGradient id="ao${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b120a" stop-opacity="0"/><stop offset="1" stop-color="#1b120a" stop-opacity=".35"/></linearGradient>
    <linearGradient id="alero${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b120a" stop-opacity=".45"/><stop offset="1" stop-color="#1b120a" stop-opacity="0"/></linearGradient>
    <clipPath id="muro${k}"><rect x="0" y="${f2(-tope)}" width="${f2(W)}" height="${f2(tope)}"/></clipPath>`;
  let s = '';

  // muro
  const rev = pz('revestimiento');
  if (rev) {
    const t = rev.tam * S;
    defs += `<pattern id="rev${k}" patternUnits="userSpaceOnUse" width="${f2(t)}" height="${f2(t)}" y="${f2(-H)}">${imagen(rev.img, 0, 0, t, t)}</pattern>`;
    s += `<rect x="0" y="${f2(-H)}" width="${f2(W)}" height="${f2(H)}" fill="url(#rev${k})"/>`;
  } else s += `<rect x="0" y="${f2(-H)}" width="${f2(W)}" height="${f2(H)}" fill="#e8e1d4" stroke="#2a1d12" stroke-dasharray="7 5"/>`;
  // líneas de entrepiso
  for (let f = 1; f < fa.pisos; f++) s += `<rect x="0" y="${f2(-f * FH - 3)}" width="${f2(W)}" height="6" fill="#1b120a" fill-opacity=".1"/>`;

  // zócalo
  const zoc = pz('zocalo');
  if (zoc) {
    const zh = zoc.alto * S, zw = zh * img(zoc.img).w / img(zoc.img).h;
    let z = '';
    for (let x = 0; x < W; x += zw) z += imagen(zoc.img, x, -zh, zw, zh);
    s += `<g clip-path="url(#muro${k})">${z}</g>`;
  }
  s += `<rect x="0" y="${f2(-H)}" width="${f2(W)}" height="${f2(H)}" fill="url(#luz${k})"/>`;

  // aberturas
  const orn = pz('ornamento');
  let piezas = '', celdas = '';
  for (let f = 0; f < fa.pisos; f++) {
    const yb = -f * FH;
    for (let i = 0; i < nb; i++) {
      const tipo = fa.celdas[f][i], x0 = i * bw, cx = x0 + bw / 2;
      if (interactiva) celdas += `<rect class="celda" data-f="${f}" data-i="${i}" x="${f2(x0 + 2)}" y="${f2(yb - FH + 2)}" width="${f2(bw - 4)}" height="${f2(FH - 4)}"><title>${tipo} · tocá para cambiar</title></rect>`;
      if (tipo === 'ciego') continue;
      const p = tipo === 'puerta' ? pz('puerta') : tipo === 'balcon' ? (pz('balcon') || pz('ventana')) : pz('ventana');
      let w, h, y;
      if (!p) {
        [w, h] = tipo === 'puerta' ? [1.4 * S, 3 * S] : tipo === 'balcon' ? [1.4 * S, 2.8 * S] : [1.2 * S, 2.2 * S];
        y = tipo === 'ventana' ? yb - .9 * S - h : yb - h;
        piezas += hueco(cx - w / 2, y, w, h);
        continue;
      }
      if (tipo === 'puerta') { [w, h] = medir(p, bw * .94, FH - .15 * S); y = yb - h; }
      else if (tipo === 'balcon' && p.cat === 'balcon') { [w, h] = medir(p, bw * .9, FH - .35 * S); y = yb - .05 * S - h; }
      else { [w, h] = medir(p, bw * .8, FH - 1.3 * S); y = yb - .95 * S - h; }
      piezas += imagen(p.img, cx - w / 2, y, w, h, ` filter="url(#sombra${k})"`);
      if (orn && tipo !== 'ciego') {
        const ow = Math.min(bw * .98, w * 1.35), oh = ow * img(orn.img).h / img(orn.img).w;
        if (y - oh > yb - FH - .3 * S) piezas += imagen(orn.img, cx - ow / 2, y - oh + 3, ow, oh, ` filter="url(#sombra${k})"`);
      }
    }
  }
  s += piezas;
  s += `<rect x="0" y="${f2(-.7 * S)}" width="${f2(W)}" height="${f2(.7 * S)}" fill="url(#ao${k})"/>`;

  // coronamiento
  const cor = pz('coronamiento');
  if (cor) {
    s += `<rect x="0" y="${f2(-H)}" width="${f2(W)}" height="${f2(S)}" fill="url(#alero${k})"/>`;
    const ch = hCor, cw = ch * img(cor.img).w / img(cor.img).h;
    let c = '';
    if (cor.modo === 'modulo') {
      const [w, h] = medir(cor, bw * .9, ch);
      for (let i = 0; i < nb; i++) c += imagen(cor.img, (i + .5) * bw - w / 2, -H - h, w, h);
    } else for (let x = 0; x < W; x += cw) c += imagen(cor.img, x, -H - ch, cw, ch);
    s += `<g clip-path="url(#muro${k})" filter="url(#sombra${k})">${c}</g>`;
  }
  for (const id of usadas) defs += `<symbol id="i${k}-${id}" viewBox="0 0 ${img(id).w} ${img(id).h}" preserveAspectRatio="none"><image href="${img(id).src}" width="${img(id).w}" height="${img(id).h}"/></symbol>`;
  defs += '</defs>';

  if (exportar) {
    const e = 2.5;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${f2(W * e)}" height="${f2(tope * e)}" viewBox="0 ${f2(-tope)} ${f2(W)} ${f2(tope)}">${defs}${s}</svg>`;
  }
  const m = Math.max(40, W * .08), arriba = tope + 40, abajo = 56;
  const fondo = `<defs><linearGradient id="cielo${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c5d9e3"/><stop offset="1" stop-color="#efe7d8"/></linearGradient></defs>
    <rect x="${f2(-m)}" y="${f2(-arriba)}" width="${f2(W + 2 * m)}" height="${f2(arriba)}" fill="url(#cielo${k})"/>
    <rect x="${f2(-m)}" y="${f2(-H * .8)}" width="${f2(m - 2)}" height="${f2(H * .8)}" fill="#ece4d4"/><rect x="${f2(W + 2)}" y="${f2(-H * 1.05)}" width="${f2(m)}" height="${f2(H * 1.05)}" fill="#e4dac6"/>`;
  const piso = `<rect x="${f2(-m)}" y="0" width="${f2(W + 2 * m)}" height="14" fill="#cfc3ad"/><rect x="${f2(-m)}" y="14" width="${f2(W + 2 * m)}" height="${abajo - 14}" fill="#8c8780"/>
    <g transform="translate(0,${abajo - 18})" class="escala"><rect x="0" y="0" width="${S}" height="4" fill="#2a1d12"/><rect x="${S}" y="0" width="${S}" height="4" fill="#f4ead8"/><rect x="${2 * S}" y="0" width="${3 * S}" height="4" fill="#2a1d12"/>
      <text x="0" y="14">0</text><text x="${S}" y="14">1</text><text x="${2 * S}" y="14">2</text><text x="${5 * S}" y="14">5 m</text></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f2(-m)} ${f2(-arriba)} ${f2(W + 2 * m)} ${f2(arriba + abajo)}" preserveAspectRatio="xMidYMid meet">${fondo}${defs}${s}${piso}${celdas}
    <text x="${f2(-m + 10)}" y="${f2(-arriba + 20)}" class="leyenda">ELEVACIÓN · ${fmtM(LOTE.ancho)} m de frente</text></svg>`;
}
