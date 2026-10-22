/* Mapa del archivo: el catálogo como grafo que se despliega de arriba hacia abajo
   (inspirado en FIUBA Map). Cada nivel se reparte en una grilla que ocupa todo el ancho,
   así el catálogo entra en pantalla sin una lista larga. Cada paso del juego tiene su árbol:
   patios (tipos y objetos), ambientes, fachada (estilo → piezas) y techos.
   Cada elección abre el nivel siguiente y deja marcado el recorrido. */

window.Archivo = (() => {
  const NODOW = 214, ALTO = 50, ALTO_HOJA = 76, GAPX = 18, GAPY = 14, BANDA = 64, PAD = 18;

  function arboles(CAT) {
    const cat = id => CAT.categorias.find(c => c.id === id).nombre;
    const orden = CAT.categorias.map(c => c.id);
    const hoja = (kind, d, sub) => ({ id: `${kind}:${d.id}`, label: d.nombre, sub, hoja: { kind, id: d.id } });
    return {
      patios: { id: 'raiz', label: 'Archivo', sub: 'patios', raiz: true, children: [
        { id: 'tipos', label: 'Tipos de patio', sub: 'elegí, ubicá y dimensioná', children: CAT.patios.map(p => hoja('patio', p, p.funcion)) },
        { id: 'objetos', label: 'Objetos de patio', sub: 'fuente, naranjo, aljibe…', children: CAT.objetos.map(o => hoja('obj', o, 'va adentro de un patio')) }
      ] },
      ambientes: { id: 'raiz', label: 'Archivo', sub: 'ambientes', raiz: true, children: CAT.ambientes.map(a => hoja('amb', a, `${a.w} × ${a.h} m`)) },
      fachada: { id: 'raiz', label: 'Archivo', sub: `${CAT.estilos.length} estilos`, raiz: true,
        children: CAT.estilos.map(e => ({ id: `est:${e.id}`, label: e.nombre, sub: e.epoca,
          children: CAT.fachada.filter(f => f.estilo === e.id).sort((a, b) => orden.indexOf(a.cat) - orden.indexOf(b.cat)).map(f => hoja('fac', f, `${cat(f.cat)} · ${f.epoca}`)) })) },
      techos: { id: 'raiz', label: 'Archivo', sub: 'techos', raiz: true, children: CAT.techos.map(t => hoja('techo', t, t.epoca)) }
    };
  }

  // Niveles abiertos: [raíz], hijos de la raíz, hijos del nodo elegido, …
  function niveles(raiz, camino) {
    const nv = [[raiz], raiz.children];
    for (const id of camino) {
      const n = nv[nv.length - 1].find(c => c.id === id);
      if (!n || !n.children) break;
      nv.push(n.children);
    }
    return nv;
  }

  // opts: { usos(hoja) → n, armado(hoja) → bool, thumb(hoja) → svg, onClick(nodo, nivel) }
  function render(el, raiz, camino, opts) {
    const nv = niveles(raiz, camino), memo = new Map();
    const usos = n => {
      if (memo.has(n.id)) return memo.get(n.id);
      const v = n.hoja ? opts.usos(n.hoja) : (n.children || []).reduce((a, c) => a + usos(c), 0);
      memo.set(n.id, v); return v;
    };
    const W = Math.max(el.clientWidth, NODOW + PAD * 2);
    const cols = Math.max(1, Math.floor((W - PAD * 2 + GAPX) / (NODOW + GAPX)));

    // Ubicar cada nivel como una grilla centrada; los niveles se apilan hacia abajo.
    const pos = new Map();
    let y = PAD;
    nv.forEach((lista, li) => {
      const alto = lista.some(n => n.hoja) ? ALTO_HOJA : ALTO, n = lista.length;
      const c = li === 0 ? 1 : Math.min(cols, n), filas = Math.ceil(n / c);
      lista.forEach((nodo, i) => {
        const fila = Math.floor(i / c), enFila = Math.min(c, n - fila * c);
        const x0 = (W - (enFila * NODOW + (enFila - 1) * GAPX)) / 2;
        pos.set(nodo.id, { x: x0 + (i % c) * (NODOW + GAPX), y: y + fila * (alto + GAPY), h: alto });
      });
      y += filas * (alto + GAPY) - GAPY + BANDA;
    });
    const H = y - BANDA + PAD;

    // Hilos: curvas irregulares, como trazos a mano, del nodo elegido a cada opción (pasan por detrás de las cajas).
    const azar = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return ((h >>> 0) % 1000) / 1000; };
    const hilo = (x1, y1, x2, y2, id, cls) => {
      const dy = Math.max(40, y2 - y1), j1 = (azar(id) - 0.5) * 70, j2 = (azar(id + '*') - 0.5) * 70;
      const d = (o) => `M${x1 + o} ${y1} C${x1 + j1 + o} ${y1 + dy * 0.55} ${x2 + j2 - o} ${y2 - dy * 0.5} ${x2 - o} ${y2}`;
      return `<path class="${cls}" d="${d(0)}"/><path class="${cls} trazo" d="${d(azar(id + '#') * 3 - 1.5)}"/>`;
    };
    const abiertos = [raiz.id, ...camino];
    let lineas = '', rojas = '';
    nv.forEach((lista, li) => {
      if (li === 0) return;
      const p = pos.get(abiertos[li - 1]); if (!p) return;
      const px = p.x + NODOW / 2, py = p.y + p.h;
      for (const n of lista) {
        const q = pos.get(n.id), on = camino[li - 1] === n.id, h = hilo(px, py, q.x + NODOW / 2, q.y, n.id, on ? 'on' : opts.estado && opts.estado(n) === 'bloqueado' ? 'off' : '');
        if (on) rojas += h; else lineas += h;
      }
    });
    lineas += rojas;

    const prev = el.dataset.raiz === raiz.sub ? +el.dataset.niveles || 0 : 0;
    let nodos = '';
    nv.forEach((lista, li) => lista.forEach(n => {
      const p = pos.get(n.id), u = usos(n), on = li === 0 || camino[li - 1] === n.id, est = opts.estado ? opts.estado(n) : null;
      const cls = ['nodo', n.raiz && 'raiz', n.hoja && 'hoja', on && 'on', u && 'usado', n.hoja && opts.armado(n.hoja) && 'armado', li >= prev && 'nuevo', est].filter(Boolean).join(' ');
      const tit = opts.titulo ? opts.titulo(n) : '';
      nodos += `<button class="${cls}" data-nivel="${li}" data-id="${n.id}" style="left:${p.x}px;top:${p.y}px;width:${NODOW}px;height:${p.h}px" ${tit ? `title="${tit}"` : ''}>`
        + (n.hoja ? `<span class="th">${opts.thumb(n.hoja)}</span>` : '')
        + `<span class="tx"><span class="lb">${n.label}</span>${n.sub ? `<span class="sb">${n.sub}</span>` : ''}</span>`
        + (u ? `<i class="cnt" title="Veces usada en tu casa">${u}</i>` : '')
        + (n.children && !n.raiz ? '<b class="mas">⌄</b>' : '') + '</button>';
    }));

    el.innerHTML = `<div class="mapa" style="height:${H}px"><svg class="lineas" width="${W}" height="${H}">${lineas}</svg>${nodos}</div>`;
    el.dataset.niveles = nv.length;
    el.dataset.raiz = raiz.sub;

    el.onclick = e => {
      const b = e.target.closest('.nodo'); if (!b) return;
      const li = +b.dataset.nivel;
      opts.onClick(nv[li].find(x => x.id === b.dataset.id), li);
    };
  }

  return { arboles, render };
})();
