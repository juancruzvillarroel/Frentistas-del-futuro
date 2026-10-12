/* Catálogo de los frentistas del futuro.
   Todas las piezas son dibujos vectoriales con la misma paleta (nada de fotos).
   Las piezas de fachada se agrupan por ESTILO. Cada pieza: estilo, cat, id, nombre, epoca, anio, w/h (metros), desc
   y draw(w, h), que devuelve SVG en coordenadas locales (0,0 arriba a la izquierda).
   Muchas piezas se arman con constructores (puerta, ventana, columna, cornisa, zocalo): para sumar una nueva
   alcanza con copiar una línea y cambiar las opciones. */

window.CATALOGO = (() => {
  const C = {
    tinta: '#2b2118', papel: '#f3ead6', cal: '#fbf7ee', albero: '#d9a441', almagra: '#a8402e',
    azul: '#1f4e8c', azulClaro: '#9db4cf', verde: '#4f6b3c', madera: '#6b4a2b', piedra: '#e3d6b8',
    sombra: '#3a2a1e', vidrio: '#b9cad8', deco: '#e9d9a8', persiana: '#5c7a5a', naranja: '#e08a2e',
    ladrillo: '#b8613f', hormigon: '#bdb8ad', pizarra: '#5d6670', granito: '#5a4f48', zinc: '#8d969c',
    led: '#3fe0c5', verdeOsc: '#2f4a3a', gris: '#cfc8bb', revoque: '#d9cdb6'
  };
  const col = k => C[k] || k;

  /* ---------- Ayudantes de dibujo (el grosor de línea es en píxeles) ---------- */
  const st = (fill = 'none', sw = 1.2, c = C.tinta) => `fill="${fill}" stroke="${c}" stroke-width="${sw}" stroke-linejoin="round"`;
  const R = (x, y, w, h, fill, sw, c) => `<rect x="${x}" y="${y}" width="${Math.max(0, w)}" height="${Math.max(0, h)}" ${st(fill, sw, c)}/>`;
  const P = (d, fill, sw, c) => `<path d="${d}" ${st(fill, sw, c)}/>`;
  const O = (cx, cy, r, fill, sw, c) => `<circle cx="${cx}" cy="${cy}" r="${r}" ${st(fill, sw, c)}/>`;
  const E = (cx, cy, rx, ry, fill, sw, c, extra = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${st(fill, sw, c)} ${extra}/>`;
  const L = (x1, y1, x2, y2, sw = 1, c = C.tinta) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${st('none', sw, c)}/>`;
  const rep = (n, f) => Array.from({ length: Math.max(0, Math.floor(n)) }, (_, i) => f(i)).join('');
  const { sin, cos, PI } = Math;
  let nclip = 0;
  const clip = (d, inner) => { const id = 'k' + (++nclip); return `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`; };

  // Forma de un vano (abertura) según el tipo de arco. Devuelve un path cerrado.
  function arco(t, x, y, w, h) {
    const X = x + w, Y = y + h;
    switch (t) {
      case 'medio': { const r = w / 2; return `M${x} ${Y} V${y + r} A${r} ${r} 0 0 1 ${X} ${y + r} V${Y} Z`; }
      case 'rebajado': { const f = w * 0.18, r = (w * w / 4 + f * f) / (2 * f); return `M${x} ${Y} V${y + f} A${r} ${r} 0 0 1 ${X} ${y + f} V${Y} Z`; }
      case 'apuntado': return `M${x} ${Y} V${y + w * 0.6} Q${x} ${y + w * 0.12} ${x + w / 2} ${y} Q${X} ${y + w * 0.12} ${X} ${y + w * 0.6} V${Y} Z`;
      case 'herradura': { const r = w / 2, j = w * 0.09, a = Math.acos((r - j) / r), ly = y + r + r * sin(a); return `M${x + j} ${Y} V${ly} A${r} ${r} 0 1 1 ${X - j} ${ly} V${Y} Z`; }
      case 'escalonado': return `M${x} ${Y} V${y + h * 0.16} H${x + w * 0.14} V${y + h * 0.07} H${x + w * 0.3} V${y} H${X - w * 0.3} V${y + h * 0.07} H${X - w * 0.14} V${y + h * 0.16} H${X} V${Y} Z`;
      case 'trilobulado': { const s = y + w * 0.5, r = w * 0.22; return `M${x} ${Y} V${s} A${r} ${r} 0 0 1 ${x + w * 0.3} ${y + w * 0.22} A${r} ${r} 0 0 1 ${X - w * 0.3} ${y + w * 0.22} A${r} ${r} 0 0 1 ${X} ${s} V${Y} Z`; }
      case 'conopial': return `M${x} ${Y} V${y + w * 0.55} C${x} ${y + w * 0.2} ${x + w * 0.42} ${y + w * 0.3} ${x + w / 2} ${y} C${x + w * 0.58} ${y + w * 0.3} ${X} ${y + w * 0.2} ${X} ${y + w * 0.55} V${Y} Z`;
      case 'mixtilineo': return `M${x} ${Y} V${y + w * 0.3} H${x + w * 0.12} A${w * 0.38} ${w * 0.3} 0 0 1 ${X - w * 0.12} ${y + w * 0.3} H${X} V${Y} Z`;
      case 'nouveau': return `M${x} ${Y} V${y + w * 0.4} C${x} ${y + w * 0.05} ${x + w * 0.22} ${y} ${x + w / 2} ${y} C${X - w * 0.22} ${y} ${X} ${y + w * 0.05} ${X} ${y + w * 0.4} V${Y} Z`;
      default: return `M${x} ${Y} V${y} H${X} V${Y} Z`;
    }
  }
  const arranque = (t, w, h) => ({ medio: w / 2, rebajado: w * 0.18, apuntado: w * 0.6, herradura: w * 0.55, escalonado: h * 0.16, trilobulado: w * 0.5, conopial: w * 0.55, mixtilineo: w * 0.3, nouveau: w * 0.4 }[t] || 0);

  /* ---------- Constructor de puertas ---------- */
  function puerta(o) {
    return (w, h) => {
      const top = o.fronton ? 0.8 : o.cornisa ? 0.35 : 0, pil = o.pilastras ? 0.3 : 0, rc = o.rec ?? 0.16;
      const bx = pil, bw = w - 2 * pil, by = top, bh = h - top, marco = col(o.marco || 'piedra'), hoja = col(o.hoja || 'madera');
      let s = '';
      if (pil) s += [0, w - pil].map(x => R(x, top, pil, bh, marco, 1.2) + L(x + pil / 2, top + 0.15, x + pil / 2, h - 0.1, 0.6)).join('');
      if (o.fronton === 'triangular') s += P(`M-0.1 ${top - 0.3} L${w / 2} 0 L${w + 0.1} ${top - 0.3} Z`, marco, 1.2) + P(`M0.35 ${top - 0.38} L${w / 2} 0.18 L${w - 0.35} ${top - 0.38}`, 'none', 0.7);
      if (o.fronton === 'curvo') s += P(`M-0.1 ${top - 0.3} Q${w / 2} -0.45 ${w + 0.1} ${top - 0.3} Z`, marco, 1.2);
      if (o.cornisa || o.fronton) s += R(-0.1, top - 0.3, w + 0.2, 0.3, marco, 1.2);
      const ox = bx + rc, oy = by + rc, ow = bw - 2 * rc, oh = bh - rc, d = arco(o.arco, ox, oy, ow, oh), sp = arranque(o.arco, ow, oh);
      if (o.alfiz) {
        s += R(bx, by, bw, bh, marco, 1.4) + R(bx + 0.07, by + 0.07, bw - 0.14, Math.min(bh - 0.07, rc + sp + 0.2), 'none', 0.8);
        if (o.azulejo) s += rep(bw / 0.25, i => R(bx + i * 0.25, by, 0.25, 0.2, i % 2 ? C.azul : C.albero, 0.5));
      } else s += P(arco(o.arco, bx, by, bw, bh), marco, 1.4);
      if (o.arquivoltas) for (let i = 1; i <= o.arquivoltas; i++) { const k = rc * i / (o.arquivoltas + 1); s += P(arco(o.arco, ox - k, oy - k, ow + 2 * k, oh + k), 'none', 0.8); }
      if (o.dovelas && (o.arco === 'medio' || o.arco === 'herradura')) {
        const cx = ox + ow / 2, cy = oy + ow / 2, r1 = ow / 2, r2 = ow / 2 + rc, a0 = o.arco === 'herradura' ? Math.acos(0.82) : 0;
        for (let i = 1; i < 11; i++) { const a = -a0 + (PI + 2 * a0) * i / 11; s += L(cx + r1 * cos(a), cy - r1 * sin(a), cx + r2 * cos(a), cy - r2 * sin(a), 0.7); }
      }
      if (o.clave) s += P(`M${w / 2 - 0.13} ${oy - rc - 0.04} H${w / 2 + 0.13} L${w / 2 + 0.09} ${oy + 0.22} H${w / 2 - 0.09} Z`, marco, 1);
      // Interior del vano (recortado con la forma del arco)
      const ban = o.banderola ? (sp || 0.6) : 0, y0 = oy + ban, cx = ox + ow / 2, dos = (o.hojas ?? 2) === 2;
      let inn = R(ox - 1, oy - 1, ow + 2, oh + 2, o.banderola ? C.vidrio : hoja, 0);
      if (o.banderola) {
        inn += o.latigo
          ? P(`M${ox} ${y0} C${ox + ow * 0.3} ${y0 - ban} ${cx} ${y0 - ban * 0.2} ${cx} ${y0 - ban} M${ox + ow} ${y0} C${ox + ow * 0.7} ${y0 - ban} ${cx} ${y0 - ban * 0.2} ${cx} ${y0 - ban}`, 'none', 1.2, C.sombra)
          : rep(7, i => L(cx, y0, ox + ow * i / 6, oy - 0.2, 0.8));
        inn += L(ox, y0, ox + ow, y0, 1.4);
      }
      if (o.vidrio) inn += R(ox, y0, ow, oh - ban, C.vidrio, 1) + rep((oh - ban) / 0.35, i => L(ox, y0 + 0.35 * (i + 1), ox + ow, y0 + 0.35 * (i + 1), 1.2, C.sombra));
      else {
        inn += R(ox, y0, ow, oh - ban, hoja, 1);
        const hw = dos ? ow / 2 : ow;
        for (let k = 0; k < (dos ? 2 : 1); k++) {
          const x = ox + k * hw;
          if (o.tablas) inn += rep(hw / 0.14, i => L(x + 0.14 * (i + 1), y0, x + 0.14 * (i + 1), oy + oh, 0.6));
          else if (o.paneles !== 0) inn += R(x + 0.1, y0 + 0.15, hw - 0.2, (oh - ban) * 0.42, 'none', 0.8) + R(x + 0.1, y0 + (oh - ban) * 0.5 + 0.05, hw - 0.2, (oh - ban) * 0.42, 'none', 0.8);
          if (o.tachas) for (let i = 0; i < 3; i++) for (let j = 0; j < 6; j++) inn += O(x + hw * (i + 1) / 4, y0 + (oh - ban) * (j + 0.6) / 6.4, 0.025, C.albero, 0.4);
        }
        if (dos) inn += L(cx, y0, cx, oy + oh, 1.2);
      }
      s += clip(d, inn) + P(d, 'none', 1.4);
      if (!o.vidrio) s += O(dos ? cx - 0.07 : ox + ow - 0.12, oy + oh * 0.58, 0.035, C.albero, 0.6) + (dos ? O(cx + 0.07, oy + oh * 0.58, 0.035, C.albero, 0.6) : '');
      return s + L(-0.05, h, w + 0.05, h, 1.6);
    };
  }

  /* ---------- Constructor de ventanas ---------- */
  function carpinteria(t, x, y, w, h, sp) {
    const X = x + w, Y = y + h;
    switch (t) {
      case 'cruz': return L(x + w / 2, y, x + w / 2, Y, 1.4) + L(x, y + Math.max(sp, h * 0.35), X, y + Math.max(sp, h * 0.35), 1.4);
      case 'guillotina': return L(x, y + h / 2, X, y + h / 2, 1.8) + [1, 2].map(i => L(x + w * i / 3, y, x + w * i / 3, Y, 0.7)).join('') + [1, 3].map(i => L(x, y + h * i / 4, X, y + h * i / 4, 0.7)).join('');
      case 'panos': return L(x + w / 2, y, x + w / 2, Y, 1.2) + rep(h / 0.38, i => L(x, y + sp + 0.38 * (i + 1), X, y + sp + 0.38 * (i + 1), 0.8));
      case 'persianas': return [0, 1].map(k => R(x + k * w / 2, y + sp, w / 2, h - sp, C.persiana, 1) + rep((h - sp) / 0.12, i => L(x + k * w / 2 + 0.04, y + sp + 0.12 * (i + 1), x + (k + 1) * w / 2 - 0.04, y + sp + 0.12 * (i + 1), 0.5))).join('');
      case 'reja': return rep(w / 0.13 + 1, i => L(x + 0.065 + i * 0.13, y - 1, x + 0.065 + i * 0.13, Y, 1.3, C.sombra)) + L(x, y + h * 0.25, X, y + h * 0.25, 1.3, C.sombra) + L(x, y + h * 0.8, X, y + h * 0.8, 1.3, C.sombra);
      case 'vitral': return rep((w + h) / 0.25, i => L(x - h + i * 0.25, Y, x + i * 0.25, y - 0.1, 0.6) + L(x + i * 0.25 - h, y - 0.1 + 0, x + i * 0.25, Y + 0, 0.6))
        + [C.azul, C.almagra, C.albero, C.verde].map((c, i) => O(x + w * (i + 1) / 5, y + Math.max(sp * 0.6, 0.3), 0.07, c, 0.5)).join('');
      case 'celosia': return R(x, y - 1, w, h + 1, C.madera, 0) + rep((w + h) / 0.12, i => L(x - h + i * 0.12, Y, x + i * 0.12, y - 0.2, 0.8, C.cal) + L(x + i * 0.12 - h, y - 0.2, x + i * 0.12, Y, 0.8, C.cal));
      case 'corrida': return rep(3, i => L(x + w * (i + 1) / 4, y, x + w * (i + 1) / 4, Y, 1));
      case 'fijo': return L(x + w * 0.62, y, x + w * 0.62, Y, 1) + L(x + w * 0.15, y + h * 0.3, x + w * 0.35, y + h * 0.1, 1.2, C.cal) + L(x + w * 0.15, y + h * 0.42, x + w * 0.45, y + h * 0.12, 1.2, C.cal);
      case 'parasol': return rep(w / 0.3 + 1, i => R(x + i * 0.3, y - 0.2, 0.1, h + 0.4, C.hormigon, 1));
      case 'perforada': { let s = R(x, y - 1, w, h + 1, C.zinc, 0); for (let i = 0; i < w / 0.12; i++) for (let j = 0; j < h / 0.12; j++) s += `<circle cx="${x + 0.06 + i * 0.12}" cy="${y + 0.06 + j * 0.12}" r="0.03" fill="${C.sombra}"/>`; return s; }
      case 'postigos': return [0, 1].map(k => R(x + k * w / 2, y, w / 2, h, C.madera, 1) + rep(3, i => L(x + k * w / 2 + w / 8 * (i + 1), y, x + k * w / 2 + w / 8 * (i + 1), Y, 0.5)) + O(x + k * w / 2 + w / 4, y + h * 0.3, 0.06, C.vidrio, 0.6)).join('');
      default: return '';
    }
  }

  function ventana(o) {
    return (w, h) => {
      const gt = o.guardapolvo ? 0.35 : 0, al = o.alfeizar ? 0.14 : 0, bal = o.balcon ? 0.2 : 0, rc = o.rec ?? 0.12;
      const by = gt, bh = h - gt - al - bal, marco = col(o.marco || 'piedra');
      let s = '';
      if (o.guardapolvo === 'recto') s += R(-0.12, 0.1, w + 0.24, 0.22, marco, 1.2);
      if (o.guardapolvo === 'triangular') s += P(`M-0.12 ${gt} L${w / 2} 0 L${w + 0.12} ${gt} Z`, marco, 1.2);
      if (o.guardapolvo === 'curvo') s += P(`M-0.12 ${gt} Q${w / 2} -0.2 ${w + 0.12} ${gt} Z`, marco, 1.2);
      if (o.guardapolvo === 'teja') s += P(`M-0.25 ${gt} L${w / 2} 0 L${w + 0.25} ${gt} Z`, C.almagra, 1.2) + rep(w / 0.2, i => L(0.1 + i * 0.2, gt - 0.02, 0.1 + i * 0.2, gt * 0.55, 0.6));
      if (o.guardapolvo === 'conopial') s += P(`M-0.1 ${gt + 0.1} C0.1 ${gt} ${w / 2 - 0.15} ${gt} ${w / 2} 0 C${w / 2 + 0.15} ${gt} ${w - 0.1} ${gt} ${w + 0.1} ${gt + 0.1}`, 'none', 1.8);
      s += P(arco(o.arco, 0, by, w, bh), marco, 1.4);
      const ox = rc, oy = by + rc, ow = w - 2 * rc, oh = bh - 2 * rc, d = arco(o.arco, ox, oy, ow, oh), sp = arranque(o.arco, ow, oh);
      s += clip(d, R(ox - 1, oy - 1, ow + 2, oh + 2, C.vidrio, 0) + carpinteria(o.carp, ox, oy, ow, oh, sp)) + P(d, 'none', 1.2);
      if (al) s += R(-0.1, h - al - bal, w + 0.2, al, marco, 1);
      if (o.balcon) {
        const yb = h - 0.18, yt = yb - 0.9;
        s += R(-0.3, yb, w + 0.6, 0.18, C.piedra, 1.2);
        if (o.balcon === 'hierro') s += L(-0.25, yt, w + 0.25, yt, 2.4) + rep((w + 0.5) / 0.14 + 1, i => L(-0.25 + i * 0.14, yt, -0.25 + i * 0.14, yb, 0.9)) + rep(5, i => O(-0.25 + (w + 0.5) * (i + 0.5) / 5, yt + 0.45, 0.08, 'none', 0.7));
        if (o.balcon === 'balaustre') s += R(-0.28, yt, w + 0.56, 0.12, C.piedra, 1) + rep((w + 0.4) / 0.22, i => { const x = -0.15 + i * 0.22; return L(x, yt + 0.12, x, yb, 0.8) + E(x, yt + 0.5, 0.06, 0.18, C.piedra, 0.8); });
        if (o.balcon === 'latigo') s += L(-0.25, yt, w + 0.25, yt, 2.4) + P(`M-0.2 ${yb} C0 ${yt} ${w / 2} ${yb} ${w / 2} ${yt + 0.3} C${w / 2} ${yb} ${w} ${yt} ${w + 0.2} ${yb}`, 'none', 1.3) + O(w / 2, yt + 0.3, 0.1, 'none', 1);
      }
      return s;
    };
  }

  const ventanaOjo = o => (w, h) => O(w / 2, h / 2, w / 2, col(o.marco || 'piedra'), 1.4) + O(w / 2, h / 2, w / 2 - 0.12, C.vidrio, 1)
    + (o.cruz ? L(0.14, h / 2, w - 0.14, h / 2) + L(w / 2, 0.14, w / 2, h - 0.14) : L(w * 0.3, h * 0.45, w * 0.45, h * 0.3, 1.2, C.cal));

  /* ---------- Constructor de columnas ---------- */
  function columna(o) {
    return (w, h) => {
      const c = col(o.color || 'piedra'), cap = o.capitel || 'toscano';
      const capH = { toscano: 0.35, jonico: 0.35, corintio: 0.7, nouveau: 0.6, deco: 0.5, nazari: 0.45, zapata: 0.45, azulejo: 0.4, ninguno: 0 }[cap] ?? 0.35;
      const baseH = o.base === false ? 0 : 0.25, fw = o.ancho || w * 0.72, fx = (w - fw) / 2, f0 = capH, f1 = h - baseH;
      let s = '';
      if (o.fuste === 'haces') s += [0, 1, 2].map(i => R(fx + fw * i / 3, f0, fw / 3, f1 - f0, c, 1)).join('');
      else s += R(fx, f0, fw, f1 - f0, c, 1.2);
      if (o.fuste === 'estriado') s += rep(4, i => L(fx + fw * (i + 1) / 5, f0 + 0.05, fx + fw * (i + 1) / 5, f1 - 0.05, 0.6));
      if (o.fuste === 'cajeado') s += R(fx + 0.08, f0 + 0.15, fw - 0.16, f1 - f0 - 0.3, 'none', 0.8);
      if (o.fuste === 'anillado') s += rep((f1 - f0) / 0.6, i => R(fx - 0.03, f0 + 0.3 + i * 0.6, fw + 0.06, 0.07, c, 0.8));
      if (o.fuste === 'tablas') s += rep((f1 - f0) / 0.18, i => L(fx, f0 + 0.18 * (i + 1), fx + fw, f0 + 0.18 * (i + 1), 0.4)) + rep(3, i => O(fx + fw / 2, f0 + (f1 - f0) * (i + 1) / 4, 0.025, C.sombra, 0.5));
      if (o.fuste === 'ladrillo') s += rep((f1 - f0) / 0.12, i => L(fx, f0 + 0.12 * (i + 1), fx + fw, f0 + 0.12 * (i + 1), 0.4) + L(fx + fw * (i % 2 ? 0.3 : 0.7), f0 + 0.12 * i, fx + fw * (i % 2 ? 0.3 : 0.7), f0 + 0.12 * (i + 1), 0.4));
      if (baseH) s += R(fx - 0.06, h - baseH, fw + 0.12, baseH, c, 1.2) + L(fx - 0.06, h - baseH * 0.5, fx + fw + 0.06, h - baseH * 0.5, 0.6);
      switch (cap) {
        case 'toscano': s += R(0.02, 0, w - 0.04, 0.14, c, 1.2) + R(fx - 0.04, 0.14, fw + 0.08, 0.12, c, 1) + L(fx, 0.31, fx + fw, 0.31, 0.6); break;
        case 'jonico': s += R(0, 0, w, 0.12, c, 1.2) + R(fx - 0.04, 0.12, fw + 0.08, 0.14, c, 1) + [0.06, w - 0.06].map(x => O(x, 0.22, 0.12, c) + O(x, 0.22, 0.05, 'none', 0.7)).join(''); break;
        case 'corintio': s += P(`M${fx} ${capH} L${fx - 0.06} 0.12 H${fx + fw + 0.06} L${fx + fw} ${capH} Z`, c) + P(`M-0.05 0 H${w + 0.05} L${w - 0.02} 0.12 H0.02 Z`, c)
          + rep(4, i => { const x = fx + fw * i / 3, y = capH; return P(`M${x - 0.07} ${y} Q${x - 0.09} ${y - 0.25} ${x} ${y - 0.32} Q${x + 0.09} ${y - 0.25} ${x + 0.07} ${y}`, 'none', 0.8); }); break;
        case 'nouveau': s += P(`M${fx} ${capH} C${fx} ${capH * 0.5} 0 ${capH * 0.45} 0 0 H${w} C${w} ${capH * 0.45} ${fx + fw} ${capH * 0.5} ${fx + fw} ${capH} Z`, c) + O(w / 2, capH * 0.4, 0.07, C.albero, 0.8) + P(`M${fx} ${capH * 0.9} q-0.15 -0.2 0 -0.35 M${fx + fw} ${capH * 0.9} q0.15 -0.2 0 -0.35`, 'none', 0.8); break;
        case 'deco': s += R(0, 0, w, 0.12, c, 1.2) + R(0.07, 0.12, w - 0.14, 0.14, c, 1) + R(fx - 0.03, 0.26, fw + 0.06, 0.24, c, 1) + rep(3, i => L(fx + fw * (i + 1) / 4, 0.28, fx + fw * (i + 1) / 4, 0.48, 0.6)); break;
        case 'nazari': s += R(0, 0, w, 0.1, c, 1.2) + R(fx - 0.06, 0.1, fw + 0.12, capH - 0.18, c, 1) + P(`M${fx - 0.02} ${capH - 0.12} q${fw / 4 + 0.02} -0.15 ${fw / 2 + 0.02} 0 q${fw / 4} -0.15 ${fw / 2 + 0.02} 0`, 'none', 0.7) + R(fx - 0.02, capH - 0.08, fw + 0.04, 0.06, c, 0.8); break;
        case 'zapata': s += P(`M-0.25 0 H${w + 0.25} V0.12 Q${fx + fw} 0.14 ${fx + fw} ${capH} H${fx} Q${fx} 0.14 -0.25 0.12 Z`, c, 1.2); break;
        case 'azulejo': s += R(0, 0, w, 0.1, c, 1.2) + rep(3, i => R(fx + fw * i / 3, 0.1, fw / 3, capH - 0.1, i % 2 ? C.albero : C.azul, 0.6)); break;
      }
      return s;
    };
  }

  /* ---------- Constructor de cornisas y molduras (todo el ancho) ---------- */
  function franja(m, y, hb, w, c) {
    switch (m) {
      case 'corona': return R(-0.25, y, w + 0.5, hb, c, 1.2);
      case 'filete': return R(-0.1, y, w + 0.2, hb, c, 1);
      case 'friso': return R(0, y, w, hb, c, 1);
      case 'pretil': return R(0, y, w, hb, C.cal, 1.2);
      case 'denticulos': return R(-0.1, y, w + 0.2, hb, c, 1) + rep((w + 0.2) / 0.24, i => R(-0.05 + i * 0.24, y + hb * 0.15, 0.13, hb * 0.7, c, 0.8));
      case 'modillones': return R(-0.15, y, w + 0.3, hb, c, 1) + rep(w / 0.6 + 1, i => { const x = -0.05 + i * 0.6; return P(`M${x} ${y} H${x + 0.18} V${y + hb * 0.55} Q${x + 0.18} ${y + hb} ${x + 0.09} ${y + hb} Q${x} ${y + hb} ${x} ${y + hb * 0.5} Z`, c, 0.9); });
      case 'ovas': return R(-0.1, y, w + 0.2, hb, c, 1) + rep(w / 0.25 + 1, i => E(-0.02 + i * 0.25, y + hb / 2, 0.08, hb * 0.32, 'none', 0.7) + L(0.105 + i * 0.25, y + hb * 0.2, 0.105 + i * 0.25, y + hb * 0.8, 0.6));
      case 'azulejo': { const n = Math.max(1, Math.round(w / hb)), t = w / n; return rep(n, i => R(i * t, y, t, hb, C.cal, 0.5) + P(`M${i * t + t / 2} ${y + 0.03} L${(i + 1) * t - 0.03} ${y + hb / 2} L${i * t + t / 2} ${y + hb - 0.03} L${i * t + 0.03} ${y + hb / 2} Z`, i % 2 ? C.azul : C.albero, 0.5)) + R(0, y, w, hb, 'none', 1.2); }
      case 'teja': return R(-0.3, y, w + 0.6, hb * 0.55, C.almagra, 1.1) + rep((w + 0.6) / 0.25, i => P(`M${-0.3 + i * 0.25} ${y + hb * 0.55} a0.125 0.125 0 0 0 0.25 0`, C.almagra, 0.8));
      case 'arquillos': { const t = 0.36; return R(0, y, w, hb, c, 1) + rep(w / t, i => P(`M${i * t + 0.04} ${y + hb} V${y + hb * 0.5} A${t / 2 - 0.04} ${t / 2 - 0.04} 0 0 1 ${(i + 1) * t - 0.04} ${y + hb * 0.5} V${y + hb}`, C.sombra, 0.7)); }
      case 'ladrillo': return R(-0.05, y, w + 0.1, hb, C.ladrillo, 1) + `<polyline points="${Array.from({ length: Math.ceil(w / 0.15) + 1 }, (_, i) => `${i * 0.15} ${y + (i % 2 ? hb * 0.2 : hb * 0.8)}`).join(' ')}" ${st('none', 0.8)}/>`;
      case 'escalones': return R(0, y, w, hb / 3, c, 1.2) + R(0.15, y + hb / 3, w - 0.3, hb / 3, c, 1) + R(0.3, y + hb * 2 / 3, w - 0.6, hb / 3, c, 1);
      case 'estrias': return R(0.3, y, w - 0.6, hb, c, 1) + rep((w - 0.8) / 0.2 + 1, i => L(0.4 + i * 0.2, y + hb * 0.1, 0.4 + i * 0.2, y + hb * 0.9, 0.6));
      case 'ondas': return R(-0.1, y, w + 0.2, hb, c, 1) + `<polyline points="${Array.from({ length: Math.ceil(w / 0.05) + 1 }, (_, i) => `${i * 0.05} ${y + hb / 2 + hb * 0.28 * sin(i * 0.05 * 5)}`).join(' ')}" ${st('none', 1)}/>` + rep(w / 1.26, i => O(0.31 + i * 1.26, y + hb / 2, hb * 0.15, C.albero, 0.6));
      case 'cresteria': return L(0, y + hb, w, y + hb, 1.2) + rep(w / 0.3, i => { const x = i * 0.3 + 0.05; return P(`M${x} ${y + hb} L${x + 0.1} ${y + hb * 0.25} L${x + 0.2} ${y + hb} Z`, c, 0.8) + O(x + 0.1, y + hb * 0.2, 0.04, c, 0.6); });
      case 'losa': return R(-0.6, y, w + 1.2, hb, C.cal, 1.4);
      case 'hormigon': return R(-0.2, y, w + 0.4, hb, C.hormigon, 1.4) + rep(hb / 0.12, i => L(-0.2, y + 0.12 * (i + 1), w + 0.2, y + 0.12 * (i + 1), 0.4)) + rep(w / 0.6, i => O(0.3 + i * 0.6, y + hb / 2, 0.025, C.sombra, 0.5));
      case 'led': return R(-0.05, y, w + 0.1, hb, '#1c1712', 1) + L(0, y + hb / 2, w, y + hb / 2, 3, C.led);
      case 'canecillos': return R(-0.4, y, w + 0.8, hb * 0.4, C.madera, 1.1) + rep((w + 0.8) / 0.45, i => R(-0.35 + i * 0.45, y + hb * 0.4, 0.12, hb * 0.6, C.madera, 0.8));
      case 'tubos': return [0, 0.35, 0.7].map(k => L(-0.05, y + hb * k + 0.05, w + 0.05, y + hb * k + 0.05, 2.4)).join('') + rep(w / 1.2 + 1, i => L(i * 1.2, y + 0.05, i * 1.2, y + hb, 1.8));
      case 'chapa': return R(-0.12, y, w + 0.24, hb, C.zinc, 1.2);
      default: return '';
    }
  }
  const cornisa = (capas, c) => (w, h) => {
    const total = capas.reduce((a, [, hb]) => a + hb, 0), k = h / total;
    let y = 0;
    return capas.map(([m, hb]) => { const s = franja(m, y, hb * k, w, col(c)); y += hb * k; return s; }).join('');
  };

  /* ---------- Constructor de zócalos (todo el ancho) ---------- */
  function zocalo(t, c) {
    return (w, h) => {
      switch (t) {
        case 'alicatado': { const t2 = h / 3, n = Math.max(1, Math.round(w / t2)), tw = w / n; let s = '';
          for (let i = 0; i < n; i++) for (let j = 0; j < 3; j++) { const x = i * tw + tw / 2, y = j * t2 + t2 / 2, r = t2 * 0.42, f = [C.azul, C.verde, C.almagra][(i + j) % 3];
            s += R(i * tw, j * t2, tw, t2, C.cal, 0.4) + `<polygon points="${rep(8, k => { const a = k * PI / 4 + PI / 8, rr = k % 2 ? r * 0.55 : r; return `${x + rr * cos(a)},${y + rr * sin(a)} `; })}" ${st(f, 0.5)}/>`; }
          return s + R(0, 0, w, h, 'none', 1.4); }
        case 'piedra': { const anchos = [0.55, 0.8, 0.62, 0.95, 0.7, 0.5, 0.85], rows = 3, rh = h / rows; let s = R(0, 0, w, h, '#a99a80', 1.2), k = 0;
          for (let j = 0; j < rows; j++) { let x = j % 2 ? -0.3 : 0; while (x < w) { const a = anchos[k++ % anchos.length], x0 = Math.max(0, x), x1 = Math.min(w, x + a);
            if (x1 - x0 > 0.08) s += `<rect x="${x0 + 0.03}" y="${j * rh + 0.03}" width="${x1 - x0 - 0.06}" height="${rh - 0.06}" rx="0.08" ${st(k % 3 ? '#d6c7a6' : '#c8b891', 0.8)}/>`; x += a; } }
          return s; }
        case 'ladrillo': { let s = R(0, 0, w, h, C.ladrillo, 1.2); const rh = 0.12;
          for (let j = 0; j < h / rh; j++) { s += L(0, j * rh, w, j * rh, 0.4, C.cal); for (let x = j % 2 ? 0.15 : 0; x < w; x += 0.3) s += L(x, j * rh, x, Math.min(h, (j + 1) * rh), 0.4, C.cal); }
          return s + R(0, 0, w, h, 'none', 1.2); }
        case 'liso': return R(0, 0, w, h, col(c || 'revoque'), 1.2) + R(-0.05, 0, w + 0.1, 0.08, col(c || 'revoque'), 1);
        case 'granito': { let s = R(0, 0, w, h, C.granito, 1.2); for (let i = 0; i < w * h * 9; i++) s += `<circle cx="${(i * 0.618 * 7.3) % w}" cy="${(i * 0.382 * 3.1) % h}" r="0.016" fill="${C.cal}" opacity="0.5"/>`;
          return s + rep(w / 1.2, i => L((i + 1) * 1.2, 0, (i + 1) * 1.2, h, 0.6, C.cal)); }
        case 'hormigon': return R(0, 0, w, h, C.hormigon, 1.2) + rep(h / 0.15, i => L(0, 0.15 * (i + 1), w, 0.15 * (i + 1), 0.4)) + rep(w / 0.6, i => O(0.3 + i * 0.6, h / 2, 0.025, C.sombra, 0.5));
        case 'listones': return R(0, 0, w, h, '#a87c52', 1.2) + rep(w / 0.1, i => L(0.1 * (i + 1), 0, 0.1 * (i + 1), h, 0.5));
        case 'led': return R(0, 0, w, h, '#1c1712', 1.2) + rep(w / 0.9, i => R(0.08 + i * 0.9, 0.12, 0.74, h - 0.24, '#123a36', 0.8, C.led) + L(0.15 + i * 0.9, h / 2, 0.7 + i * 0.9, h / 2, 1.2, C.led));
        default: return R(0, 0, w, h, C.revoque, 1);
      }
    };
  }

  /* ---------- Piezas de fachada, por estilo ---------- */
  const estilos = [
    { id: 'clasico', nombre: 'Clásico grecorromano', epoca: 's. V a. C. – s. IV' },
    { id: 'mudejar', nombre: 'Mudéjar y andalusí', epoca: 's. XII – XV' },
    { id: 'gotico', nombre: 'Gótico', epoca: 's. XIII – XV' },
    { id: 'renacimiento', nombre: 'Renacimiento', epoca: 's. XVI' },
    { id: 'barroco', nombre: 'Barroco sevillano', epoca: 's. XVII – XVIII' },
    { id: 'colonial', nombre: 'Colonial rioplatense', epoca: 's. XVIII' },
    { id: 'italianizante', nombre: 'Italianizante', epoca: '1880 – 1910 · casa chorizo' },
    { id: 'academicismo', nombre: 'Academicismo francés', epoca: '1890 – 1930' },
    { id: 'nouveau', nombre: 'Art nouveau', epoca: '1900 – 1915' },
    { id: 'regionalismo', nombre: 'Regionalismo sevillano', epoca: '1910 – 1930' },
    { id: 'neocolonial', nombre: 'Neocolonial', epoca: '1915 – 1940' },
    { id: 'deco', nombre: 'Art déco', epoca: '1925 – 1940' },
    { id: 'racionalismo', nombre: 'Racionalismo', epoca: '1927 – 1950' },
    { id: 'pintoresquista', nombre: 'Chalet pintoresquista', epoca: '1920 – 1950' },
    { id: 'brutalismo', nombre: 'Brutalismo', epoca: '1955 – 1975' },
    { id: 'contemporaneo', nombre: 'Contemporáneo', epoca: '1990 – 2030' },
    { id: 'futuro', nombre: 'Sevilla 2126', epoca: 'archivo digital' }
  ];

  const pz = (estilo, cat, id, nombre, epoca, anio, w, h, desc, draw) => ({ estilo, cat, id, nombre, epoca, anio, w, h, desc, draw });

  const fachada = [
    /* Clásico */
    pz('clasico', 'puerta', 'puerta-romana', 'Portada de medio punto', 'Roma, s. I', 50, 1.8, 3.6, 'Arco de dovelas con clave. El arco que todos los siglos siguientes copiaron.', puerta({ arco: 'medio', rec: 0.22, dovelas: true, clave: true })),
    pz('clasico', 'puerta', 'puerta-templo', 'Portada de templo', 'Grecia, s. V a. C.', -430, 2.2, 4.2, 'Dintel, pilastras y frontón: la puerta como templo.', puerta({ arco: 'recto', pilastras: true, fronton: 'triangular' })),
    pz('clasico', 'ventana', 'ventana-romana', 'Ventana de medio punto', 'Roma, s. II', 120, 1.1, 2.2, 'Arco simple con cruz de carpintería.', ventana({ arco: 'medio', carp: 'cruz', alfeizar: true })),
    pz('clasico', 'columna', 'columna-dorica', 'Columna dórica', 'Grecia, s. V a. C.', -450, 0.7, 4, 'Fuste estriado, equino y ábaco. Sin basa.',
      (w, h) => R(0, 0, w, 0.14, C.piedra) + P(`M0.04 0.14 H${w - 0.04} Q${w - 0.08} 0.34 ${w - 0.13} 0.4 H0.13 Q0.08 0.34 0.04 0.14 Z`, C.piedra)
        + P(`M0.13 0.4 H${w - 0.13} L${w - 0.05} ${h} H0.05 Z`, C.piedra) + rep(4, i => { const t = (i + 1) / 5; return L(0.13 + (w - 0.26) * t, 0.45, 0.05 + (w - 0.1) * t, h, 0.6); })),
    pz('clasico', 'columna', 'columna-jonica', 'Columna jónica', 'Grecia, s. VI a. C.', -550, 0.7, 4, 'Capitel de volutas y basa moldurada.', columna({ capitel: 'jonico', fuste: 'estriado' })),
    pz('clasico', 'columna', 'columna-corintia', 'Columna corintia', 'Roma, s. II', 150, 0.75, 4, 'Capitel de hojas de acanto.', columna({ capitel: 'corintio', fuste: 'estriado' })),
    pz('clasico', 'moldura', 'cornisa-clasica', 'Cornisa con dentículos', 'Roma, s. I', 60, 3, 0.75, 'Corona, dentículos y friso liso.', cornisa([['corona', 0.18], ['filete', 0.08], ['denticulos', 0.14], ['filete', 0.1], ['friso', 0.25]], 'piedra')),
    pz('clasico', 'remate', 'fronton', 'Frontón triangular', 'Grecia, s. V a. C.', -440, 3, 1, 'El triángulo del templo, puesto sobre una casa.',
      (w, h) => P(`M-0.1 ${h} L${w / 2} 0 L${w + 0.1} ${h} Z`, C.piedra, 1.4) + P(`M0.4 ${h - 0.15} L${w / 2} 0.25 L${w - 0.4} ${h - 0.15} Z`, 'none', 0.8) + R(-0.15, h - 0.12, w + 0.3, 0.12, C.piedra)),
    pz('clasico', 'ornamento', 'acrotera', 'Acrótera de palmeta', 'Grecia, s. V a. C.', -420, 0.7, 0.8, 'Palmeta de piedra para las esquinas del frontón.',
      (w, h) => rep(7, i => E(w / 2, h - 0.45, 0.06, 0.3, C.piedra, 0.9, C.tinta, `transform="rotate(${(i - 3) * 22} ${w / 2} ${h - 0.15})"`)) + R(0.1, h - 0.15, w - 0.2, 0.15, C.piedra)),

    /* Mudéjar y andalusí */
    pz('mudejar', 'puerta', 'puerta-mudejar', 'Arco de herradura con alfiz', 'Mudéjar, s. XIV', 1350, 2, 3.6, 'Dovelas alternadas en almagra y cal, enmarcadas por el alfiz.',
      (w, h) => { const cx = w / 2, r = 0.62, cy = 1.2, a0 = 25 * PI / 180, r2 = r + 0.26, pt = (a, rad) => [cx + rad * cos(a), cy - rad * sin(a)];
        const jl = cx - r * cos(a0), jr = cx + r * cos(a0), ly = cy + r * sin(a0);
        let s = R(0, 0, w, h, C.cal, 1.4) + R(cx - r2 - 0.12, cy - r2 - 0.12, 2 * (r2 + 0.12), r2 + 0.17 + r2 * sin(a0), 'none', 1);
        for (let i = 0; i < 12; i++) { const a1 = -a0 + (PI + 2 * a0) * i / 12, a2 = -a0 + (PI + 2 * a0) * (i + 1) / 12, [x1, y1] = pt(a1, r), [x2, y2] = pt(a2, r), [x3, y3] = pt(a2, r2), [x4, y4] = pt(a1, r2);
          s += P(`M${x1} ${y1} L${x2} ${y2} L${x3} ${y3} L${x4} ${y4} Z`, i % 2 ? C.cal : C.almagra, 0.8); }
        return s + P(`M${jl} ${h} V${ly} A${r} ${r} 0 1 1 ${jr} ${ly} V${h} Z`, C.sombra, 1.2) + L(cx, ly, cx, h, 0.8, C.piedra); }),
    pz('mudejar', 'puerta', 'puerta-lobulada', 'Arco lobulado', 'Almohade, s. XII', 1180, 2, 3.6, 'Tres lóbulos bajo alfiz, con clavos de bronce.', puerta({ arco: 'trilobulado', marco: 'cal', alfiz: true, tachas: true, rec: 0.25 })),
    pz('mudejar', 'ventana', 'ventana-ajimez', 'Ajimez', 'Nazarí, s. XIV', 1360, 1.6, 2.2, 'Dos arcos gemelos separados por una columnita.',
      (w, h) => R(0, 0, w, h, C.cal, 1.4) + R(0.08, 0.08, w - 0.16, 0.95, 'none', 0.8) + P(arco('herradura', 0.18, 0.25, 0.55, h - 0.4), C.sombra, 1.2) + P(arco('herradura', w - 0.73, 0.25, 0.55, h - 0.4), C.sombra, 1.2)
        + R(w / 2 - 0.04, 0.62, 0.08, h - 0.77, C.piedra, 0.8) + R(w / 2 - 0.08, 0.56, 0.16, 0.08, C.piedra, 0.8) + R(-0.05, h - 0.13, w + 0.1, 0.13, C.piedra)),
    pz('mudejar', 'ventana', 'ventana-celosia', 'Ventana con celosía', 'Mudéjar, s. XIV', 1380, 1, 1.9, 'Celosía de madera para ver sin ser visto.', ventana({ arco: 'herradura', carp: 'celosia', marco: 'cal', alfeizar: true })),
    pz('mudejar', 'columna', 'columna-nazari', 'Columna nazarí', 'Alhambra, s. XIV', 1370, 0.45, 3.6, 'Fuste fino de mármol y capitel cúbico.', columna({ capitel: 'nazari', fuste: 'liso', color: 'cal', ancho: 0.22 })),
    pz('mudejar', 'moldura', 'friso-arquillos', 'Friso de arquillos', 'Mudéjar, s. XIV', 1340, 3, 0.7, 'Arquillos ciegos y ladrillo en esquinilla.', cornisa([['filete', 0.1], ['arquillos', 0.35], ['ladrillo', 0.25]], 'cal')),
    pz('mudejar', 'zocalo', 'zocalo-alicatado', 'Zócalo alicatado', 'Nazarí, s. XIV', 1355, 3, 1.1, 'Lacería de estrellas en cerámica vidriada.', zocalo('alicatado')),
    pz('mudejar', 'remate', 'almenas', 'Almenas escalonadas', 'Almohade, s. XII', 1190, 3, 0.9, 'Merlones dentados, como en la muralla de la Macarena.',
      (w, h) => R(0, h - 0.15, w, 0.15, C.cal, 1.2) + rep(w / 0.6, i => { const x = i * 0.6 + 0.05; return P(`M${x} ${h - 0.15} V0.45 H${x + 0.08} V0.2 H${x + 0.17} V0 H${x + 0.33} V0.2 H${x + 0.42} V0.45 H${x + 0.5} V${h - 0.15} Z`, C.cal, 1.1); })),

    /* Gótico */
    pz('gotico', 'puerta', 'puerta-gotica', 'Portada de arquivoltas', 'Gótico, s. XIII', 1260, 2.4, 4.4, 'Arcos apuntados que se repiten hacia adentro.', puerta({ arco: 'apuntado', rec: 0.5, arquivoltas: 4 })),
    pz('gotico', 'ventana', 'ventana-gotica', 'Ventana ojival', 'Gótico, s. XIII', 1250, 1.2, 2.6, 'Dos lancetas y un óculo bajo un arco apuntado.',
      (w, h) => { const sp = w * 0.85;
        return P(`M0 ${h} V${sp} Q0 0.2 ${w / 2} 0 Q${w} 0.2 ${w} ${sp} V${h} Z`, C.piedra, 1.4) + P(`M0.12 ${h - 0.05} V${sp} Q0.12 0.35 ${w / 2} 0.17 Q${w - 0.12} 0.35 ${w - 0.12} ${sp} V${h - 0.05} Z`, C.vidrio)
          + L(w / 2, sp + 0.1, w / 2, h - 0.05, 1.4) + P(`M0.12 ${sp + 0.45} Q0.12 ${sp + 0.05} ${w / 4 + 0.03} ${sp - 0.02} Q${w / 2} ${sp + 0.05} ${w / 2} ${sp + 0.45}`, 'none', 1)
          + P(`M${w / 2} ${sp + 0.45} Q${w / 2} ${sp + 0.05} ${w * 3 / 4 - 0.03} ${sp - 0.02} Q${w - 0.12} ${sp + 0.05} ${w - 0.12} ${sp + 0.45}`, 'none', 1) + O(w / 2, sp - 0.35, 0.17, C.albero, 1) + L(0, h, w, h, 1.6); }),
    pz('gotico', 'ventana', 'ventana-conopial', 'Ventana conopial', 'Gótico isabelino, s. XV', 1490, 1.2, 2.4, 'Arco en contracurva con chambrana.', ventana({ arco: 'conopial', carp: 'cruz', guardapolvo: 'conopial', alfeizar: true })),
    pz('gotico', 'columna', 'pilar-haces', 'Pilar de haces', 'Gótico, s. XIII', 1270, 0.7, 4, 'Columnas finas atadas en un solo pilar.', columna({ capitel: 'toscano', fuste: 'haces' })),
    pz('gotico', 'moldura', 'cresteria', 'Crestería', 'Gótico flamígero, s. XV', 1470, 3, 0.6, 'Remate calado de florones.', cornisa([['cresteria', 0.4], ['filete', 0.1], ['friso', 0.1]], 'piedra')),
    pz('gotico', 'remate', 'pinaculo', 'Pináculo', 'Gótico, s. XV', 1450, 0.5, 1.6, 'Aguja con crochets.',
      (w, h) => R(0.05, h - 0.4, w - 0.1, 0.4, C.piedra) + P(`M0.1 ${h - 0.4} L${w / 2} 0.12 L${w - 0.1} ${h - 0.4} Z`, C.piedra)
        + rep(3, i => { const t = (i + 1) / 4, y = h - 0.4 - (h - 0.52) * t, dx = (w / 2 - 0.1) * (1 - t); return O(w / 2 - dx, y, 0.035, C.piedra, 0.6) + O(w / 2 + dx, y, 0.035, C.piedra, 0.6); }) + O(w / 2, 0.08, 0.07, C.albero, 0.8)),
    pz('gotico', 'ornamento', 'roseton', 'Rosetón', 'Gótico, s. XIII', 1255, 1.4, 1.4, 'Ventana circular de tracería radial.',
      (w) => { const c = w / 2; return O(c, c, c, C.piedra, 1.4) + O(c, c, c - 0.12, C.vidrio) + rep(12, i => { const a = i * PI / 6; return L(c + 0.15 * cos(a), c + 0.15 * sin(a), c + (c - 0.12) * cos(a), c + (c - 0.12) * sin(a), 0.8); })
        + rep(12, i => { const a = (i + 0.5) * PI / 6; return O(c + 0.45 * cos(a), c + 0.45 * sin(a), 0.08, [C.azul, C.almagra, C.albero][i % 3], 0.6); }) + O(c, c, 0.15, C.albero, 1); }),

    /* Renacimiento */
    pz('renacimiento', 'puerta', 'puerta-renacentista', 'Portada renacentista', 'Renacimiento, s. XVI', 1540, 2.4, 4.4, 'Arco de medio punto entre pilastras, con entablamento.', puerta({ arco: 'medio', pilastras: true, cornisa: true, clave: true, rec: 0.2 })),
    pz('renacimiento', 'ventana', 'ventana-cruz', 'Ventana de cruz', 'Renacimiento, s. XVI', 1530, 1.3, 2.3, 'Montante y travesaño en cruz bajo frontoncillo.', ventana({ arco: 'recto', carp: 'cruz', guardapolvo: 'triangular', alfeizar: true, rec: 0.15 })),
    pz('renacimiento', 'columna', 'columna-toscana', 'Columna toscana', 'Renacimiento, s. XVI', 1550, 0.65, 4, 'El orden más sobrio, según Serlio.', columna({ capitel: 'toscano', fuste: 'liso' })),
    pz('renacimiento', 'moldura', 'cornisa-ovas', 'Cornisa de ovas', 'Renacimiento, s. XVI', 1545, 3, 0.7, 'Corona y moldura de ovas y dardos.', cornisa([['corona', 0.16], ['ovas', 0.18], ['filete', 0.08], ['friso', 0.28]], 'piedra')),
    pz('renacimiento', 'zocalo', 'zocalo-almohadillado', 'Almohadillado', 'Renacimiento, s. XV', 1480, 3, 1.2, 'Sillares rústicos trabados, con biseles.',
      (w, h) => { const rh = h / 3; let s = ''; for (let j = 0; j < 3; j++) { const y = j * rh; for (let x = j % 2 ? -0.45 : 0; x < w; x += 0.9) { const x0 = Math.max(0, x), x1 = Math.min(w, x + 0.9); s += R(x0, y, x1 - x0, rh, C.piedra, 1) + R(x0 + 0.06, y + 0.06, x1 - x0 - 0.12, rh - 0.12, 'none', 0.5); } } return s; }),
    pz('renacimiento', 'remate', 'linterna', 'Linterna', 'Renacimiento, s. XVI', 1520, 1, 1.8, 'Torrecilla con cúpula para la luz cenital.',
      (w, h) => R(0.1, h - 0.4, w - 0.2, 0.4, C.piedra) + R(0.2, 0.7, w - 0.4, h - 1.1, C.cal) + P(arco('medio', 0.3, 0.85, 0.15, 0.5), C.sombra, 0.8) + P(arco('medio', w - 0.45, 0.85, 0.15, 0.5), C.sombra, 0.8)
        + P(`M0.15 0.75 Q${w / 2} -0.05 ${w - 0.15} 0.75 Z`, C.piedra) + L(w / 2, 0.36, w / 2, 0.05, 1) + O(w / 2, 0.04, 0.05, C.albero, 0.8)),
    pz('renacimiento', 'ornamento', 'escudo', 'Escudo heráldico', 'Renacimiento, s. XVI', 1560, 0.9, 1.2, 'Blasón cuartelado bajo corona.',
      (w, h) => P(`M0.1 0.3 L0.15 0.05 L0.3 0.2 L${w / 2} 0 L${w - 0.3} 0.2 L${w - 0.15} 0.05 L${w - 0.1} 0.3 Z`, C.albero, 1) + P(`M0.08 0.32 H${w - 0.08} V0.8 Q${w - 0.08} ${h} ${w / 2} ${h} Q0.08 ${h} 0.08 0.8 Z`, C.piedra, 1.3)
        + R(0.12, 0.36, w / 2 - 0.14, 0.32, C.almagra, 0.6) + R(w / 2 + 0.02, 0.72, w / 2 - 0.14, 0.2, C.azul, 0.6) + L(w / 2, 0.32, w / 2, h, 0.8) + L(0.08, 0.7, w - 0.08, 0.7, 0.8)),

    /* Barroco sevillano */
    pz('barroco', 'puerta', 'puerta-barroca', 'Portada barroca', 'Barroco sevillano, s. XVIII', 1720, 2.4, 4.4, 'Pilastras, entablamento y frontón curvo partido con cartela dorada.',
      (w, h) => R(0, 1.05, 0.35, h - 1.05, C.piedra) + R(w - 0.35, 1.05, 0.35, h - 1.05, C.piedra) + R(0.35, 1.05, w - 0.7, h - 1.05, C.cal, 1) + R(0.55, 1.45, w - 1.1, h - 1.45, C.madera)
        + R(0.7, 1.65, (w - 1.4) / 2 - 0.05, 1.2, 'none', 0.7) + R(w / 2 + 0.05, 1.65, (w - 1.4) / 2 - 0.05, 1.2, 'none', 0.7) + R(-0.1, 0.75, w + 0.2, 0.3, C.piedra)
        + P(`M-0.1 0.75 Q0.1 0.05 ${w / 2 - 0.35} 0.3`, 'none', 2.2) + P(`M${w + 0.1} 0.75 Q${w - 0.1} 0.05 ${w / 2 + 0.35} 0.3`, 'none', 2.2) + E(w / 2, 0.38, 0.22, 0.32, C.albero)),
    pz('barroco', 'ventana', 'ventana-mixtilinea', 'Ventana mixtilínea', 'Barroco sevillano, s. XVIII', 1740, 1.3, 2.5, 'Recercado en albero y reja de hierro.', ventana({ arco: 'mixtilineo', carp: 'reja', marco: 'albero', guardapolvo: 'curvo', alfeizar: true, rec: 0.16 })),
    pz('barroco', 'ventana', 'ventana-cierro', 'Cierro sevillano', 'Sevilla, s. XVIII', 1750, 1.6, 2.6, 'Ventana volada con reja y tejadillo, para mirar la calle sin ser visto.',
      (w, h) => P(`M-0.1 0.35 L${w / 2} 0 L${w + 0.1} 0.35 Z`, C.madera) + R(0, 0.35, w, h - 0.65, C.vidrio, 1.6) + rep(7, i => { const x = 0.1 + (w - 0.2) * i / 6; return L(x, 0.35, x, h - 0.3, 1); })
        + L(0, 0.8, w, 0.8) + L(0, h - 0.75, w, h - 0.75) + rep(3, i => O(0.1 + (w - 0.2) * (i * 2 + 1) / 6, h - 0.52, 0.1, 'none', 0.8))
        + R(-0.12, h - 0.3, w + 0.24, 0.18, C.piedra) + P(`M0.15 ${h - 0.12} Q${w / 2} ${h + 0.25} ${w - 0.15} ${h - 0.12}`, C.piedra)),
    pz('barroco', 'columna', 'columna-salomonica', 'Columna salomónica', 'Barroco sevillano, s. XVII', 1680, 0.7, 4, 'Fuste retorcido y dorado, como en los retablos.',
      (w, h) => { const y0 = 0.45, y1 = h - 0.25, amp = 0.07, per = 0.7, Lp = [], Rp = [];
        for (let i = 0; i <= 40; i++) { const y = y0 + (y1 - y0) * i / 40, o = amp * sin((y - y0) / per * 2 * PI); Lp.push(`${0.14 + o} ${y}`); Rp.unshift(`${w - 0.14 + o} ${y}`); }
        let s = P(`M${Lp.join(' L')} L${Rp.join(' L')} Z`, C.albero, 1.2);
        for (let y = y0 + 0.1; y < y1 - 0.3; y += per / 2) s += L(0.14 + amp * sin((y - y0) / per * 2 * PI), y, w - 0.14 + amp * sin((y + 0.25 - y0) / per * 2 * PI), y + 0.25, 0.8);
        return s + R(0.02, h - 0.25, w - 0.04, 0.25, C.piedra) + P(`M0.12 ${y0} L0.03 0.1 H${w - 0.03} L${w - 0.12} ${y0} Z`, C.albero) + R(-0.04, 0, w + 0.08, 0.1, C.piedra); }),
    pz('barroco', 'moldura', 'cornisa-barroca', 'Cornisa de modillones', 'Barroco sevillano, s. XVIII', 1730, 3, 0.8, 'Modillones en voluta sobre friso pintado.', cornisa([['corona', 0.2], ['modillones', 0.3], ['friso', 0.3]], 'albero')),
    pz('barroco', 'zocalo', 'zocalo-almagra', 'Zócalo a la almagra', 'Sevilla, s. XVIII', 1760, 3, 0.9, 'Pintura roja de óxido de hierro sobre la cal.', zocalo('liso', '#b5523a')),
    pz('barroco', 'remate', 'espadana', 'Espadaña', 'Sevilla, s. XVII', 1650, 1.8, 2.4, 'Muro-campanario encalado con remates en almagra.',
      (w, h) => { const cx = w / 2; return P(`M0 ${h} V0.9 H0.3 Q0.3 0.35 ${cx} 0.25 Q${w - 0.3} 0.35 ${w - 0.3} 0.9 H${w} V${h} Z`, C.cal, 1.4) + P(`M${cx - 0.3} ${h - 0.15} V1.15 A0.3 0.3 0 0 1 ${cx + 0.3} 1.15 V${h - 0.15} Z`, C.sombra)
        + P(`M${cx - 0.2} 1.75 Q${cx - 0.18} 1.2 ${cx} 1.2 Q${cx + 0.18} 1.2 ${cx + 0.2} 1.75 Z`, C.albero) + L(cx, 0.25, cx, -0.1, 1.2) + O(cx, -0.15, 0.07, C.albero, 0.8) + R(-0.08, 0.82, 0.46, 0.1, C.almagra, 0.8) + R(w - 0.38, 0.82, 0.46, 0.1, C.almagra, 0.8); }),

    /* Colonial rioplatense */
    pz('colonial', 'puerta', 'porton-colonial', 'Portón de cuarterones', 'Colonial, s. XVIII', 1770, 1.8, 3.2, 'Madera con clavos de hierro bajo dintel encalado.', puerta({ arco: 'recto', marco: 'cal', tachas: true, rec: 0.2 })),
    pz('colonial', 'ventana', 'ventana-reja-colonial', 'Ventana de reja', 'Colonial, s. XVIII', 1780, 1.3, 2, 'Reja de hierro forjado a ras de muro.', ventana({ arco: 'recto', carp: 'reja', marco: 'cal', alfeizar: true, rec: 0.14 })),
    pz('colonial', 'ventana', 'ventana-panos', 'Ventana de paños', 'Colonial, s. XVIII', 1790, 1.1, 1.8, 'Vidrios chicos en carpintería de madera.', ventana({ arco: 'recto', carp: 'panos', marco: 'cal', alfeizar: true })),
    pz('colonial', 'columna', 'pie-derecho', 'Pie derecho con zapata', 'Colonial, s. XVIII', 1760, 0.6, 3.4, 'Poste de madera para la galería.', columna({ capitel: 'zapata', fuste: 'liso', color: 'madera', base: false, ancho: 0.22 })),
    pz('colonial', 'moldura', 'alero-teja', 'Alero de teja árabe', 'Andalucía → Río de la Plata, s. XVIII', 1765, 3, 0.55, 'Tejas curvas sobre tabla de madera.', cornisa([['teja', 0.45], ['filete', 0.1]], 'madera')),
    pz('colonial', 'zocalo', 'zocalo-revocado', 'Zócalo revocado', 'Colonial, s. XVIII', 1775, 3, 0.8, 'Revoque grueso pintado a la cal.', zocalo('liso', 'revoque')),
    pz('colonial', 'ornamento', 'farol', 'Farol de pared', 'Colonial, s. XVIII', 1790, 0.5, 1, 'Farol de hierro con brazo a la pared.',
      (w, h) => P('M0 0.2 H0.25 V0.3', 'none', 1.4) + P('M0.1 0.3 H0.4 L0.34 0.38 H0.16 Z', C.tinta, 1) + P('M0.12 0.38 H0.38 L0.42 0.75 H0.08 Z', C.albero, 1.1) + L(0.25, 0.38, 0.25, 0.75, 0.6) + R(0.1, 0.75, 0.3, 0.06, C.tinta, 0.8) + P(`M0.18 0.81 L0.25 ${h} L0.32 0.81`, 'none', 1)),

    /* Italianizante (casa chorizo) */
    pz('italianizante', 'puerta', 'puerta-chorizo', 'Puerta de casa chorizo', 'Buenos Aires, c. 1890', 1890, 1.4, 3.4, 'Dos hojas de madera con banderola de hierro. Llega directo desde Caballito.',
      (w, h) => { const lw = (w - 0.16) / 2; return R(0, 0, w, h, C.cal, 1.6) + R(0.08, 0.08, w - 0.16, 0.7, C.vidrio) + rep(5, i => L(w / 2, 0.78, 0.08 + (w - 0.16) * i / 4, 0.08, 0.8))
        + [0, 1].map(k => { const x = 0.08 + k * lw; return R(x, 0.86, lw, h - 0.94, C.madera) + R(x + 0.1, 1, lw - 0.2, 1.1, 'none', 0.8) + R(x + 0.1, 2.25, lw - 0.2, h - 2.5, 'none', 0.8); }).join('')
        + O(w / 2 - 0.1, 2.15, 0.04, C.albero, 0.6) + O(w / 2 + 0.1, 2.15, 0.04, C.albero, 0.6); }),
    pz('italianizante', 'ventana', 'ventana-balcon', 'Balcón con persianas', 'Buenos Aires, 1910', 1910, 1.4, 3, 'Persianas de madera verde y baranda de hierro.', ventana({ arco: 'recto', carp: 'persianas', guardapolvo: 'recto', balcon: 'hierro', rec: 0.1 })),
    pz('italianizante', 'ventana', 'ventana-italianizante', 'Ventana con guardapolvo', 'Italianizante, 1890', 1892, 1.3, 2.8, 'Arco rebajado, persianas y guardapolvo curvo.', ventana({ arco: 'rebajado', carp: 'persianas', guardapolvo: 'curvo', alfeizar: true })),
    pz('italianizante', 'columna', 'pilastra-cajeada', 'Pilastra cajeada', 'Italianizante, 1885', 1885, 0.55, 4, 'Pilastra plana con panel rehundido.', columna({ capitel: 'toscano', fuste: 'cajeado', ancho: 0.45 })),
    pz('italianizante', 'moldura', 'balaustrada', 'Balaustrada', 'Italianizante porteño, 1900', 1900, 3, 1.1, 'Pretil de balaustres y pedestales: el remate típico de la casa chorizo.',
      (w, h) => { let s = R(-0.1, h - 0.15, w + 0.2, 0.15, C.piedra); const np = Math.max(2, Math.round(w / 2.5) + 1), ped = 0.34, xs = Array.from({ length: np }, (_, i) => i * (w - ped) / (np - 1));
        for (let k = 0; k < np - 1; k++) { const a = xs[k] + ped, b = xs[k + 1], n = Math.max(1, Math.floor((b - a) / 0.22)); for (let i = 0; i < n; i++) { const x = a + (b - a) * (i + 0.5) / n; s += L(x, 0.15, x, h - 0.15, 0.9) + E(x, h * 0.58, 0.07, h * 0.18, C.piedra, 0.9); } }
        return s + xs.map(x => R(x, 0.15, ped, h - 0.3, C.piedra)).join('') + R(-0.12, 0, w + 0.24, 0.15, C.piedra); }),
    pz('italianizante', 'moldura', 'cornisa-mensulas', 'Cornisa de ménsulas', 'Italianizante, 1895', 1895, 3, 0.8, 'Ménsulas bajo una corona saliente.', cornisa([['corona', 0.18], ['modillones', 0.32], ['filete', 0.08], ['friso', 0.22]], 'piedra')),
    pz('italianizante', 'zocalo', 'zocalo-simil', 'Zócalo símil piedra', 'Frentistas italianos, 1910', 1910, 3, 0.9, 'Revoque que imita mármol: el oficio original de los frentistas.',
      (w, h) => { const n = Math.max(1, Math.round(w / 1.3)), pw = w / n; let s = R(0, 0, w, h, '#d8d0c4', 1.2) + R(-0.05, 0, w + 0.1, 0.1, '#cfc6b8', 1);
        for (let i = 0; i < n; i++) { const x = i * pw; s += R(x + 0.1, 0.22, pw - 0.2, h - 0.34, 'none', 0.7) + P(`M${x + 0.2} ${h * 0.4} q${pw * 0.2} ${h * 0.15} ${pw * 0.35} ${-h * 0.05} t${pw * 0.3} ${h * 0.2}`, 'none', 0.5); } return s; }),
    pz('italianizante', 'remate', 'jarron', 'Jarrón de pretil', 'Buenos Aires, 1905', 1905, 0.6, 1, 'Copón de cemento sobre los pedestales de la balaustrada.',
      (w, h) => R(0.1, h - 0.18, w - 0.2, 0.18, C.piedra) + P(`M0.16 ${h - 0.18} Q-0.02 0.5 0.12 0.32 H${w - 0.12} Q${w + 0.02} 0.5 ${w - 0.16} ${h - 0.18} Z`, C.piedra) + R(0.06, 0.24, w - 0.12, 0.08, C.piedra) + P(`M${w / 2 - 0.1} 0.24 Q${w / 2} 0 ${w / 2 + 0.1} 0.24 Z`, C.piedra) + L(0.1, 0.55, w - 0.1, 0.55, 0.6)),
    pz('italianizante', 'ornamento', 'cartela', 'Cartela con fecha', 'Frentistas, 1907', 1907, 1.4, 0.8, 'Los frentistas firmaban el año de la obra. Este número ya no significa nada.',
      (w, h) => P(`M0.15 0.1 H${w - 0.15} Q${w} 0.1 ${w - 0.05} ${h / 2} Q${w} ${h - 0.1} ${w - 0.15} ${h - 0.1} H0.15 Q0 ${h - 0.1} 0.05 ${h / 2} Q0 0.1 0.15 0.1 Z`, C.piedra, 1.3)
        + `<text x="${w / 2}" y="${h / 2 + 0.1}" font-size="0.28" text-anchor="middle" font-family="'IM Fell English SC', Georgia, serif" fill="${C.tinta}">MCMVII</text>`),

    /* Academicismo francés */
    pz('academicismo', 'puerta', 'puerta-cochera', 'Puerta cochera', 'Academicismo francés, 1910', 1910, 2.4, 4.4, 'Gran arco con banderola de hierro y clave.', puerta({ arco: 'medio', banderola: true, clave: true, cornisa: true, hoja: 'verdeOsc', rec: 0.24 })),
    pz('academicismo', 'ventana', 'ventana-francesa', 'Ventana francesa con balcón', 'Academicismo, 1905', 1905, 1.3, 3, 'Ventana de paños con frontoncillo y balcón de hierro.', ventana({ arco: 'recto', carp: 'panos', guardapolvo: 'triangular', balcon: 'hierro', rec: 0.14 })),
    pz('academicismo', 'ventana', 'ventana-ojo', 'Óculo', 'Academicismo, 1900', 1900, 1, 1, 'Ventana redonda con cruz de carpintería.', ventanaOjo({ cruz: true })),
    pz('academicismo', 'columna', 'columna-corintia-lisa', 'Columna corintia lisa', 'Academicismo, 1912', 1912, 0.75, 4, 'El corintio de la Ópera de París, en versión porteña.', columna({ capitel: 'corintio', fuste: 'liso' })),
    pz('academicismo', 'moldura', 'cornisa-academica', 'Cornisa con ménsulas y ovas', 'Academicismo, 1910', 1911, 3, 0.9, 'Corona, ménsulas, ovas y friso.', cornisa([['corona', 0.2], ['modillones', 0.28], ['ovas', 0.16], ['friso', 0.26]], 'piedra')),
    pz('academicismo', 'remate', 'mansarda', 'Mansarda', 'París → Buenos Aires, 1900', 1901, 3, 2, 'Techo de pizarra con buhardilla y crestería de hierro.',
      (w, h) => P(`M0 ${h} L0.35 0.3 H${w - 0.35} L${w} ${h} Z`, C.pizarra, 1.3) + rep((h - 0.3) / 0.15, i => L(0.35 - 0.35 * (i + 1) * 0.15 / (h - 0.3), 0.3 + (i + 1) * 0.15, w - 0.35 + 0.35 * (i + 1) * 0.15 / (h - 0.3), 0.3 + (i + 1) * 0.15, 0.4, C.cal))
        + R(w / 2 - 0.4, 0.6, 0.8, h - 0.6, C.piedra, 1.2) + P(`M${w / 2 - 0.5} 0.65 Q${w / 2} 0.15 ${w / 2 + 0.5} 0.65 Z`, C.piedra) + O(w / 2, 1.1, 0.27, C.vidrio, 1) + L(0.35, 0.3, w - 0.35, 0.3, 2.2)
        + rep(w / 0.4, i => L(0.4 + i * 0.4, 0.3, 0.4 + i * 0.4, 0.12, 1))),
    pz('academicismo', 'ornamento', 'medallon', 'Medallón', 'Academicismo, 1900', 1899, 0.9, 1.1, 'Óvalo con roseta de ocho pétalos.',
      (w, h) => { const cx = w / 2, cy = h / 2; return E(cx, cy, w / 2, h / 2, C.piedra, 1.4) + E(cx, cy, w / 2 - 0.09, h / 2 - 0.09, 'none', 0.7, C.tinta, 'stroke-dasharray="2 2"')
        + rep(8, i => E(cx, cy - 0.18, 0.07, 0.18, C.albero, 0.7, C.tinta, `transform="rotate(${i * 45} ${cx} ${cy})"`)) + O(cx, cy, 0.08, C.almagra, 0.8); }),
    pz('academicismo', 'ornamento', 'guirnalda', 'Guirnalda', 'Academicismo, 1905', 1906, 1.6, 0.6, 'Festón de hojas atado con cintas.',
      (w, h) => `<path d="M0.1 0.1 Q${w / 2} ${h + 0.25} ${w - 0.1} 0.1" fill="none" stroke="${C.tinta}" stroke-width="7" stroke-linecap="round"/><path d="M0.1 0.1 Q${w / 2} ${h + 0.25} ${w - 0.1} 0.1" fill="none" stroke="${C.verde}" stroke-width="5" stroke-linecap="round"/>`
        + L(0.1, 0.1, 0.04, 0.5, 1.2, C.almagra) + L(w - 0.1, 0.1, w - 0.04, 0.5, 1.2, C.almagra) + O(0.1, 0.1, 0.06, C.almagra, 0.8) + O(w - 0.1, 0.1, 0.06, C.almagra, 0.8)),

    /* Art nouveau */
    pz('nouveau', 'puerta', 'puerta-nouveau', 'Puerta modernista', 'Art nouveau, 1905', 1905, 1.6, 3.5, 'Arco orgánico y hierro en latigazo.', puerta({ arco: 'nouveau', banderola: true, latigo: true, hoja: 'verdeOsc', rec: 0.18 })),
    pz('nouveau', 'ventana', 'ventana-nouveau', 'Ventana con vitral', 'Art nouveau, 1908', 1908, 1.3, 2.8, 'Vitral de colores y balcón de hierro curvado.', ventana({ arco: 'nouveau', carp: 'vitral', balcon: 'latigo', rec: 0.14 })),
    pz('nouveau', 'columna', 'columna-nouveau', 'Columna floral', 'Art nouveau, 1906', 1906, 0.6, 4, 'Fuste fino y capitel como una flor abierta.', columna({ capitel: 'nouveau', fuste: 'anillado', ancho: 0.3 })),
    pz('nouveau', 'moldura', 'cornisa-ondas', 'Cornisa ondulante', 'Art nouveau, 1910', 1910, 3, 0.7, 'Línea que ondula como un tallo.', cornisa([['corona', 0.15], ['ondas', 0.35], ['friso', 0.2]], 'piedra')),
    pz('nouveau', 'remate', 'cresta-nouveau', 'Coronamiento curvo', 'Art nouveau, 1907', 1907, 2.6, 1.4, 'Remate ondulado con óculo y rulos de hierro.',
      (w, h) => P(`M0 ${h} V0.8 C0.3 0.8 0.5 0.1 ${w / 2} 0.1 C${w - 0.5} 0.1 ${w - 0.3} 0.8 ${w} 0.8 V${h} Z`, C.piedra, 1.3) + O(w / 2, 0.68, 0.28, C.vidrio, 1)
        + P(`M0.3 ${h - 0.08} q0.2 -0.45 0.55 -0.25 M${w - 0.3} ${h - 0.08} q-0.2 -0.45 -0.55 -0.25`, 'none', 1.2) + O(w / 2, 0.04, 0.06, C.albero, 0.8)),
    pz('nouveau', 'ornamento', 'mascaron', 'Mascarón', 'Art nouveau, 1903', 1903, 0.8, 1, 'Rostro de mujer entre cabellos ondulantes.',
      (w, h) => P(`M0.1 0.25 C-0.05 0.5 0.15 0.8 0.05 ${h} M${w - 0.1} 0.25 C${w + 0.05} 0.5 ${w - 0.15} 0.8 ${w - 0.05} ${h}`, 'none', 1.4, C.madera) + E(w / 2, 0.5, 0.25, 0.32, C.piedra, 1.2)
        + P(`M${w / 2 - 0.27} 0.42 Q${w / 2} 0.02 ${w / 2 + 0.27} 0.42 Q${w / 2} 0.2 ${w / 2 - 0.27} 0.42 Z`, C.albero, 0.9) + L(w / 2 - 0.13, 0.5, w / 2 - 0.05, 0.5, 0.8) + L(w / 2 + 0.05, 0.5, w / 2 + 0.13, 0.5, 0.8)
        + L(w / 2, 0.52, w / 2, 0.62, 0.7) + P(`M${w / 2 - 0.07} 0.7 Q${w / 2} 0.74 ${w / 2 + 0.07} 0.7`, 'none', 0.8)),

    /* Regionalismo sevillano */
    pz('regionalismo', 'puerta', 'puerta-regionalista', 'Portada de ladrillo y azulejo', 'Regionalismo sevillano, 1928', 1928, 2.2, 4, 'Ladrillo visto y azulejería, como en la Plaza de España.', puerta({ arco: 'medio', marco: 'ladrillo', alfiz: true, azulejo: true, dovelas: true, rec: 0.24 })),
    pz('regionalismo', 'ventana', 'ventana-regionalista', 'Ventana con reja y azulejo', 'Regionalismo sevillano, 1925', 1925, 1.2, 2.4, 'Recercado de ladrillo y reja.', ventana({ arco: 'medio', carp: 'reja', marco: 'ladrillo', alfeizar: true, guardapolvo: 'recto' })),
    pz('regionalismo', 'columna', 'pilar-ladrillo', 'Pilar de ladrillo', 'Regionalismo, 1926', 1926, 0.6, 4, 'Ladrillo visto con capitel de azulejo.', columna({ capitel: 'azulejo', fuste: 'ladrillo', color: 'ladrillo' })),
    pz('regionalismo', 'moldura', 'friso-azulejos', 'Friso de azulejos', 'Triana, 1920', 1920, 3, 0.6, 'Banda de azulejos de cuenca en azul y albero.', cornisa([['azulejo', 0.3], ['azulejo', 0.3]], 'cal')),
    pz('regionalismo', 'moldura', 'cornisa-ladrillo', 'Cornisa de ladrillo aplantillado', 'Regionalismo, 1927', 1927, 3, 0.7, 'Ladrillo en esquinilla y una franja de azulejo.', cornisa([['corona', 0.14], ['ladrillo', 0.22], ['azulejo', 0.2], ['filete', 0.1]], 'ladrillo')),
    pz('regionalismo', 'zocalo', 'zocalo-azulejo', 'Zócalo de azulejos', 'Sevilla, 1920', 1921, 3, 1, 'Cuatro hiladas de azulejo con rosetas.',
      (w, h) => { const th = (h - 0.1) / 4, n = Math.max(1, Math.round(w / th)), tw = w / n; let s = R(0, 0, w, 0.1, C.almagra, 1);
        for (let i = 0; i < n; i++) for (let j = 0; j < 4; j++) { const x = i * tw, y = 0.1 + j * th; s += R(x, y, tw, th, C.cal, 0.5) + O(x + tw / 2, y + th / 2, th * 0.3, (i + j) % 2 ? C.azul : C.albero, 0.5); }
        return s + R(0, 0, w, h, 'none', 1.4); }),
    pz('regionalismo', 'remate', 'cupulin', 'Cupulín de azulejos', 'Expo Iberoamericana, 1929', 1929, 1.4, 2, 'Cupulita vidriada como las torres de la Plaza de España.',
      (w, h) => R(0.15, 1.1, w - 0.3, h - 1.1, C.cal, 1.2) + P(arco('medio', 0.32, 1.25, 0.22, h - 1.4), C.sombra, 0.8) + P(arco('medio', w - 0.54, 1.25, 0.22, h - 1.4), C.sombra, 0.8)
        + P(`M0.1 1.1 Q0.1 0.2 ${w / 2} 0.15 Q${w - 0.1} 0.2 ${w - 0.1} 1.1 Z`, C.azulClaro, 1.2) + rep(4, i => { const x = 0.25 + i * (w - 0.5) / 3; return P(`M${x} 1.1 Q${x + (w / 2 - x) * 0.4} 0.4 ${w / 2} 0.15`, 'none', 0.6, C.azul); })
        + R(0.06, 1.04, w - 0.12, 0.1, C.albero, 1) + L(w / 2, 0.15, w / 2, -0.15, 1.2) + O(w / 2, -0.17, 0.05, C.albero, 0.8)),
    pz('regionalismo', 'ornamento', 'panel-azulejo', 'Panel cerámico', 'Triana, 1920', 1922, 1.2, 1.5, 'Retablo de azulejos con óvalo central.',
      (w, h) => { const tw = (w - 0.12) / 4, th = (h - 0.12) / 5; let s = R(0, 0, w, h, C.almagra, 1.4);
        for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) { const x = 0.06 + i * tw, y = 0.06 + j * th; s += R(x, y, tw, th, C.cal, 0.5) + O(x + tw / 2, y + th / 2, Math.min(tw, th) * 0.25, C.azul, 0.4); }
        return s + E(w / 2, h / 2, w * 0.28, h * 0.3, C.albero, 1.2) + E(w / 2, h / 2, w * 0.2, h * 0.22, 'none', 0.8, C.azul); }),

    /* Neocolonial */
    pz('neocolonial', 'puerta', 'puerta-neocolonial', 'Portada neocolonial', 'Neocolonial, 1925', 1925, 2.2, 4.2, 'Revival del barroco colonial: pilastras, frontón curvo y clavos.', puerta({ arco: 'medio', pilastras: true, clave: true, marco: 'cal', tachas: true, fronton: 'curvo' })),
    pz('neocolonial', 'ventana', 'reja-voladiza', 'Reja con tejadillo', 'Neocolonial, 1924', 1924, 1.4, 2.4, 'Reja de hierro bajo un tejadillo de tejas.', ventana({ arco: 'recto', carp: 'reja', marco: 'cal', guardapolvo: 'teja', alfeizar: true })),
    pz('neocolonial', 'columna', 'columna-abalaustrada', 'Columna anillada', 'Neocolonial, 1930', 1930, 0.6, 3.6, 'Fuste encalado con anillos, como en las galerías de Martín Noel.', columna({ capitel: 'toscano', fuste: 'anillado', color: 'cal' })),
    pz('neocolonial', 'moldura', 'alero-canecillos', 'Alero con canecillos', 'Neocolonial, 1928', 1928, 3, 0.6, 'Tejas sobre cabezas de vigas de madera.', cornisa([['teja', 0.25], ['canecillos', 0.35]], 'madera')),
    pz('neocolonial', 'zocalo', 'zocalo-tejuelas', 'Zócalo de ladrillo', 'Neocolonial, 1926', 1926, 3, 0.9, 'Ladrillo visto a soga.', zocalo('ladrillo')),
    pz('neocolonial', 'ornamento', 'hornacina', 'Hornacina', 'Neocolonial, 1931', 1931, 0.9, 1.4, 'Nicho vacío: una imagen que ya nadie recuerda.',
      (w, h) => { const iw = w - 0.3, cy = 0.15 + iw / 2; return P(arco('medio', 0, 0, w, h), C.piedra, 1.3) + P(arco('medio', 0.15, 0.15, iw, h - 0.3), '#cdbf9f', 1)
        + rep(7, i => { const a = PI * (i + 1) / 8; return L(w / 2, cy, w / 2 - (iw / 2) * cos(a), cy - (iw / 2) * sin(a), 0.6); }) + R(0.05, h - 0.15, w - 0.1, 0.15, C.piedra, 1); }),

    /* Art déco */
    pz('deco', 'puerta', 'puerta-deco', 'Puerta escalonada', 'Art déco, 1930', 1930, 1.8, 3.6, 'Marco en zigurat y sol naciente de bronce. El futuro según 1930.',
      (w, h) => { const cx = w / 2, cy = 1.1; return P(`M0 ${h} V0.9 H0.2 V0.5 H0.45 V0.2 H${w - 0.45} V0.5 H${w - 0.2} V0.9 H${w} V${h} Z`, C.deco, 1.4) + R(0.35, 1.15, w - 0.7, h - 1.15, C.sombra)
        + P(`M${cx - 0.5} ${cy} A0.5 0.5 0 0 1 ${cx + 0.5} ${cy} Z`, C.albero, 1) + rep(7, i => { const a = PI * (i + 1) / 8; return L(cx, cy, cx - 0.5 * cos(a), cy - 0.5 * sin(a), 0.7); })
        + rep(3, i => { const x = 0.6 + (w - 1.2) * i / 2; return L(x, 1.4, x, h - 0.1, 0.9, C.albero); }); }),
    pz('deco', 'ventana', 'ventana-deco', 'Ventana escalonada', 'Art déco, 1932', 1932, 1.2, 2.4, 'Remate escalonado y paños horizontales.', ventana({ arco: 'escalonado', carp: 'panos', marco: 'deco', alfeizar: true })),
    pz('deco', 'columna', 'columna-deco', 'Pilastra estriada', 'Art déco, 1930', 1931, 0.6, 4, 'Estrías verticales y capitel escalonado.', columna({ capitel: 'deco', fuste: 'estriado', color: 'deco' })),
    pz('deco', 'moldura', 'cornisa-deco', 'Coronamiento escalonado', 'Art déco, 1935', 1935, 3, 0.8, 'Bandas que retroceden y estrías verticales.', cornisa([['escalones', 0.4], ['estrias', 0.4]], 'deco')),
    pz('deco', 'zocalo', 'zocalo-granito', 'Revestimiento de granito', 'Art déco, 1934', 1934, 3, 1, 'Granito pulido oscuro en placas.', zocalo('granito')),
    pz('deco', 'remate', 'remate-deco', 'Coronamiento con mástil', 'Art déco, 1935', 1936, 2.2, 2.2, 'Torre escalonada con mástil y bandera.',
      (w, h) => P(`M0 ${h} V1.4 H0.3 V1 H0.6 V0.7 H${w - 0.6} V1 H${w - 0.3} V1.4 H${w} V${h} Z`, C.deco, 1.3) + rep(4, i => L(0.75 + i * (w - 1.5) / 3, 0.85, 0.75 + i * (w - 1.5) / 3, h - 0.1, 0.6))
        + L(w / 2, 0.7, w / 2, 0, 1.4) + P(`M${w / 2} 0.02 H${w / 2 + 0.45} L${w / 2 + 0.35} 0.14 L${w / 2 + 0.45} 0.26 H${w / 2}`, C.almagra, 0.8)),
    pz('deco', 'ornamento', 'neon', 'Letrero de neón', 'Neón, 1955', 1955, 2.4, 0.7, 'Dice lo que todos sienten en 2126.',
      (w, h) => `<rect x="0" y="0" width="${w}" height="${h}" rx="0.08" ${st('#1c1712', 1.2)}/><text x="${w / 2}" y="${h * 0.7}" font-size="${h * 0.6}" text-anchor="middle" font-family="VT323, monospace" fill="#ffd2c4" stroke="#ff5a3c" stroke-width="2.4" paint-order="stroke">NOSTALGIA</text>`),

    /* Racionalismo */
    pz('racionalismo', 'puerta', 'puerta-vidriada', 'Puerta vidriada', 'Racionalismo, 1936', 1936, 1.2, 2.6, 'Hoja de vidrio con travesaños de hierro.', puerta({ arco: 'recto', marco: 'cal', vidrio: true, hojas: 1, rec: 0.08 })),
    pz('racionalismo', 'ventana', 'ventana-corrida', 'Ventana corrida', 'Racionalismo, 1927', 1927, 3, 0.9, 'La ventana horizontal de los cinco puntos de la arquitectura moderna.', ventana({ arco: 'recto', carp: 'corrida', marco: 'cal', rec: 0.06 })),
    pz('racionalismo', 'ventana', 'ventana-nautica', 'Ventana náutica', 'Racionalismo, 1938', 1938, 0.8, 0.8, 'Ojo de buey de barco: la casa como transatlántico.', ventanaOjo({ marco: 'cal' })),
    pz('racionalismo', 'columna', 'pilotis', 'Pilotis', 'Racionalismo, 1929', 1929, 0.5, 4, 'Cilindro liso de hormigón. Levanta la casa del suelo.', (w, h) => R(0.04, 0, w - 0.08, h, C.cal, 1.2) + L(w * 0.7, 0.05, w * 0.7, h - 0.05, 0.5)),
    pz('racionalismo', 'moldura', 'losa-voladizo', 'Losa en voladizo', 'Racionalismo, 1935', 1935, 3, 0.25, 'Una línea blanca que sale del muro.', cornisa([['losa', 0.25]], 'cal')),
    pz('racionalismo', 'moldura', 'baranda-tubo', 'Baranda de caños', 'Racionalismo, 1937', 1937, 3, 1, 'Caños horizontales como en la cubierta de un barco.', cornisa([['tubos', 1]], 'cal')),
    pz('racionalismo', 'zocalo', 'zocalo-liso', 'Zócalo liso', 'Racionalismo, 1935', 1934, 3, 0.6, 'Una franja gris, sin ornamento.', zocalo('liso', 'gris')),

    /* Chalet pintoresquista */
    pz('pintoresquista', 'puerta', 'puerta-chalet', 'Puerta de chalet', 'Pintoresquista, 1940', 1940, 1.5, 3, 'Arco de piedra y puerta de tablas con herrajes.', puerta({ arco: 'medio', marco: '#c9b48e', tablas: true, hojas: 1, rec: 0.22, dovelas: true })),
    pz('pintoresquista', 'ventana', 'ventana-chalet', 'Ventana con postigos', 'Pintoresquista, 1938', 1938, 1.2, 1.8, 'Postigos de madera con corazón calado.', ventana({ arco: 'recto', carp: 'postigos', marco: 'madera', alfeizar: true })),
    pz('pintoresquista', 'columna', 'poste-madera', 'Poste con zapata', 'Pintoresquista, 1939', 1939, 0.5, 3.4, 'Rollizo de madera para el porche.', columna({ capitel: 'zapata', fuste: 'liso', color: 'madera', base: false, ancho: 0.2 })),
    pz('pintoresquista', 'moldura', 'alero-madera', 'Alero de madera', 'Pintoresquista, 1942', 1942, 3, 0.5, 'Cabios de madera a la vista.', cornisa([['canecillos', 0.5]], 'madera')),
    pz('pintoresquista', 'zocalo', 'zocalo-piedra', 'Zócalo de piedra Mar del Plata', 'Pintoresquista, 1940', 1941, 3, 1.1, 'Piedra irregular de la costa atlántica.', zocalo('piedra')),
    pz('pintoresquista', 'remate', 'hastial', 'Hastial con entramado', 'Pintoresquista, 1940', 1943, 3.2, 2.2, 'Piñón de tejas con falso entramado de madera.',
      (w, h) => { const k = y => (y - 0.4) / (h - 0.4) * (w / 2 - 0.35); return P(`M-0.15 ${h} L${w / 2} 0 L${w + 0.15} ${h} Z`, C.almagra, 1.3) + P(`M0.35 ${h} L${w / 2} 0.4 L${w - 0.35} ${h} Z`, C.cal, 1)
        + L(w / 2, 0.4, w / 2, h, 2.4, C.madera) + L(w / 2 - k(h - 0.6), h - 0.6, w / 2 + k(h - 0.6), h - 0.6, 2.4, C.madera) + L(w / 2, 0.95, 0.95, h, 2, C.madera) + L(w / 2, 0.95, w - 0.95, h, 2, C.madera); }),

    /* Brutalismo */
    pz('brutalismo', 'puerta', 'puerta-brut', 'Acceso de hormigón', 'Brutalismo, 1968', 1968, 1.6, 3, 'Vano hundido en un marco grueso de hormigón.', puerta({ arco: 'recto', marco: 'hormigon', hoja: 'sombra', rec: 0.35, hojas: 1, paneles: 0 })),
    pz('brutalismo', 'ventana', 'ventana-parasol', 'Ventana con parasoles', 'Brutalismo, 1966', 1966, 1.6, 2.2, 'Aletas verticales de hormigón contra el sol.', ventana({ arco: 'recto', carp: 'parasol', marco: 'hormigon', rec: 0.22 })),
    pz('brutalismo', 'columna', 'pilar-hormigon', 'Pilar de hormigón visto', 'Brutalismo, 1965', 1965, 0.6, 4, 'Con la huella de las tablas del encofrado.', columna({ capitel: 'ninguno', fuste: 'tablas', color: 'hormigon', base: false, ancho: 0.55 })),
    pz('brutalismo', 'moldura', 'viga-hormigon', 'Viga de hormigón visto', 'Brutalismo, 1967', 1967, 3, 0.8, 'Una viga pesada que corona todo.', cornisa([['hormigon', 0.8]], 'hormigon')),
    pz('brutalismo', 'zocalo', 'zocalo-hormigon', 'Zócalo de hormigón', 'Brutalismo, 1970', 1970, 3, 0.9, 'Hormigón con marcas de tablas.', zocalo('hormigon')),
    pz('brutalismo', 'remate', 'tanque', 'Tanque de agua', 'Buenos Aires, 1970', 1971, 1.8, 1.8, 'El remate involuntario de toda azotea porteña.',
      (w, h) => R(0.3, 1.1, 0.1, h - 1.1, C.hormigon, 1) + R(w - 0.4, 1.1, 0.1, h - 1.1, C.hormigon, 1) + R(0.2, 1.05, w - 0.4, 0.1, C.hormigon, 1) + R(0.25, 0.1, w - 0.5, 0.95, C.cal, 1.3)
        + R(0.2, 0.02, w - 0.4, 0.12, C.hormigon, 1) + rep(5, i => L(w - 0.2, 0.3 + i * 0.25, w - 0.05, 0.3 + i * 0.25, 0.8)) + L(w - 0.2, 0.2, w - 0.2, h, 0.8) + L(w - 0.05, 0.2, w - 0.05, h, 0.8)),

    /* Contemporáneo */
    pz('contemporaneo', 'puerta', 'puerta-pivotante', 'Puerta pivotante de listones', 'Contemporáneo, 2015', 2015, 1.4, 2.8, 'Una sola hoja de listones de madera.', puerta({ arco: 'recto', marco: 'sombra', tablas: true, hojas: 1, rec: 0.05, paneles: 0 })),
    pz('contemporaneo', 'ventana', 'pano-fijo', 'Paño fijo de piso a techo', 'Contemporáneo, 2010', 2010, 1.8, 3, 'Vidrio grande con perfilería mínima.', ventana({ arco: 'recto', carp: 'fijo', marco: 'sombra', rec: 0.05 })),
    pz('contemporaneo', 'ventana', 'celosia-chapa', 'Chapa perforada', 'Contemporáneo, 2018', 2018, 1.4, 2.2, 'La celosía mudéjar, versión industrial.', ventana({ arco: 'recto', carp: 'perforada', marco: 'zinc', rec: 0.06 })),
    pz('contemporaneo', 'moldura', 'babeta', 'Babeta de chapa', 'Contemporáneo, 2012', 2012, 3, 0.2, 'Una tira de metal: todo lo que quedó de la cornisa.', cornisa([['chapa', 0.2]], 'zinc')),
    pz('contemporaneo', 'zocalo', 'zocalo-listones', 'Revestimiento de listones', 'Contemporáneo, 2020', 2020, 3, 1, 'Madera en tablas verticales.', zocalo('listones')),
    pz('contemporaneo', 'remate', 'antena', 'Antena parabólica', 'Fin de siglo, 1995', 1995, 1.2, 1.6, 'El primer ornamento de la era del archivo infinito.',
      (w, h) => L(0.6, 0.7, 0.6, h, 1.4) + R(0.42, h - 0.08, 0.36, 0.08, C.tinta) + P('M0.08 0.1 Q0.15 1 1 0.9 Z', C.cal, 1.2) + L(0.45, 0.6, 0.95, 0.15, 0.9) + O(0.95, 0.15, 0.05, C.almagra, 0.8)),
    pz('contemporaneo', 'ornamento', 'aire', 'Aire acondicionado', 'Contemporáneo, 2005', 2005, 0.9, 0.6, 'El ornamento más repetido del siglo XXI.',
      (w, h) => R(0, 0, w, h - 0.08, C.cal, 1.2) + O(w * 0.64, (h - 0.08) / 2, 0.19, 'none', 1) + rep(4, i => { const a = i * PI / 2; return L(w * 0.64, (h - 0.08) / 2, w * 0.64 + 0.17 * cos(a), (h - 0.08) / 2 + 0.17 * sin(a), 0.8); })
        + rep(5, i => L(0.08, 0.08 + i * 0.08, 0.3, 0.08 + i * 0.08, 0.6)) + L(0.1, h - 0.08, 0.1, h, 1) + L(w - 0.1, h - 0.08, w - 0.1, h, 1)),

    /* Sevilla 2126 */
    pz('futuro', 'puerta', 'puerta-futura', 'Portal de acceso', 'Sevilla, 2126', 2126, 2, 3.2, 'Lo único "nuevo" del catálogo. Aunque parece salido de una película de 1979.',
      (w, h) => `<rect x="0" y="0" width="${w}" height="${h}" rx="${w / 2}" ${st(C.sombra, 1.6)}/><rect x="0.2" y="0.2" width="${w - 0.4}" height="${h - 0.2}" rx="${w / 2 - 0.2}" ${st('none', 1.2, C.albero)} stroke-dasharray="4 3"/>`
        + [[1.6, 0.1], [1.75, 0.25], [1.6, 0.4], [1.9, 0.55], [0.1, 2.6], [-0.05, 2.75], [0.15, 2.9]].map(([x, y]) => R(x, y, 0.14, 0.14, C.azul, 0.6)).join('') + L(0, h, w, h, 1.6)),
    pz('futuro', 'ventana', 'ventana-glitch', 'Ventana glitch', 'Archivo digital, 2099', 2099, 1.4, 1.6, 'Una ventana descargada tantas veces que perdió píxeles.',
      (w, h) => { const cw = w / 7, ch = h / 8; let s = ''; for (let i = 0; i < 7; i++) for (let j = 0; j < 8; j++) { const k = (i * 7 + j * 13 + i * j) % 9; if (k < 5) s += R(i * cw, j * ch, cw, ch, k < 3 ? C.vidrio : (k < 4 ? C.azul : C.almagra), 0.5); }
        return R(0.08, 0.06, w, h, 'none', 1, C.almagra) + s + R(0, 0, w, h, 'none', 1.4); }),
    pz('futuro', 'columna', 'columna-holo', 'Columna holográfica', 'Sevilla, 2120', 2120, 0.7, 4, 'Una dórica proyectada. No sostiene nada, solo recuerda.',
      (w, h) => `<rect x="0.08" y="0" width="${w - 0.16}" height="${h}" ${st('none', 1.2, C.azul)} stroke-dasharray="5 3"/>` + rep(16, i => L(0.08, 0.12 + i * (h - 0.2) / 15, w - 0.08, 0.12 + i * (h - 0.2) / 15, 0.6, C.azul))
        + `<rect x="0.2" y="0.3" width="${w - 0.4}" height="${h - 0.6}" fill="${C.albero}" opacity="0.25"/>` + R(0, 0, w, 0.12, 'none', 1) + R(0, h - 0.12, w, 0.12, 'none', 1)),
    pz('futuro', 'moldura', 'cornisa-led', 'Cornisa de luz', 'Sevilla, 2126', 2125, 3, 0.3, 'Una línea de luz que dibuja la cornisa que ya no está.', cornisa([['led', 0.3]], 'sombra')),
    pz('futuro', 'zocalo', 'zocalo-pantallas', 'Zócalo de pantallas', 'Sevilla, 2120', 2121, 3, 1, 'Pantallas que muestran azulejos de otras épocas.', zocalo('led')),
    pz('futuro', 'remate', 'puerto-drones', 'Puerto de drones', 'Sevilla, 2110', 2110, 2.4, 1.2, 'Donde antes había una espadaña.',
      (w, h) => R(w / 2 - 0.06, 0.42, 0.12, h - 0.42, C.zinc, 1) + R(0.1, 0.3, w - 0.2, 0.12, C.sombra, 1) + rep(5, i => O(0.25 + i * (w - 0.5) / 4, 0.36, 0.03, C.led, 0.5, C.led))
        + L(w / 2 - 0.25, 0.05, w / 2 + 0.25, 0.2, 1.2) + L(w / 2 - 0.25, 0.2, w / 2 + 0.25, 0.05, 1.2) + [[-0.25, 0.05], [0.25, 0.05], [-0.25, 0.2], [0.25, 0.2]].map(([dx, y]) => E(w / 2 + dx, y, 0.1, 0.03, 'none', 0.8)).join('')),
    pz('futuro', 'ornamento', 'camara', 'Cámara de vigilancia', 'Sevilla, 2126', 2126, 0.7, 0.5, 'El archivo también te mira a vos.',
      (w, h) => L(0, 0.1, 0.25, 0.1, 1.4) + P('M0.2 0.02 H0.6 L0.68 0.3 H0.28 Z', C.cal, 1.1) + O(0.62, 0.3, 0.06, C.sombra, 0.8) + O(0.3, 0.08, 0.025, C.almagra, 0.5)),
    pz('futuro', 'ornamento', 'holo-azulejo', 'Azulejo holográfico', 'Sevilla, 2126', 2124, 1.2, 1.2, 'Un panel de Triana generado por una máquina que nunca vio Triana.',
      (w, h) => `<rect x="0" y="0" width="${w}" height="${h}" ${st('none', 1.2, C.azul)} stroke-dasharray="4 2"/>` + rep(9, i => { const x = (i % 3) * w / 3, y = Math.floor(i / 3) * h / 3, off = i === 4 ? 0.06 : 0;
        return i === 7 ? '' : R(x + 0.05 + off, y + 0.05, w / 3 - 0.1, h / 3 - 0.1, 'none', 0.8, C.azul) + O(x + w / 6 + off, y + h / 6, 0.1, i % 2 ? C.albero : C.azulClaro, 0.6, C.azul); }) + rep(8, i => L(0, i * h / 8, w, i * h / 8, 0.3, C.led)))
  ];

  /* ---------- Techos (se dibujan en el corte) ----------
     draw(L): L = largo del ambiente en el corte; y=0 es el cielorraso y lo negativo es hacia arriba. */
  const losa = Lg => R(-0.15, -0.3, Lg + 0.3, 0.3, C.tinta, 1);
  const boveda = (Lg, rise, t) => P(`M-0.15 0 A${Lg / 2 + 0.15} ${rise + t} 0 0 1 ${Lg + 0.15} 0 L${Lg} 0 A${Lg / 2} ${rise} 0 0 0 0 0 Z`, C.tinta, 1);
  const dosAguas = (Lg, rise) => P(`M-0.4 0 L${Lg / 2} ${-rise - 0.3} L${Lg + 0.4} 0 Z`, C.tinta, 1) + P(`M0.05 -0.05 L${Lg / 2} ${-rise} L${Lg - 0.05} -0.05 Z`, '#efe3c8', 0.6) + R(-0.15, -0.15, Lg + 0.3, 0.15, C.tinta, 1);
  const techos = [
    { id: 'boveda-canon', estilo: 'clasico', nombre: 'Bóveda de cañón', epoca: 'Roma, s. I', anio: 51, desc: 'Medio cilindro de mampostería.', draw: Lg => boveda(Lg, Math.min(Lg / 2, 2.2), 0.3) },
    { id: 'dos-aguas', estilo: 'mudejar', nombre: 'Tejado a dos aguas', epoca: 'Andalucía, s. XV', anio: 1451, desc: 'Teja árabe sobre armadura de madera.', draw: Lg => dosAguas(Lg, Math.min(Lg * 0.35, 2.5)) },
    { id: 'cupula', estilo: 'renacimiento', nombre: 'Cúpula con linterna', epoca: 'Renacimiento, 1500', anio: 1500, desc: 'Media esfera con linterna para la luz cenital.',
      draw: Lg => { const D = Math.min(Lg * 0.7, 5), cx = Lg / 2, r = D / 2;
        return R(-0.15, -0.3, cx - r + 0.15, 0.3, C.tinta, 1) + R(cx + r, -0.3, Lg - cx - r + 0.15, 0.3, C.tinta, 1) + P(`M${cx - r - 0.15} -0.3 A${r + 0.15} ${r + 0.15} 0 0 1 ${cx + r + 0.15} -0.3 L${cx + r} -0.3 A${r} ${r} 0 0 0 ${cx - r} -0.3 Z`, C.tinta, 1)
          + R(cx - 0.25, -0.3 - r - 0.75, 0.5, 0.6, 'none', 1.2) + P(`M${cx - 0.35} ${-r - 1.05} L${cx} ${-r - 1.5} L${cx + 0.35} ${-r - 1.05} Z`, C.tinta, 1); } },
    { id: 'azotea', estilo: 'barroco', nombre: 'Azotea andaluza', epoca: 'Andalucía, s. XVIII', anio: 1751, desc: 'Terraza transitable con pretil, para tender y tomar el fresco.', draw: Lg => losa(Lg) + R(-0.15, -1.2, 0.25, 0.9, C.tinta, 1) + R(Lg - 0.1, -1.2, 0.25, 0.9, C.tinta, 1) },
    { id: 'boveda-catalana', estilo: 'italianizante', nombre: 'Bóveda catalana', epoca: 'Cataluña / Buenos Aires, 1900', anio: 1899, desc: 'Ladrillo tabicado y rebajado, el techo de las casas chorizo.',
      draw: Lg => boveda(Lg, Lg * 0.1, 0.15) + R(-0.15, -Lg * 0.1 - 0.45, Lg + 0.3, 0.3, C.tinta, 1) },
    { id: 'chapa', estilo: 'italianizante', nombre: 'Chapa acanalada', epoca: 'Conventillo, La Boca 1900', anio: 1901, desc: 'Zinc ondulado sobre tirantes: el techo del inmigrante.',
      draw: Lg => { const pts = []; for (let x = -0.3; x <= Lg + 0.3; x += 0.1) pts.push(`${x} ${-0.6 + (x / Lg) * 0.4 + 0.05 * sin(x * 20)}`); return `<polyline points="${pts.join(' ')}" ${st('none', 2.2)}/>` + R(-0.15, -0.12, Lg + 0.3, 0.12, C.madera, 1); } },
    { id: 'mansarda-techo', estilo: 'academicismo', nombre: 'Mansarda de pizarra', epoca: 'París → Buenos Aires, 1900', anio: 1902, desc: 'Quiebre de faldón con buhardilla habitable.',
      draw: Lg => P(`M-0.3 0 L${Math.min(1, Lg * 0.2)} -2 H${Lg - Math.min(1, Lg * 0.2)} L${Lg + 0.3} 0 Z`, C.pizarra, 1.2) + R(-0.15, -0.15, Lg + 0.3, 0.15, C.tinta, 1) },
    { id: 'losa', estilo: 'racionalismo', nombre: 'Losa plana', epoca: 'Hormigón, 1920', anio: 1920, desc: 'Plana y sin historia aparente.', draw: losa },
    { id: 'diente-sierra', estilo: 'racionalismo', nombre: 'Diente de sierra', epoca: 'Fábrica, 1920', anio: 1921, desc: 'Cubierta de taller con luz del sur.',
      draw: Lg => { const n = Math.max(1, Math.round(Lg / 3)), t = Lg / n; let d = 'M0 0'; for (let i = 0; i < n; i++) d += ` L${i * t} -1.6 L${(i + 1) * t} 0`; return P(d, 'none', 2) + rep(n, i => L(i * t, 0, i * t, -1.6, 2, C.azul)) + R(-0.15, -0.1, Lg + 0.3, 0.1, C.tinta, 1); } },
    { id: 'teja-chalet', estilo: 'pintoresquista', nombre: 'Tejado empinado', epoca: 'Pintoresquista, 1940', anio: 1940, desc: 'Faldones muy inclinados de teja francesa.', draw: Lg => dosAguas(Lg, Math.min(Lg * 0.6, 4)) },
    { id: 'cascara', estilo: 'brutalismo', nombre: 'Cáscara de hormigón', epoca: 'Brutalismo, 1965', anio: 1965, desc: 'Losa plegada en forma de mariposa.',
      draw: Lg => P(`M-0.4 -1.4 L${Lg / 2} -0.2 L${Lg + 0.4} -1.4 L${Lg + 0.4} -1.1 L${Lg / 2} 0.05 L-0.4 -1.1 Z`, C.hormigon, 1.4) },
    { id: 'techo-verde', estilo: 'contemporaneo', nombre: 'Techo verde', epoca: 'Contemporáneo, 2015', anio: 2015, desc: 'Losa con sustrato y plantas.',
      draw: Lg => losa(Lg) + R(-0.15, -0.6, Lg + 0.3, 0.3, '#7d6a4f', 1) + rep(Lg / 0.6, i => O(0.3 + i * 0.6, -0.72, 0.16, C.verde, 0.8)) },
    { id: 'membrana', estilo: 'futuro', nombre: 'Membrana tensada', epoca: 'Sevilla, 2090', anio: 2090, desc: 'Toldo técnico heredero de los toldos de la calle Sierpes.',
      draw: Lg => P(`M-0.3 0 C${Lg * 0.25} -2.5 ${Lg * 0.5} 0.5 ${Lg * 0.75} -2 S${Lg + 0.3} -0.5 ${Lg + 0.3} 0`, 'none', 2.2, C.albero) + R(-0.15, -0.15, Lg + 0.3, 0.15, C.tinta, 1) }
  ];

  /* ---------- Planta ---------- */
  const ambientes = [
    { id: 'zaguan', nombre: 'Zaguán', w: 2, h: 5, color: '#dccaa0', techo: 'boveda-catalana', desc: 'Pasillo de entrada entre la calle y el patio.' },
    { id: 'living', nombre: 'Living', w: 4.5, h: 5, color: '#ead4a8', techo: 'losa', desc: 'La sala principal, sobre la calle.' },
    { id: 'comedor', nombre: 'Comedor', w: 4, h: 4, color: '#e5c595', techo: 'boveda-catalana', desc: 'Mesa larga para muchos.' },
    { id: 'cocina', nombre: 'Cocina', w: 3, h: 4, color: '#d6b88a', techo: 'losa', desc: 'Fuego, agua y humo.' },
    { id: 'dormitorio', nombre: 'Dormitorio', w: 4, h: 4, color: '#ebdfc4', techo: 'boveda-catalana', desc: 'Una pieza de la casa chorizo.' },
    { id: 'bano', nombre: 'Baño', w: 2, h: 2.5, color: '#cad8de', techo: 'losa', desc: 'Azulejo del piso al techo.' },
    { id: 'estudio', nombre: 'Estudio', w: 3, h: 4, color: '#e3d3b4', techo: 'losa', desc: 'Para leer el archivo.' },
    { id: 'taller', nombre: 'Taller', w: 3, h: 5, color: '#cdbd9c', techo: 'diente-sierra', desc: 'El trabajo dentro de la casa, como en la inmigración.' },
    { id: 'galeria', nombre: 'Galería', w: 1.5, h: 8, color: '#f1e8d4', techo: 'chapa', desc: 'Semicubierto que acompaña al patio.' }
  ];
  const patios = [
    { id: 'patio-principal', nombre: 'Patio principal', w: 5, h: 5, suelo: 'azulejo', funcion: 'Encuentro', desc: 'El centro de la casa andaluza y de la casa chorizo.' },
    { id: 'patio-naranjos', nombre: 'Patio de naranjos', w: 6, h: 6, suelo: 'albero', funcion: 'Sombra y descanso', desc: 'Sombra sevillana en hileras.' },
    { id: 'patio-luz', nombre: 'Patio de luz', w: 2, h: 3, suelo: 'cal', funcion: 'Luz y ventilación', desc: 'Pequeño, alto, para que respire la casa.' },
    { id: 'patio-trabajo', nombre: 'Patio de trabajo', w: 3, h: 4, suelo: 'ladrillo', funcion: 'Trabajo', desc: 'Lavar, tender, arreglar, producir.' },
    { id: 'huerta', nombre: 'Huerta', w: 4, h: 5, suelo: 'tierra', funcion: 'Cultivo', desc: 'El fondo productivo.' },
    { id: 'patio-agua', nombre: 'Patio de agua', w: 4, h: 4, suelo: 'azulejo', funcion: 'Agua y frescura', desc: 'Fuente y alberca contra el calor.' }
  ];
  const funciones = ['Encuentro', 'Sombra y descanso', 'Luz y ventilación', 'Trabajo', 'Cultivo', 'Agua y frescura', 'Fiesta', 'Juego', 'Memoria', 'Tránsito'];
  const suelos = [{ id: 'azulejo', nombre: 'Azulejo' }, { id: 'ladrillo', nombre: 'Ladrillo' }, { id: 'albero', nombre: 'Albero' }, { id: 'tierra', nombre: 'Tierra / huerta' }, { id: 'cal', nombre: 'Baldosa blanca' }];

  // Objetos de patio: plan() vista desde arriba centrada en 0,0; side() vista en el corte con base en y=0.
  const objetos = [
    { id: 'fuente', nombre: 'Fuente', alto: 1.6, desc: 'Agua que suena: frescura andaluza.',
      plan: () => O(0, 0, 0.65, C.piedra, 1.2) + O(0, 0, 0.5, C.azulClaro, 0.8) + O(0, 0, 0.14, C.piedra, 0.8),
      side: () => R(-0.65, -0.45, 1.3, 0.45, C.piedra, 1.2) + R(-0.08, -1.1, 0.16, 0.65, C.piedra) + E(0, -1.12, 0.3, 0.07, C.piedra) + P('M-0.05 -1.2 Q-0.35 -1.5 -0.5 -0.45', 'none', 0.8, C.azul) + P('M0.05 -1.2 Q0.35 -1.5 0.5 -0.45', 'none', 0.8, C.azul) },
    { id: 'naranjo', nombre: 'Naranjo', alto: 3, desc: 'El árbol de las calles de Sevilla.',
      plan: () => O(0, 0, 0.9, C.verde, 1) + rep(6, i => O(0.5 * cos(i * PI / 3), 0.5 * sin(i * PI / 3), 0.08, C.naranja, 0.5)),
      side: () => R(-0.07, -1.3, 0.14, 1.3, C.madera) + O(0, -2, 0.85, C.verde) + rep(6, i => O(0.5 * cos(i * PI / 3), -2 + 0.5 * sin(i * PI / 3), 0.08, C.naranja, 0.5)) },
    { id: 'palmera', nombre: 'Palmera', alto: 4.4, desc: 'Vertical y lenta.',
      plan: () => rep(8, i => { const a = i * PI / 4; return P(`M0 0 Q${0.6 * cos(a + 0.3)} ${0.6 * sin(a + 0.3)} ${1.1 * cos(a)} ${1.1 * sin(a)}`, 'none', 1.4, C.verde); }) + O(0, 0, 0.12, C.madera, 0.8),
      side: () => P('M0 0 Q0.2 -2 0.05 -4', 'none', 3.5, C.madera) + rep(6, i => { const a = PI * (i + 0.5) / 6; return P(`M0.05 -4 Q${1.1 * cos(a) * 0.5} -4.6 ${1.2 * cos(a)} ${-3.6 - 0.3 * sin(a)}`, 'none', 1.6, C.verde); }) },
    { id: 'aljibe', nombre: 'Aljibe', alto: 2.2, desc: 'Brocal y arco de hierro sobre la cisterna.',
      plan: () => O(0, 0, 0.5, C.cal, 1.2) + O(0, 0, 0.32, C.sombra, 0.8),
      side: () => R(-0.5, -0.8, 1, 0.8, C.cal, 1.2) + P('M-0.45 -0.8 Q0 -2.1 0.45 -0.8', 'none', 1.4) + O(0, -1.45, 0.08, 'none', 1) + L(0, -1.45, 0, -0.9, 0.6) },
    { id: 'parra', nombre: 'Parra', alto: 2.8, desc: 'Pérgola con sombra de hojas.',
      plan: () => `<rect x="-1.2" y="-1.2" width="2.4" height="2.4" ${st('none', 1)} stroke-dasharray="3 2"/>` + rep(5, i => O(-0.8 + (i % 3) * 0.8, -0.5 + Math.floor(i / 3), 0.45, C.verde, 0.6)),
      side: () => L(-1.2, 0, -1.2, -2.4, 1.6) + L(1.2, 0, 1.2, -2.4, 1.6) + L(-1.4, -2.4, 1.4, -2.4, 1.6) + rep(5, i => O(-1 + i * 0.5, -2.55, 0.3, C.verde, 0.6)) },
    { id: 'macetas', nombre: 'Macetas', alto: 0.8, desc: 'Geranios en barro.',
      plan: () => rep(3, i => O(-0.5 + i * 0.5, 0, 0.2, C.almagra, 0.8) + O(-0.5 + i * 0.5, 0, 0.12, C.verde, 0.5)),
      side: () => rep(3, i => { const x = -0.5 + i * 0.5; return P(`M${x - 0.15} -0.35 H${x + 0.15} L${x + 0.1} 0 H${x - 0.1} Z`, C.almagra, 0.8) + O(x, -0.5, 0.2, C.verde, 0.6); }) },
    { id: 'tendedero', nombre: 'Tendedero', alto: 2, desc: 'El patio como lugar de trabajo.',
      plan: () => O(-1.2, 0, 0.07, C.tinta, 0.6) + O(1.2, 0, 0.07, C.tinta, 0.6) + `<line x1="-1.2" y1="0" x2="1.2" y2="0" ${st('none', 0.8)} stroke-dasharray="2 2"/>`,
      side: () => L(-1.2, 0, -1.2, -1.9, 1.4) + L(1.2, 0, 1.2, -1.9, 1.4) + P('M-1.2 -1.8 Q0 -1.6 1.2 -1.8', 'none', 0.8) + R(-0.8, -1.72, 0.35, 0.5, C.azulClaro, 0.8) + R(-0.3, -1.68, 0.45, 0.35, C.cal, 0.8) + R(0.3, -1.7, 0.3, 0.6, C.almagra, 0.8) },
    { id: 'pileta', nombre: 'Pileta de lavar', alto: 1.3, desc: 'Piedra de lavar del conventillo.',
      plan: () => R(-0.45, -0.3, 0.9, 0.6, C.cal, 1) + R(-0.35, -0.2, 0.7, 0.4, C.azulClaro, 0.6),
      side: () => R(-0.45, -0.95, 0.9, 0.3, C.cal, 1) + L(-0.4, -0.65, -0.4, 0, 1) + L(0.4, -0.65, 0.4, 0, 1) + L(0.3, -0.95, 0.3, -1.2, 1) },
    { id: 'mesa', nombre: 'Mesa larga', alto: 1, desc: 'Para comer afuera cuando baja el sol.',
      plan: () => R(-0.9, -0.4, 1.8, 0.8, C.madera, 1) + rep(3, i => O(-0.6 + i * 0.6, -0.65, 0.15, 'none', 0.8) + O(-0.6 + i * 0.6, 0.65, 0.15, 'none', 0.8)),
      side: () => L(-0.9, -0.75, 0.9, -0.75, 2.2) + L(-0.75, -0.75, -0.75, 0, 1) + L(0.75, -0.75, 0.75, 0, 1) },
    { id: 'banco', nombre: 'Banco de azulejo', alto: 0.6, desc: 'Banco de obra revestido.',
      plan: () => R(-0.9, -0.25, 1.8, 0.5, C.azulClaro, 1),
      side: () => R(-0.9, -0.45, 1.8, 0.45, C.cal, 1) + rep(6, i => R(-0.9 + i * 0.3, -0.45, 0.3, 0.15, i % 2 ? C.azul : C.albero, 0.5)) }
  ];

  const panos = [
    { id: 'cal', nombre: 'Cal', color: '#fbf7ee' }, { id: 'albero', nombre: 'Albero', color: '#e7bf66' }, { id: 'almagra', nombre: 'Almagra', color: '#c0644a' },
    { id: 'rosa', nombre: 'Rosa viejo', color: '#e8bfa8' }, { id: 'gris', nombre: 'Gris porteño', color: '#cfc8bb' }, { id: 'anil', nombre: 'Añil', color: '#8fa9cf' },
    { id: 'ladrillo', nombre: 'Ladrillo visto', color: '#c4734f' }, { id: 'hormigon', nombre: 'Hormigón', color: '#bdb8ad' }
  ];
  const categorias = [
    { id: 'puerta', nombre: 'Puerta' }, { id: 'ventana', nombre: 'Ventana' }, { id: 'columna', nombre: 'Columna' }, { id: 'moldura', nombre: 'Moldura' },
    { id: 'zocalo', nombre: 'Zócalo' }, { id: 'remate', nombre: 'Remate' }, { id: 'ornamento', nombre: 'Ornamento' }
  ];

  return { colores: C, estilos, fachada, techos, ambientes, patios, funciones, suelos, objetos, panos, categorias };
})();
