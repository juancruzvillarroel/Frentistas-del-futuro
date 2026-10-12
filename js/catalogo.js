/* Catálogo de los frentistas del futuro.
   Todas las piezas son dibujos vectoriales con la misma paleta (nada de fotos).
   Cada pieza de fachada: id, cat, nombre, epoca (texto de la ficha), anio (ordena y agrupa por era),
   w/h en metros, desc, y draw(w, h) que devuelve SVG en coordenadas locales (0,0 arriba a la izquierda).
   Para agregar una pieza: copiar una existente, cambiar id/nombre/epoca/anio y el dibujo. */

window.CATALOGO = (() => {
  const C = {
    tinta: '#2b2118', papel: '#f3ead6', cal: '#fbf7ee', albero: '#d9a441', almagra: '#a8402e',
    azul: '#1f4e8c', azulClaro: '#9db4cf', verde: '#4f6b3c', madera: '#6b4a2b', piedra: '#e3d6b8',
    sombra: '#3a2a1e', vidrio: '#b9cad8', deco: '#e9d9a8', persiana: '#5c7a5a', naranja: '#e08a2e'
  };

  // Ayudantes de dibujo (las líneas no se escalan: el grosor es en píxeles)
  const st = (fill = 'none', sw = 1.2, col = C.tinta) => `fill="${fill}" stroke="${col}" stroke-width="${sw}" stroke-linejoin="round"`;
  const R = (x, y, w, h, fill, sw, col) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${st(fill, sw, col)}/>`;
  const P = (d, fill, sw, col) => `<path d="${d}" ${st(fill, sw, col)}/>`;
  const O = (cx, cy, r, fill, sw, col) => `<circle cx="${cx}" cy="${cy}" r="${r}" ${st(fill, sw, col)}/>`;
  const E = (cx, cy, rx, ry, fill, sw, col, extra = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${st(fill, sw, col)} ${extra}/>`;
  const L = (x1, y1, x2, y2, sw = 1, col = C.tinta) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${st('none', sw, col)}/>`;
  const rep = (n, f) => Array.from({ length: Math.max(0, n) }, (_, i) => f(i)).join('');
  const { sin, cos, PI } = Math;

  /* ---------------- FACHADA ---------------- */
  const fachada = [
    // Puertas
    { id: 'puerta-chorizo', cat: 'puerta', nombre: 'Puerta de casa chorizo', epoca: 'Buenos Aires, c. 1890', anio: 1890, w: 1.4, h: 3.4,
      desc: 'Dos hojas de madera con banderola de hierro. Llega directo desde Caballito.',
      draw: (w, h) => { const lw = (w - 0.16) / 2;
        return R(0, 0, w, h, C.cal, 1.6) + R(0.08, 0.08, w - 0.16, 0.7, C.vidrio)
          + rep(5, i => L(w / 2, 0.78, 0.08 + (w - 0.16) * i / 4, 0.08, 0.8))
          + [0, 1].map(k => { const x = 0.08 + k * lw; return R(x, 0.86, lw, h - 0.94, C.madera) + R(x + 0.1, 1, lw - 0.2, 1.1, 'none', 0.8) + R(x + 0.1, 2.25, lw - 0.2, h - 2.5, 'none', 0.8); }).join('')
          + O(w / 2 - 0.1, 2.15, 0.04, C.albero, 0.6) + O(w / 2 + 0.1, 2.15, 0.04, C.albero, 0.6); } },
    { id: 'puerta-romana', cat: 'puerta', nombre: 'Portada de medio punto', epoca: 'Roma, s. I', anio: 50, w: 1.8, h: 3.6,
      desc: 'Arco de dovelas con clave. El arco que todos los siglos siguientes copiaron.',
      draw: (w, h) => { const r = w / 2, ri = r - 0.22;
        let s = P(`M0 ${h} V${r} A${r} ${r} 0 0 1 ${w} ${r} V${h} Z`, C.piedra, 1.4) + P(`M0.22 ${h} V${r} A${ri} ${ri} 0 0 1 ${w - 0.22} ${r} V${h} Z`, C.madera);
        for (let i = 1; i < 9; i++) { const a = PI * i / 9; s += L(r - ri * cos(a), r - ri * sin(a), r - r * cos(a), r - r * sin(a), 0.8); }
        s += rep(4, i => { const x = 0.22 + (w - 0.44) * (i + 1) / 5; return L(x, r, x, h, 0.6); });
        return s + P(`M${r - 0.13} -0.04 L${r + 0.13} -0.04 L${r + 0.09} 0.3 L${r - 0.09} 0.3 Z`, C.piedra); } },
    { id: 'puerta-mudejar', cat: 'puerta', nombre: 'Arco de herradura con alfiz', epoca: 'Mudéjar, s. XIV', anio: 1350, w: 2, h: 3.6,
      desc: 'Dovelas alternadas en almagra y cal, enmarcadas por el alfiz. Sevilla antes de Sevilla.',
      draw: (w, h) => { const cx = w / 2, r = 0.62, cy = 1.2, a0 = 25 * PI / 180, r2 = r + 0.26;
        const pt = (a, rad) => [cx + rad * cos(a), cy - rad * sin(a)];
        const jl = cx - r * cos(a0), jr = cx + r * cos(a0), ly = cy + r * sin(a0);
        let s = R(0, 0, w, h, C.cal, 1.4) + R(cx - r2 - 0.12, cy - r2 - 0.12, 2 * (r2 + 0.12), r2 + 0.17 + r2 * sin(a0), 'none', 1);
        const N = 12;
        for (let i = 0; i < N; i++) { const a1 = -a0 + (PI + 2 * a0) * i / N, a2 = -a0 + (PI + 2 * a0) * (i + 1) / N;
          const [x1, y1] = pt(a1, r), [x2, y2] = pt(a2, r), [x3, y3] = pt(a2, r2), [x4, y4] = pt(a1, r2);
          s += P(`M${x1} ${y1} L${x2} ${y2} L${x3} ${y3} L${x4} ${y4} Z`, i % 2 ? C.cal : C.almagra, 0.8); }
        return s + P(`M${jl} ${h} V${ly} A${r} ${r} 0 1 1 ${jr} ${ly} V${h} Z`, C.sombra, 1.2) + L(cx, ly, cx, h, 0.8, C.piedra); } },
    { id: 'puerta-barroca', cat: 'puerta', nombre: 'Portada barroca', epoca: 'Barroco sevillano, s. XVIII', anio: 1720, w: 2.4, h: 4.4,
      desc: 'Pilastras, entablamento y frontón curvo partido con cartela dorada.',
      draw: (w, h) => R(0, 1.05, 0.35, h - 1.05, C.piedra) + R(w - 0.35, 1.05, 0.35, h - 1.05, C.piedra) + R(0.35, 1.05, w - 0.7, h - 1.05, C.cal, 1)
        + R(0.55, 1.45, w - 1.1, h - 1.45, C.madera) + R(0.7, 1.65, (w - 1.4) / 2 - 0.05, 1.2, 'none', 0.7) + R(w / 2 + 0.05, 1.65, (w - 1.4) / 2 - 0.05, 1.2, 'none', 0.7)
        + R(-0.1, 0.75, w + 0.2, 0.3, C.piedra)
        + P(`M-0.1 0.75 Q0.1 0.05 ${w / 2 - 0.35} 0.3`, 'none', 2.2) + P(`M${w + 0.1} 0.75 Q${w - 0.1} 0.05 ${w / 2 + 0.35} 0.3`, 'none', 2.2)
        + E(w / 2, 0.38, 0.22, 0.32, C.albero)
        + rep(2, i => L(0.12 + i * 0.11, 1.05, 0.12 + i * 0.11, h, 0.6)) + rep(2, i => L(w - 0.12 - i * 0.11, 1.05, w - 0.12 - i * 0.11, h, 0.6)) },
    { id: 'puerta-deco', cat: 'puerta', nombre: 'Puerta escalonada', epoca: 'Art déco, 1930', anio: 1930, w: 1.8, h: 3.6,
      desc: 'Marco en zigurat y sol naciente de bronce. El futuro según 1930.',
      draw: (w, h) => { const cx = w / 2, cy = 1.1;
        return P(`M0 ${h} V0.9 H0.2 V0.5 H0.45 V0.2 H${w - 0.45} V0.5 H${w - 0.2} V0.9 H${w} V${h} Z`, C.deco, 1.4) + R(0.35, 1.15, w - 0.7, h - 1.15, C.sombra)
          + P(`M${cx - 0.5} ${cy} A0.5 0.5 0 0 1 ${cx + 0.5} ${cy} Z`, C.albero, 1)
          + rep(7, i => { const a = PI * (i + 1) / 8; return L(cx, cy, cx - 0.5 * cos(a), cy - 0.5 * sin(a), 0.7); })
          + rep(3, i => { const x = 0.6 + (w - 1.2) * i / 2; return L(x, 1.4, x, h - 0.1, 0.9, C.albero); }); } },
    { id: 'puerta-futura', cat: 'puerta', nombre: 'Portal de acceso', epoca: 'Sevilla, 2126', anio: 2126, w: 2, h: 3.2,
      desc: 'Lo único "nuevo" del catálogo. Aunque parece salido de una película de 1979.',
      draw: (w, h) => `<rect x="0" y="0" width="${w}" height="${h}" rx="${w / 2}" ${st(C.sombra, 1.6)}/>`
        + `<rect x="0.2" y="0.2" width="${w - 0.4}" height="${h - 0.2}" rx="${w / 2 - 0.2}" ${st('none', 1.2, C.albero)} stroke-dasharray="4 3"/>`
        + [[1.6, 0.1], [1.75, 0.25], [1.6, 0.4], [1.9, 0.55], [0.1, 2.6], [-0.05, 2.75], [0.15, 2.9]].map(([x, y]) => R(x, y, 0.14, 0.14, C.azul, 0.6)).join('')
        + L(0, h, w, h, 1.6) },

    // Ventanas
    { id: 'ventana-cierro', cat: 'ventana', nombre: 'Cierro sevillano', epoca: 'Sevilla, s. XVIII', anio: 1750, w: 1.6, h: 2.6,
      desc: 'Ventana volada con reja y tejadillo, para mirar la calle sin ser visto.',
      draw: (w, h) => P(`M-0.1 0.35 L${w / 2} 0 L${w + 0.1} 0.35 Z`, C.madera) + R(0, 0.35, w, h - 0.65, C.vidrio, 1.6)
        + rep(7, i => { const x = 0.1 + (w - 0.2) * i / 6; return L(x, 0.35, x, h - 0.3, 1); })
        + L(0, 0.8, w, 0.8) + L(0, h - 0.75, w, h - 0.75)
        + rep(3, i => O(0.1 + (w - 0.2) * (i * 2 + 1) / 6, h - 0.52, 0.1, 'none', 0.8))
        + R(-0.12, h - 0.3, w + 0.24, 0.18, C.piedra) + P(`M0.15 ${h - 0.12} Q${w / 2} ${h + 0.25} ${w - 0.15} ${h - 0.12}`, C.piedra) },
    { id: 'ventana-balcon', cat: 'ventana', nombre: 'Balcón con persianas', epoca: 'Balcón porteño, 1910', anio: 1910, w: 1.4, h: 3,
      desc: 'Persianas de madera verde y baranda de hierro sobre losa saliente.',
      draw: (w, h) => { const lw = (w - 0.2) / 2;
        let s = R(-0.12, -0.22, w + 0.24, 0.22, C.piedra) + R(0.1, 0, w - 0.2, h - 0.2, C.vidrio);
        for (const k of [0, 1]) { const x = 0.1 + k * lw; s += R(x, 0, lw, h - 1.2, C.persiana) + rep(12, i => L(x + 0.04, 0.15 + i * (h - 1.5) / 12, x + lw - 0.04, 0.15 + i * (h - 1.5) / 12, 0.6)); }
        return s + R(-0.3, h - 0.2, w + 0.6, 0.2, C.piedra) + L(-0.25, h - 1, w + 0.25, h - 1, 2.4)
          + rep(11, i => { const x = -0.2 + (w + 0.4) * i / 10; return L(x, h - 1, x, h - 0.2, 0.9); })
          + rep(5, i => O(-0.2 + (w + 0.4) * (2 * i + 1) / 10, h - 0.6, 0.08, 'none', 0.7)); } },
    { id: 'ventana-gotica', cat: 'ventana', nombre: 'Ventana ojival', epoca: 'Gótico, s. XIII', anio: 1250, w: 1.2, h: 2.6,
      desc: 'Dos lancetas y un óculo bajo un arco apuntado.',
      draw: (w, h) => { const sp = w * 0.85;
        return P(`M0 ${h} V${sp} Q0 0.2 ${w / 2} 0 Q${w} 0.2 ${w} ${sp} V${h} Z`, C.piedra, 1.4)
          + P(`M0.12 ${h - 0.05} V${sp} Q0.12 0.35 ${w / 2} 0.17 Q${w - 0.12} 0.35 ${w - 0.12} ${sp} V${h - 0.05} Z`, C.vidrio)
          + L(w / 2, sp + 0.1, w / 2, h - 0.05, 1.4)
          + P(`M0.12 ${sp + 0.45} Q0.12 ${sp + 0.05} ${w / 4 + 0.03} ${sp - 0.02} Q${w / 2} ${sp + 0.05} ${w / 2} ${sp + 0.45}`, 'none', 1)
          + P(`M${w / 2} ${sp + 0.45} Q${w / 2} ${sp + 0.05} ${w * 3 / 4 - 0.03} ${sp - 0.02} Q${w - 0.12} ${sp + 0.05} ${w - 0.12} ${sp + 0.45}`, 'none', 1)
          + O(w / 2, sp - 0.35, 0.17, C.albero, 1) + L(0, h, w, h, 1.6); } },
    { id: 'ventana-corrida', cat: 'ventana', nombre: 'Ventana corrida', epoca: 'Racionalismo, 1927', anio: 1927, w: 3, h: 0.9,
      desc: 'La ventana horizontal de los cinco puntos de la arquitectura moderna.',
      draw: (w, h) => R(0, 0, w, h, C.vidrio, 1.6) + rep(3, i => L(w * (i + 1) / 4, 0, w * (i + 1) / 4, h, 1)) + R(-0.05, h, w + 0.1, 0.08, C.cal) },
    { id: 'ventana-ojo', cat: 'ventana', nombre: 'Ojo de buey', epoca: 'Neoclásico, s. XIX', anio: 1830, w: 1, h: 1,
      desc: 'Óculo con cruz de carpintería.',
      draw: () => O(0.5, 0.5, 0.5, C.piedra, 1.4) + O(0.5, 0.5, 0.36, C.vidrio) + L(0.14, 0.5, 0.86, 0.5) + L(0.5, 0.14, 0.5, 0.86) },
    { id: 'ventana-glitch', cat: 'ventana', nombre: 'Ventana glitch', epoca: 'Archivo digital, 2099', anio: 2099, w: 1.4, h: 1.6,
      desc: 'Una ventana descargada tantas veces que perdió píxeles.',
      draw: (w, h) => { const n = 7, m = 8, cw = w / n, ch = h / m; let s = '';
        for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const k = (i * 7 + j * 13 + i * j) % 9; if (k < 5) s += R(i * cw, j * ch, cw, ch, k < 3 ? C.vidrio : (k < 4 ? C.azul : C.almagra), 0.5); }
        return R(0.08, 0.06, w, h, 'none', 1, C.almagra) + s + R(0, 0, w, h, 'none', 1.4); } },

    // Columnas
    { id: 'columna-dorica', cat: 'columna', nombre: 'Columna dórica', epoca: 'Grecia, s. V a. C.', anio: -450, w: 0.7, h: 4,
      desc: 'Fuste estriado, equino y ábaco. Sin basa.',
      draw: (w, h) => R(0, 0, w, 0.14, C.piedra) + P(`M0.04 0.14 H${w - 0.04} Q${w - 0.08} 0.34 ${w - 0.13} 0.4 H0.13 Q0.08 0.34 0.04 0.14 Z`, C.piedra)
        + P(`M0.13 0.4 H${w - 0.13} L${w - 0.05} ${h} H0.05 Z`, C.piedra)
        + rep(4, i => { const t = (i + 1) / 5; return L(0.13 + (w - 0.26) * t, 0.45, 0.05 + (w - 0.1) * t, h, 0.6); }) },
    { id: 'columna-jonica', cat: 'columna', nombre: 'Columna jónica', epoca: 'Grecia, s. VI a. C.', anio: -550, w: 0.7, h: 4,
      desc: 'Capitel de volutas y basa moldurada.',
      draw: (w, h) => R(0.08, 0.32, w - 0.16, h - 0.5, C.piedra) + rep(4, i => { const x = 0.08 + (w - 0.16) * (i + 1) / 5; return L(x, 0.36, x, h - 0.22, 0.6); })
        + R(0, h - 0.18, w, 0.18, C.piedra) + E(w / 2, h - 0.2, w / 2 - 0.04, 0.06, C.piedra)
        + R(-0.02, 0, w + 0.04, 0.1, C.piedra) + R(0.02, 0.1, w - 0.04, 0.14, C.piedra)
        + [0.04, w - 0.04].map(x => O(x, 0.24, 0.13, C.piedra) + O(x, 0.24, 0.07, 'none', 0.8) + O(x, 0.24, 0.02, C.tinta, 0.5)).join('') },
    { id: 'columna-corintia', cat: 'columna', nombre: 'Columna corintia', epoca: 'Roma, s. II', anio: 150, w: 0.75, h: 4,
      desc: 'Capitel de hojas de acanto en dos filas.',
      draw: (w, h) => { let s = R(0.1, 0.7, w - 0.2, h - 0.88, C.piedra) + rep(4, i => { const x = 0.1 + (w - 0.2) * (i + 1) / 5; return L(x, 0.75, x, h - 0.22, 0.6); })
          + R(0, h - 0.18, w, 0.18, C.piedra) + P(`M0.1 0.7 L0.02 0.12 H${w - 0.02} L${w - 0.1} 0.7 Z`, C.piedra) + P(`M-0.05 0 H${w + 0.05} L${w - 0.02} 0.12 H0.02 Z`, C.piedra);
        for (let row = 0; row < 2; row++) s += rep(4, i => { const x = 0.12 + (w - 0.24) * i / 3, y = 0.7 - row * 0.28; return P(`M${x - 0.08} ${y} Q${x - 0.1} ${y - 0.22} ${x} ${y - 0.3} Q${x + 0.1} ${y - 0.22} ${x + 0.08} ${y}`, 'none', 0.8); });
        return s; } },
    { id: 'columna-salomonica', cat: 'columna', nombre: 'Columna salomónica', epoca: 'Barroco sevillano, s. XVII', anio: 1680, w: 0.7, h: 4,
      desc: 'Fuste retorcido y dorado, como en los retablos de Sevilla.',
      draw: (w, h) => { const y0 = 0.45, y1 = h - 0.25, N = 40, amp = 0.07, per = 0.7, Lp = [], Rp = [];
        for (let i = 0; i <= N; i++) { const y = y0 + (y1 - y0) * i / N, o = amp * sin((y - y0) / per * 2 * PI); Lp.push(`${0.14 + o} ${y}`); Rp.unshift(`${w - 0.14 + o} ${y}`); }
        let s = P(`M${Lp.join(' L')} L${Rp.join(' L')} Z`, C.albero, 1.2);
        for (let y = y0 + 0.1; y < y1 - 0.3; y += per / 2) { const o1 = amp * sin((y - y0) / per * 2 * PI), o2 = amp * sin((y + 0.25 - y0) / per * 2 * PI); s += L(0.14 + o1, y, w - 0.14 + o2, y + 0.25, 0.8); }
        return s + R(0.02, h - 0.25, w - 0.04, 0.25, C.piedra) + P(`M0.12 ${y0} L0.03 0.1 H${w - 0.03} L${w - 0.12} ${y0} Z`, C.albero) + R(-0.04, 0, w + 0.08, 0.1, C.piedra)
          + rep(3, i => O(0.17 + (w - 0.34) * i / 2, 0.28, 0.06, 'none', 0.8)); } },
    { id: 'pilotis', cat: 'columna', nombre: 'Pilotis', epoca: 'Racionalismo, 1929', anio: 1929, w: 0.5, h: 4,
      desc: 'Cilindro liso de hormigón. Levanta la casa del suelo.',
      draw: (w, h) => R(0.04, 0, w - 0.08, h, C.cal, 1.2) + L(w * 0.7, 0.05, w * 0.7, h - 0.05, 0.5) },
    { id: 'columna-holo', cat: 'columna', nombre: 'Columna holográfica', epoca: 'Sevilla, 2120', anio: 2120, w: 0.7, h: 4,
      desc: 'Una dórica proyectada. No sostiene nada, solo recuerda.',
      draw: (w, h) => `<rect x="0.08" y="0" width="${w - 0.16}" height="${h}" ${st('none', 1.2, C.azul)} stroke-dasharray="5 3"/>`
        + rep(16, i => L(0.08, 0.12 + i * (h - 0.2) / 15, w - 0.08, 0.12 + i * (h - 0.2) / 15, 0.6, C.azul))
        + `<rect x="0.2" y="0.3" width="${w - 0.4}" height="${h - 0.6}" fill="${C.albero}" opacity="0.25"/>`
        + R(0, 0, w, 0.12, 'none', 1) + R(0, h - 0.12, w, 0.12, 'none', 1) },

    // Molduras y cornisas (ocupan todo el ancho)
    { id: 'cornisa-clasica', cat: 'moldura', nombre: 'Cornisa con dentículos', epoca: 'Clasicismo, s. XVI', anio: 1550, w: 3, h: 0.75,
      desc: 'Corona, dentículos y friso liso. Corona la fachada de lado a lado.',
      draw: (w, h) => R(-0.25, 0, w + 0.5, 0.18, C.piedra) + P(`M-0.2 0.18 H${w + 0.2} L${w + 0.1} 0.26 H-0.1 Z`, C.piedra)
        + rep(Math.floor((w + 0.3) / 0.24), i => R(-0.1 + i * 0.24, 0.26, 0.13, 0.14, C.piedra, 0.8))
        + R(-0.1, 0.4, w + 0.2, 0.1, C.piedra) + R(0, 0.5, w, Math.max(0.05, h - 0.5), C.piedra) },
    { id: 'friso-azulejos', cat: 'moldura', nombre: 'Friso de azulejos', epoca: 'Triana, s. XVI', anio: 1560, w: 3, h: 0.6,
      desc: 'Banda de azulejos de cuenca en azul y albero.',
      draw: (w, h) => { const n = Math.max(1, Math.round(w / (h / 2))), t = w / n, th = h / 2; let s = '';
        for (let i = 0; i < n; i++) for (let j = 0; j < 2; j++) { const x = i * t, y = j * th;
          s += R(x, y, t, th, C.cal, 0.6) + P(`M${x + t / 2} ${y + 0.04} L${x + t - 0.04} ${y + th / 2} L${x + t / 2} ${y + th - 0.04} L${x + 0.04} ${y + th / 2} Z`, (i + j) % 2 ? C.azul : C.albero, 0.6) + O(x + t / 2, y + th / 2, th * 0.12, C.cal, 0.5); }
        return s + R(0, 0, w, h, 'none', 1.4); } },
    { id: 'balaustrada', cat: 'moldura', nombre: 'Balaustrada', epoca: 'Italianizante porteño, 1900', anio: 1900, w: 3, h: 1.1,
      desc: 'Pretil de balaustres y pedestales: el remate típico de la casa chorizo.',
      draw: (w, h) => { let s = R(-0.1, h - 0.15, w + 0.2, 0.15, C.piedra); const np = Math.max(2, Math.round(w / 2.5) + 1), ped = 0.34;
        const xs = Array.from({ length: np }, (_, i) => i * (w - ped) / (np - 1));
        for (let k = 0; k < np - 1; k++) { const a = xs[k] + ped, b = xs[k + 1], n = Math.max(1, Math.floor((b - a) / 0.22));
          for (let i = 0; i < n; i++) { const x = a + (b - a) * (i + 0.5) / n; s += L(x, 0.15, x, h - 0.15, 0.9) + E(x, h * 0.58, 0.07, h * 0.18, C.piedra, 0.9); } }
        return s + xs.map(x => R(x, 0.15, ped, h - 0.3, C.piedra)).join('') + R(-0.12, 0, w + 0.24, 0.15, C.piedra); } },
    { id: 'cornisa-deco', cat: 'moldura', nombre: 'Coronamiento escalonado', epoca: 'Art déco, 1935', anio: 1935, w: 3, h: 0.8,
      desc: 'Bandas que retroceden y estrías verticales.',
      draw: (w, h) => R(0, 0, w, h * 0.2, C.deco, 1.2) + R(0.15, h * 0.2, w - 0.3, h * 0.2, C.deco) + R(0.3, h * 0.4, w - 0.6, h * 0.6, C.deco)
        + rep(Math.floor((w - 0.8) / 0.2) + 1, i => L(0.4 + i * 0.2, h * 0.45, 0.4 + i * 0.2, h * 0.95, 0.6)) },
    { id: 'alero-teja', cat: 'moldura', nombre: 'Alero de teja árabe', epoca: 'Andalucía, s. XV', anio: 1450, w: 3, h: 0.55,
      desc: 'Tejas curvas en almagra sobre tabla de madera.',
      draw: (w, h) => { const n = Math.ceil((w + 0.6) / 0.25);
        return R(-0.3, 0, w + 0.6, h - 0.2, C.almagra, 1.2) + rep(n, i => L(-0.3 + i * 0.25, 0, -0.3 + i * 0.25, h - 0.2, 0.6))
          + rep(n, i => P(`M${-0.3 + i * 0.25} ${h - 0.2} a0.125 0.125 0 0 0 0.25 0`, C.almagra, 0.9)) + R(-0.1, h - 0.2, w + 0.2, 0.08, C.madera, 0.8); } },

    // Zócalos (todo el ancho, apoyados en la vereda)
    { id: 'zocalo-azulejo', cat: 'zocalo', nombre: 'Zócalo de azulejos', epoca: 'Sevilla, s. XIX', anio: 1880, w: 3, h: 1,
      desc: 'Cuatro hiladas de azulejo con rosetas.',
      draw: (w, h) => { const rows = 4, th = (h - 0.1) / rows, n = Math.max(1, Math.round(w / th)), tw = w / n; let s = R(0, 0, w, 0.1, C.almagra, 1);
        for (let i = 0; i < n; i++) for (let j = 0; j < rows; j++) { const x = i * tw, y = 0.1 + j * th;
          s += R(x, y, tw, th, C.cal, 0.5) + O(x + tw / 2, y + th / 2, th * 0.3, (i + j) % 2 ? C.azul : C.albero, 0.5)
            + P(`M${x} ${y} L${x + tw * 0.25} ${y} L${x} ${y + th * 0.25} Z`, C.azul, 0.4) + P(`M${x + tw} ${y + th} L${x + tw * 0.75} ${y + th} L${x + tw} ${y + th * 0.75} Z`, C.azul, 0.4); }
        return s + R(0, 0, w, h, 'none', 1.4); } },
    { id: 'zocalo-almohadillado', cat: 'zocalo', nombre: 'Almohadillado', epoca: 'Renacimiento, s. XV', anio: 1480, w: 3, h: 1.2,
      desc: 'Sillares rústicos trabados, con biseles.',
      draw: (w, h) => { const rows = 3, rh = h / rows; let s = '';
        for (let j = 0; j < rows; j++) { const off = j % 2 ? 0.45 : 0, y = j * rh;
          for (let x = -off; x < w; x += 0.9) { const x0 = Math.max(0, x), x1 = Math.min(w, x + 0.9); s += R(x0, y, x1 - x0, rh, C.piedra, 1) + R(x0 + 0.06, y + 0.06, Math.max(0, x1 - x0 - 0.12), rh - 0.12, 'none', 0.5); } }
        return s; } },
    { id: 'zocalo-simil', cat: 'zocalo', nombre: 'Zócalo símil piedra', epoca: 'Frentistas italianos, 1910', anio: 1910, w: 3, h: 0.9,
      desc: 'Revoque que imita mármol: el oficio original de los frentistas.',
      draw: (w, h) => { const n = Math.max(1, Math.round(w / 1.3)), pw = w / n; let s = R(0, 0, w, h, '#d8d0c4', 1.2) + R(-0.05, 0, w + 0.1, 0.1, '#cfc6b8', 1);
        for (let i = 0; i < n; i++) { const x = i * pw; s += R(x + 0.1, 0.22, pw - 0.2, h - 0.34, 'none', 0.7) + P(`M${x + 0.2} ${h * 0.4} q${pw * 0.2} ${h * 0.15} ${pw * 0.35} ${-h * 0.05} t${pw * 0.3} ${h * 0.2}`, 'none', 0.5); }
        return s; } },

    // Remates
    { id: 'fronton', cat: 'remate', nombre: 'Frontón triangular', epoca: 'Grecia, s. V a. C.', anio: -440, w: 3, h: 1,
      desc: 'El triángulo del templo, puesto sobre una casa.',
      draw: (w, h) => P(`M-0.1 ${h} L${w / 2} 0 L${w + 0.1} ${h} Z`, C.piedra, 1.4) + P(`M0.4 ${h - 0.15} L${w / 2} 0.25 L${w - 0.4} ${h - 0.15} Z`, 'none', 0.8) + R(-0.15, h - 0.12, w + 0.3, 0.12, C.piedra) },
    { id: 'espadana', cat: 'remate', nombre: 'Espadaña', epoca: 'Sevilla, s. XVII', anio: 1650, w: 1.8, h: 2.4,
      desc: 'Muro-campanario encalado con remates en almagra.',
      draw: (w, h) => { const cx = w / 2;
        return P(`M0 ${h} V0.9 H0.3 Q0.3 0.35 ${cx} 0.25 Q${w - 0.3} 0.35 ${w - 0.3} 0.9 H${w} V${h} Z`, C.cal, 1.4)
          + P(`M${cx - 0.3} ${h - 0.15} V1.15 A0.3 0.3 0 0 1 ${cx + 0.3} 1.15 V${h - 0.15} Z`, C.sombra)
          + P(`M${cx - 0.2} 1.75 Q${cx - 0.18} 1.2 ${cx} 1.2 Q${cx + 0.18} 1.2 ${cx + 0.2} 1.75 Z`, C.albero) + O(cx, 1.8, 0.05, C.albero, 0.8)
          + L(cx, 0.25, cx, -0.1, 1.2) + O(cx, -0.15, 0.07, C.albero, 0.8) + R(-0.08, 0.82, 0.46, 0.1, C.almagra, 0.8) + R(w - 0.38, 0.82, 0.46, 0.1, C.almagra, 0.8); } },
    { id: 'pinaculo', cat: 'remate', nombre: 'Pináculo', epoca: 'Gótico, s. XV', anio: 1450, w: 0.5, h: 1.6,
      desc: 'Aguja con crochets.',
      draw: (w, h) => R(0.05, h - 0.4, w - 0.1, 0.4, C.piedra) + P(`M0.1 ${h - 0.4} L${w / 2} 0.12 L${w - 0.1} ${h - 0.4} Z`, C.piedra)
        + rep(3, i => { const t = (i + 1) / 4, y = h - 0.4 - (h - 0.52) * t, dx = (w / 2 - 0.1) * (1 - t); return O(w / 2 - dx, y, 0.035, C.piedra, 0.6) + O(w / 2 + dx, y, 0.035, C.piedra, 0.6); })
        + O(w / 2, 0.08, 0.07, C.albero, 0.8) },
    { id: 'jarron', cat: 'remate', nombre: 'Jarrón de pretil', epoca: 'Buenos Aires, 1905', anio: 1905, w: 0.6, h: 1,
      desc: 'Copón de cemento sobre los pedestales de la balaustrada.',
      draw: (w, h) => R(0.1, h - 0.18, w - 0.2, 0.18, C.piedra) + P(`M0.16 ${h - 0.18} Q-0.02 0.5 0.12 0.32 H${w - 0.12} Q${w + 0.02} 0.5 ${w - 0.16} ${h - 0.18} Z`, C.piedra)
        + R(0.06, 0.24, w - 0.12, 0.08, C.piedra) + P(`M${w / 2 - 0.1} 0.24 Q${w / 2} 0 ${w / 2 + 0.1} 0.24 Z`, C.piedra) + L(0.1, 0.55, w - 0.1, 0.55, 0.6) },
    { id: 'antena', cat: 'remate', nombre: 'Antena parabólica', epoca: 'Fin de siglo, 1995', anio: 1995, w: 1.2, h: 1.6,
      desc: 'El primer ornamento de la era del archivo infinito.',
      draw: (w, h) => L(0.6, 0.7, 0.6, h, 1.4) + R(0.42, h - 0.08, 0.36, 0.08, C.tinta) + P('M0.08 0.1 Q0.15 1 1 0.9 Z', C.cal, 1.2)
        + L(0.45, 0.6, 0.95, 0.15, 0.9) + O(0.95, 0.15, 0.05, C.almagra, 0.8) },

    // Ornamentos
    { id: 'medallon', cat: 'ornamento', nombre: 'Medallón', epoca: 'Neoclásico, 1800', anio: 1800, w: 0.9, h: 1.1,
      desc: 'Óvalo con roseta de ocho pétalos.',
      draw: (w, h) => { const cx = w / 2, cy = h / 2;
        return E(cx, cy, w / 2, h / 2, C.piedra, 1.4) + E(cx, cy, w / 2 - 0.09, h / 2 - 0.09, 'none', 0.7, C.tinta, 'stroke-dasharray="2 2"')
          + rep(8, i => E(cx, cy - 0.18, 0.07, 0.18, C.albero, 0.7, C.tinta, `transform="rotate(${i * 45} ${cx} ${cy})"`)) + O(cx, cy, 0.08, C.almagra, 0.8); } },
    { id: 'cartela', cat: 'ornamento', nombre: 'Cartela con fecha', epoca: 'Frentistas, 1907', anio: 1907, w: 1.4, h: 0.8,
      desc: 'Los frentistas firmaban el año de la obra. Este número ya no significa nada.',
      draw: (w, h) => P(`M0.15 0.1 H${w - 0.15} Q${w} 0.1 ${w - 0.05} ${h / 2} Q${w} ${h - 0.1} ${w - 0.15} ${h - 0.1} H0.15 Q0 ${h - 0.1} 0.05 ${h / 2} Q0 0.1 0.15 0.1 Z`, C.piedra, 1.3)
        + `<text x="${w / 2}" y="${h / 2 + 0.1}" font-size="0.28" text-anchor="middle" font-family="'IM Fell English SC', Georgia, serif" fill="${C.tinta}">MCMVII</text>` },
    { id: 'neon', cat: 'ornamento', nombre: 'Letrero de neón', epoca: 'Neón, 1955', anio: 1955, w: 2.4, h: 0.7,
      desc: 'Dice lo que todos sienten en 2126.',
      draw: (w, h) => `<rect x="0" y="0" width="${w}" height="${h}" rx="0.08" ${st('#1c1712', 1.2)}/>`
        + `<text x="${w / 2}" y="${h * 0.7}" font-size="${h * 0.6}" text-anchor="middle" font-family="VT323, monospace" fill="#ffd2c4" stroke="#ff5a3c" stroke-width="2.4" paint-order="stroke">NOSTALGIA</text>` },
    { id: 'farol', cat: 'ornamento', nombre: 'Farol fernandino', epoca: 'Sevilla, 1830', anio: 1830, w: 0.5, h: 1,
      desc: 'Farol de hierro con brazo a la pared.',
      draw: (w, h) => P('M0 0.2 H0.25 V0.3', 'none', 1.4) + P('M0.1 0.3 H0.4 L0.34 0.38 H0.16 Z', C.tinta, 1) + P('M0.12 0.38 H0.38 L0.42 0.75 H0.08 Z', C.albero, 1.1)
        + L(0.25, 0.38, 0.25, 0.75, 0.6) + R(0.1, 0.75, 0.3, 0.06, C.tinta, 0.8) + P(`M0.18 0.81 L0.25 ${h} L0.32 0.81`, 'none', 1) },
    { id: 'panel-azulejo', cat: 'ornamento', nombre: 'Panel cerámico', epoca: 'Triana, 1920', anio: 1920, w: 1.2, h: 1.5,
      desc: 'Retablo de azulejos con óvalo central.',
      draw: (w, h) => { const n = 4, m = 5, tw = (w - 0.12) / n, th = (h - 0.12) / m; let s = R(0, 0, w, h, C.almagra, 1.4);
        for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const x = 0.06 + i * tw, y = 0.06 + j * th; s += R(x, y, tw, th, C.cal, 0.5) + O(x + tw / 2, y + th / 2, Math.min(tw, th) * 0.25, C.azul, 0.4); }
        return s + E(w / 2, h / 2, w * 0.28, h * 0.3, C.albero, 1.2) + E(w / 2, h / 2, w * 0.2, h * 0.22, 'none', 0.8, C.azul); } }
  ];

  /* ---------------- TECHOS (se dibujan en el corte) ----------------
     draw(L): L = largo del ambiente en el corte; y=0 es el cielorraso y lo negativo es hacia arriba. */
  const losa = Lg => R(-0.15, -0.3, Lg + 0.3, 0.3, C.tinta, 1);
  const boveda = (Lg, rise, t) => P(`M-0.15 0 A${Lg / 2 + 0.15} ${rise + t} 0 0 1 ${Lg + 0.15} 0 L${Lg} 0 A${Lg / 2} ${rise} 0 0 0 0 0 Z`, C.tinta, 1);
  const techos = [
    { id: 'losa', nombre: 'Losa plana', epoca: 'Hormigón, 1920', anio: 1920, desc: 'Plana y sin historia aparente.', draw: losa },
    { id: 'azotea', nombre: 'Azotea andaluza', epoca: 'Andalucía, s. XVIII', anio: 1750, desc: 'Terraza transitable con pretil, para tender y tomar el fresco.',
      draw: Lg => losa(Lg) + R(-0.15, -1.2, 0.25, 0.9, C.tinta, 1) + R(Lg - 0.1, -1.2, 0.25, 0.9, C.tinta, 1) },
    { id: 'boveda-canon', nombre: 'Bóveda de cañón', epoca: 'Roma, s. I', anio: 50, desc: 'Medio cilindro de mampostería.', draw: Lg => boveda(Lg, Math.min(Lg / 2, 2.2), 0.3) },
    { id: 'boveda-catalana', nombre: 'Bóveda catalana', epoca: 'Cataluña / Buenos Aires, 1900', anio: 1900, desc: 'Ladrillo tabicado y rebajado, el techo de las casas chorizo.', draw: Lg => boveda(Lg, Lg * 0.1, 0.15) + losa(Lg).replace('y="-0.3"', `y="${-Lg * 0.1 - 0.45}"`) },
    { id: 'dos-aguas', nombre: 'Tejado a dos aguas', epoca: 'Andalucía, s. XV', anio: 1450, desc: 'Teja árabe sobre armadura de madera.',
      draw: Lg => { const rise = Math.min(Lg * 0.35, 2.5); return P(`M-0.4 0 L${Lg / 2} ${-rise - 0.3} L${Lg + 0.4} 0 Z`, C.tinta, 1) + P(`M0.05 -0.05 L${Lg / 2} ${-rise} L${Lg - 0.05} -0.05 Z`, '#efe3c8', 0.6) + R(-0.15, -0.15, Lg + 0.3, 0.15, C.tinta, 1); } },
    { id: 'cupula', nombre: 'Cúpula con linterna', epoca: 'Renacimiento, 1500', anio: 1500, desc: 'Media esfera con linterna para la luz cenital.',
      draw: Lg => { const D = Math.min(Lg * 0.7, 5), cx = Lg / 2, r = D / 2;
        return R(-0.15, -0.3, cx - r + 0.15, 0.3, C.tinta, 1) + R(cx + r, -0.3, Lg - cx - r + 0.15, 0.3, C.tinta, 1)
          + P(`M${cx - r - 0.15} -0.3 A${r + 0.15} ${r + 0.15} 0 0 1 ${cx + r + 0.15} -0.3 L${cx + r} -0.3 A${r} ${r} 0 0 0 ${cx - r} -0.3 Z`, C.tinta, 1)
          + R(cx - 0.25, -0.3 - r - 0.75, 0.5, 0.6, 'none', 1.2) + P(`M${cx - 0.35} ${-r - 1.05} L${cx} ${-r - 1.5} L${cx + 0.35} ${-r - 1.05} Z`, C.tinta, 1); } },
    { id: 'chapa', nombre: 'Chapa acanalada', epoca: 'Conventillo, La Boca 1900', anio: 1901, desc: 'Zinc ondulado sobre tirantes: el techo del inmigrante.',
      draw: Lg => { const pts = []; for (let x = -0.3; x <= Lg + 0.3; x += 0.1) pts.push(`${x} ${-0.6 + (x / Lg) * 0.4 + 0.05 * sin(x * 20)}`);
        return `<polyline points="${pts.join(' ')}" ${st('none', 2.2)}/>` + R(-0.15, -0.12, Lg + 0.3, 0.12, C.madera, 1); } },
    { id: 'diente-sierra', nombre: 'Diente de sierra', epoca: 'Fábrica, 1920', anio: 1921, desc: 'Cubierta de taller con luz del sur.',
      draw: Lg => { const n = Math.max(1, Math.round(Lg / 3)), t = Lg / n; let d = `M0 0`;
        for (let i = 0; i < n; i++) d += ` L${i * t} -1.6 L${(i + 1) * t} 0`;
        return P(d, 'none', 2) + rep(n, i => L(i * t, 0, i * t, -1.6, 2, C.azul)) + R(-0.15, -0.1, Lg + 0.3, 0.1, C.tinta, 1); } },
    { id: 'membrana', nombre: 'Membrana tensada', epoca: 'Sevilla, 2090', anio: 2090, desc: 'Toldo técnico heredero de los toldos de la calle Sierpes.',
      draw: Lg => P(`M-0.3 0 C${Lg * 0.25} -2.5 ${Lg * 0.5} 0.5 ${Lg * 0.75} -2 S${Lg + 0.3} -0.5 ${Lg + 0.3} 0`, 'none', 2.2, C.albero) + losa(Lg).replace('height="0.3"', 'height="0.15"') }
  ];

  /* ---------------- PLANTA ---------------- */
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

  const suelos = [
    { id: 'azulejo', nombre: 'Azulejo' }, { id: 'ladrillo', nombre: 'Ladrillo' }, { id: 'albero', nombre: 'Albero' },
    { id: 'tierra', nombre: 'Tierra / huerta' }, { id: 'cal', nombre: 'Baldosa blanca' }
  ];

  // Objetos de patio: plan() vista desde arriba centrada en 0,0; side() vista en el corte con base en y=0.
  const objetos = [
    { id: 'fuente', nombre: 'Fuente', alto: 1.6, desc: 'Agua que suena: frescura andaluza.',
      plan: () => O(0, 0, 0.65, C.piedra, 1.2) + O(0, 0, 0.5, C.azulClaro, 0.8) + O(0, 0, 0.14, C.piedra, 0.8),
      side: () => R(-0.65, -0.45, 1.3, 0.45, C.piedra, 1.2) + R(-0.08, -1.1, 0.16, 0.65, C.piedra) + E(0, -1.12, 0.3, 0.07, C.piedra)
        + P('M-0.05 -1.2 Q-0.35 -1.5 -0.5 -0.45', 'none', 0.8, C.azul) + P('M0.05 -1.2 Q0.35 -1.5 0.5 -0.45', 'none', 0.8, C.azul) },
    { id: 'naranjo', nombre: 'Naranjo', alto: 3, desc: 'El árbol de las calles de Sevilla.',
      plan: () => O(0, 0, 0.9, C.verde, 1) + rep(6, i => O(0.5 * cos(i * PI / 3), 0.5 * sin(i * PI / 3), 0.08, C.naranja, 0.5)),
      side: () => R(-0.07, -1.3, 0.14, 1.3, C.madera) + O(0, -2, 0.85, C.verde) + rep(6, i => O(0.5 * cos(i * PI / 3), -2 + 0.5 * sin(i * PI / 3), 0.08, C.naranja, 0.5)) },
    { id: 'palmera', nombre: 'Palmera', alto: 4.4, desc: 'Vertical y lenta.',
      plan: () => rep(8, i => { const a = i * PI / 4; return P(`M0 0 Q${0.6 * cos(a + 0.3)} ${0.6 * sin(a + 0.3)} ${1.1 * cos(a)} ${1.1 * sin(a)}`, 'none', 1.4, C.verde); }) + O(0, 0, 0.12, C.madera, 0.8),
      side: () => P('M0 0 Q0.2 -2 0.05 -4', 'none', 3.5, C.madera) + rep(6, i => { const a = PI * (i + 0.5) / 6; return P(`M0.05 -4 Q${1.1 * cos(a) * 0.5} -4.6 ${1.2 * cos(a)} ${-4 + 0.4 - 0.3 * sin(a)}`, 'none', 1.6, C.verde); }) },
    { id: 'aljibe', nombre: 'Aljibe', alto: 2.2, desc: 'Brocal y arco de hierro sobre la cisterna.',
      plan: () => O(0, 0, 0.5, C.cal, 1.2) + O(0, 0, 0.32, C.sombra, 0.8),
      side: () => R(-0.5, -0.8, 1, 0.8, C.cal, 1.2) + P('M-0.45 -0.8 Q0 -2.1 0.45 -0.8', 'none', 1.4) + O(0, -1.45, 0.08, 'none', 1) + L(0, -1.45, 0, -0.9, 0.6) },
    { id: 'parra', nombre: 'Parra', alto: 2.8, desc: 'Pérgola con sombra de hojas.',
      plan: () => `<rect x="-1.2" y="-1.2" width="2.4" height="2.4" ${st('none', 1)} stroke-dasharray="3 2"/>` + rep(5, i => O(-0.8 + (i % 3) * 0.8, -0.5 + Math.floor(i / 3) * 1, 0.45, C.verde, 0.6)),
      side: () => L(-1.2, 0, -1.2, -2.4, 1.6) + L(1.2, 0, 1.2, -2.4, 1.6) + L(-1.4, -2.4, 1.4, -2.4, 1.6) + rep(5, i => O(-1 + i * 0.5, -2.55, 0.3, C.verde, 0.6)) },
    { id: 'macetas', nombre: 'Macetas', alto: 0.8, desc: 'Geranios en barro.',
      plan: () => rep(3, i => O(-0.5 + i * 0.5, 0, 0.2, C.almagra, 0.8) + O(-0.5 + i * 0.5, 0, 0.12, C.verde, 0.5)),
      side: () => rep(3, i => { const x = -0.5 + i * 0.5; return P(`M${x - 0.15} -0.35 H${x + 0.15} L${x + 0.1} 0 H${x - 0.1} Z`, C.almagra, 0.8) + O(x, -0.5, 0.2, C.verde, 0.6); }) },
    { id: 'tendedero', nombre: 'Tendedero', alto: 2, desc: 'El patio como lugar de trabajo.',
      plan: () => O(-1.2, 0, 0.07, C.tinta, 0.6) + O(1.2, 0, 0.07, C.tinta, 0.6) + `<line x1="-1.2" y1="0" x2="1.2" y2="0" ${st('none', 0.8)} stroke-dasharray="2 2"/>`,
      side: () => L(-1.2, 0, -1.2, -1.9, 1.4) + L(1.2, 0, 1.2, -1.9, 1.4) + P('M-1.2 -1.8 Q0 -1.6 1.2 -1.8', 'none', 0.8)
        + R(-0.8, -1.72, 0.35, 0.5, C.azulClaro, 0.8) + R(-0.3, -1.68, 0.45, 0.35, C.cal, 0.8) + R(0.3, -1.7, 0.3, 0.6, C.almagra, 0.8) },
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
    { id: 'cal', nombre: 'Cal', color: '#fbf7ee' }, { id: 'albero', nombre: 'Albero', color: '#e7bf66' },
    { id: 'almagra', nombre: 'Almagra', color: '#c0644a' }, { id: 'rosa', nombre: 'Rosa viejo', color: '#e8bfa8' },
    { id: 'gris', nombre: 'Gris porteño', color: '#cfc8bb' }, { id: 'anil', nombre: 'Añil', color: '#8fa9cf' }
  ];

  // Categorías de fachada y eras (agrupan las piezas en el mapa del archivo)
  const categorias = [
    { id: 'puerta', nombre: 'Puertas' }, { id: 'ventana', nombre: 'Ventanas' }, { id: 'columna', nombre: 'Columnas' },
    { id: 'moldura', nombre: 'Molduras y cornisas' }, { id: 'zocalo', nombre: 'Zócalos' }, { id: 'remate', nombre: 'Remates' }, { id: 'ornamento', nombre: 'Ornamentos' }
  ];
  const eras = [
    { id: 'antiguedad', nombre: 'Antigüedad', hasta: 500 },
    { id: 'medioevo', nombre: 'Medioevo e Islam', hasta: 1480 },
    { id: 'barroco', nombre: 'Renacimiento y Barroco', hasta: 1790 },
    { id: 'xix', nombre: 'Siglo XIX', hasta: 1899 },
    { id: 'xx', nombre: 'Siglo XX', hasta: 1999 },
    { id: 'futuro', nombre: 'Futuro', hasta: 99999 }
  ];
  const eraDe = anio => eras.find(e => anio <= e.hasta).id;

  return { colores: C, fachada, techos, ambientes, patios, funciones, suelos, objetos, panos, categorias, eras, eraDe };
})();
