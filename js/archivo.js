/* Mapa del archivo: el catálogo como grafo que se despliega de izquierda a derecha
   (inspirado en FIUBA Map). Cada paso del juego tiene su propio árbol:
   planta (ambientes y patios), fachada (estilo → piezas) y techos.
   Cada elección abre la columna siguiente y deja marcado el recorrido. */

window.Archivo = (() => {
  const COLW = 260, NODOW = 214, ALTO = 48, ALTO_HOJA = 74, VGAP = 9, PADX = 20, PADY = 18;
  const clampY = (y, max) => Math.max(PADY, Math.min(max, y));

  function arboles(CAT) {
    const cat = id => CAT.categorias.find(c => c.id === id).nombre;
    const orden = CAT.categorias.map(c => c.id);
    const hoja = (kind, d, sub) => ({ id: `${kind}:${d.id}`, label: d.nombre, sub, hoja: { kind, id: d.id } });
    return {
      planta: { id: 'raiz', label: 'Archivo', sub: 'ambientes y patios', raiz: true, children: [
        { id: 'ambientes', label: 'Ambientes', sub: 'living, cocina, dormitorio…', children: CAT.ambientes.map(a => hoja('amb', a, `${a.w} × ${a.h} m`)) },
        { id: 'patios', label: 'Patios', sub: 'tipos de patio', children: CAT.patios.map(p => hoja('patio', p, p.funcion)) },
        { id: 'objetos', label: 'Objetos de patio', sub: 'fuente, naranjo, aljibe…', children: CAT.objetos.map(o => hoja('obj', o, 'va adentro de un patio')) }
      ] },
      fachada: { id: 'raiz', label: 'Archivo', sub: `${CAT.estilos.length} estilos`, raiz: true,
        children: CAT.estilos.map(e => ({ id: `est:${e.id}`, label: e.nombre, sub: e.epoca,
          children: CAT.fachada.filter(f => f.estilo === e.id).sort((a, b) => orden.indexOf(a.cat) - orden.indexOf(b.cat)).map(f => hoja('fac', f, `${cat(f.cat)} · ${f.epoca}`)) })) },
      techos: { id: 'raiz', label: 'Archivo', sub: 'techos', raiz: true, children: CAT.techos.map(t => hoja('techo', t, t.epoca)) }
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
    const cols = columnas(raiz, camino), memo = new Map();
    const usos = n => {
      if (memo.has(n.id)) return memo.get(n.id);
      const v = n.hoja ? opts.usos(n.hoja) : (n.children || []).reduce((a, c) => a + usos(c), 0);
      memo.set(n.id, v); return v;
    };
    const alto = n => n.hoja ? ALTO_HOJA : ALTO;
    const colH = c => c.reduce((a, n) => a + alto(n) + VGAP, -VGAP);
    const H = Math.max(260, ...cols.map(colH)) + PADY * 2;
    const W = PADX * 2 + (cols.length - 1) * COLW + NODOW;

    const pos = new Map(), abiertos = [raiz.id, ...camino];
    cols.forEach((c, ci) => {
      // Cada columna se acomoda a la altura del nodo que la abrió, para que las opciones aparezcan al lado.
      const padre = ci > 1 && pos.get(abiertos[ci - 1]);
      let y = padre ? clampY(padre.y + padre.h / 2 - colH(c) / 2, H - PADY - colH(c)) : (H - colH(c)) / 2;
      c.forEach(n => { pos.set(n.id, { x: PADX + ci * COLW, y, h: alto(n) }); y += alto(n) + VGAP; });
    });

    const prevCols = el.dataset.raiz === raiz.sub ? +el.dataset.cols || 0 : 0;
    let lineas = '', nodos = '';
    cols.forEach((c, ci) => {
      if (ci === 0) return;
      const padre = pos.get(abiertos[ci - 1]);
      if (!padre) return;
      for (const n of c) {
        const p = pos.get(n.id), x1 = padre.x + NODOW, y1 = padre.y + padre.h / 2, x2 = p.x, y2 = p.y + p.h / 2;
        lineas += `<path d="M${x1} ${y1} C${x1 + 50} ${y1} ${x2 - 50} ${y2} ${x2} ${y2}" class="${camino[ci - 1] === n.id ? 'on' : ''}"/>`;
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
    if (cols.length > prevCols && prevCols) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
    el.dataset.cols = cols.length;
    el.dataset.raiz = raiz.sub;

    el.onclick = e => {
      const b = e.target.closest('.nodo'); if (!b) return;
      const ci = +b.dataset.col;
      opts.onClick(cols[ci].find(x => x.id === b.dataset.id), ci);
    };
  }

  return { arboles, render };
})();
