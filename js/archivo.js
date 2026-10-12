/* Mapa del archivo: el catálogo como grafo que se despliega de izquierda a derecha
   (inspirado en FIUBA Map). Archivo → sistema → categoría → época → pieza.
   Cada elección abre la columna siguiente y deja marcado el recorrido. */

window.Archivo = (() => {
  const COLW = 210, NODOW = 172, ALTO = 40, ALTO_HOJA = 56, VGAP = 8, PADX = 18;

  function arbol(CAT) {
    const hoja = (kind, d, sub) => ({ id: `${kind}:${d.id}`, label: d.nombre, sub, hoja: { kind, id: d.id } });
    const porEra = (lista, kind, prefijo) => CAT.eras
      .map(e => ({ id: `${prefijo}/${e.id}`, label: e.nombre,
        children: lista.filter(d => CAT.eraDe(d.anio) === e.id).sort((a, b) => a.anio - b.anio).map(d => hoja(kind, d, d.epoca)) }))
      .filter(n => n.children.length);
    return {
      id: 'archivo', label: 'Archivo', sub: 'catálogo infinito', raiz: true,
      children: [
        { id: 'planta', label: 'Planta', sub: 'ambientes', vista: 'planta', children: CAT.ambientes.map(a => hoja('amb', a, `${a.w} × ${a.h} m`)) },
        { id: 'patios', label: 'Patios', sub: 'tipos y objetos', vista: 'planta', children: [
          { id: 'patios/tipos', label: 'Tipos de patio', children: CAT.patios.map(p => hoja('patio', p, p.funcion)) },
          { id: 'patios/objetos', label: 'Objetos de patio', children: CAT.objetos.map(o => hoja('obj', o, 'para poner en un patio')) }
        ] },
        { id: 'fachada', label: 'Fachada', sub: 'piezas de todas las épocas', vista: 'fachada',
          children: CAT.categorias.map(c => ({ id: `fachada/${c.id}`, label: c.nombre, children: porEra(CAT.fachada.filter(f => f.cat === c.id), 'fac', `fachada/${c.id}`) })) },
        { id: 'techos', label: 'Techos', sub: 'se ven en el corte', vista: 'corte', children: porEra(CAT.techos, 'techo', 'techos') }
      ]
    };
  }

  function columnas(raiz, camino) {
    const cols = [[raiz], raiz.children];
    for (const id of camino) {
      const n = cols[cols.length - 1].find(c => c.id === id);
      if (!n || !n.children) break;
      cols.push(n.children);
    }
    return cols;
  }

  // opts: { usos(hoja) → n, armado(hoja) → bool, thumb(hoja) → svg, onClick(nodo, col) }
  function render(el, raiz, camino, opts) {
    const cols = columnas(raiz, camino);
    const memo = new Map();
    const usos = n => {
      if (memo.has(n.id)) return memo.get(n.id);
      const v = n.hoja ? opts.usos(n.hoja) : (n.children || []).reduce((a, c) => a + usos(c), 0);
      memo.set(n.id, v); return v;
    };
    const alto = n => n.hoja ? ALTO_HOJA : ALTO;
    const colH = c => c.reduce((a, n) => a + alto(n) + VGAP, -VGAP);
    const H = Math.max(el.clientHeight - 4, ...cols.map(colH)) + 24;
    const W = PADX * 2 + (cols.length - 1) * COLW + NODOW;

    const pos = new Map();
    cols.forEach((c, ci) => {
      let y = (H - colH(c)) / 2;
      c.forEach(n => { pos.set(n.id, { x: PADX + ci * COLW, y, h: alto(n) }); y += alto(n) + VGAP; });
    });

    let lineas = '', nodos = '';
    const prevCols = +el.dataset.cols || 0;
    const abiertos = [raiz.id, ...camino];
    cols.forEach((c, ci) => {
      if (ci === 0) return;
      const padre = pos.get(abiertos[ci - 1]);
      if (!padre) return;
      for (const n of c) {
        const p = pos.get(n.id), x1 = padre.x + NODOW, y1 = padre.y + padre.h / 2, x2 = p.x, y2 = p.y + p.h / 2;
        const on = camino[ci - 1] === n.id;
        lineas += `<path d="M${x1} ${y1} C${x1 + 50} ${y1} ${x2 - 50} ${y2} ${x2} ${y2}" class="${on ? 'on' : ''}"/>`;
      }
    });
    cols.forEach((c, ci) => c.forEach(n => {
      const p = pos.get(n.id), u = usos(n), on = ci === 0 || camino[ci - 1] === n.id;
      const cls = ['nodo', n.raiz && 'raiz', n.hoja && 'hoja', on && 'on', u && 'usado', n.hoja && opts.armado(n.hoja) && 'armado', ci >= prevCols && 'nuevo'].filter(Boolean).join(' ');
      nodos += `<button class="${cls}" data-col="${ci}" data-id="${n.id}" style="left:${p.x}px;top:${p.y}px;width:${NODOW}px;height:${p.h}px">`
        + (n.hoja ? `<span class="th">${opts.thumb(n.hoja)}</span>` : '')
        + `<span class="tx"><span class="lb">${n.label}</span>${n.sub ? `<span class="sb">${n.sub}</span>` : ''}</span>`
        + (u ? `<i class="cnt" title="Veces usada en tu casa">${u}</i>` : '')
        + (n.children ? '<b class="mas">›</b>' : '') + '</button>';
    }));

    el.innerHTML = `<div class="mapa" style="width:${W}px;height:${H}px"><svg class="lineas" width="${W}" height="${H}">${lineas}</svg>${nodos}</div>`;
    el.dataset.cols = cols.length;
    if (cols.length > prevCols) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });

    el.onclick = e => {
      const b = e.target.closest('.nodo'); if (!b) return;
      const ci = +b.dataset.col, n = cols[ci].find(x => x.id === b.dataset.id);
      opts.onClick(n, ci);
    };
  }

  return { arbol, render };
})();
