/* Flujo del juego: intro → ciudad (calle Feria) → planta → fachada → casa (techo) → ciudad. */

const estado = { ref: null, casas: {}, patios: [], patioSel: null, sel: {}, fachada: null, techo: 'azotea', cat: 'revestimiento', filtro: null, ultimo: null };
const $ = s => document.querySelector(s);
const obligatoriasFaltantes = () => CATEGORIAS.filter(c => c.obligatoria && !estado.sel[c.id]);
const casaDeEstado = () => ({ patios: structuredClone(estado.patios), sel: { ...estado.sel }, fachada: structuredClone(estado.fachada), techo: estado.techo });
let escenaLista = false;

// ── la ciudad se guarda en este navegador ──
const CLAVE = 'frentistas-feria';
function guardarCiudad() { try { localStorage.setItem(CLAVE, JSON.stringify(estado.casas)); } catch { /* sin almacenamiento: la ciudad vive solo en esta sesión */ } }
function cargarCiudad() { try { estado.casas = JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch { estado.casas = {}; } }

// ── navegación ──
function ir(paso) {
  if (['planta', 'fachada', 'casa'].includes(paso) && !estado.ref) return;
  if (paso === 'casa' && obligatoriasFaltantes().length) return;
  document.querySelectorAll('.pantalla').forEach(p => p.classList.toggle('activa', p.id === paso));
  document.querySelectorAll('.pasos button').forEach(b => b.classList.toggle('actual', b.dataset.paso === paso));
  $('#escena3d').hidden = !['ciudad', 'casa'].includes(paso);
  $('#loteInfo').hidden = true;
  if (paso === 'ciudad') mostrarCiudad();
  if (paso === 'fachada') renderFachada();
  if (paso === 'casa') mostrarCasa();
}
function actualizarPasos() {
  $('.pasos [data-paso="planta"]').disabled = !estado.ref;
  $('.pasos [data-paso="fachada"]').disabled = !estado.ref;
  $('.pasos [data-paso="casa"]').disabled = !estado.ref || obligatoriasFaltantes().length > 0;
}
function prepararEscena() {
  if (escenaLista) return;
  $('#escena3d').hidden = false;
  Escena.iniciar($('#escena3d'), $('#loteInfo'), abrirLote);
  escenaLista = true;
}

// ── intro: el archivo baraja fachadas ──
function fachadaAlAzar() {
  const sel = {};
  for (const c of CATEGORIAS) {
    if (!c.obligatoria && Math.random() < .4) continue;
    const op = PIEZAS.filter(p => p.cat === c.id);
    sel[c.id] = op[Math.floor(Math.random() * op.length)].id;
  }
  const fa = fachadaInicial(LOTE.ancho);
  redimensionarFachada(fa, 2 + Math.floor(Math.random() * 2), fa.modulos);
  return componerFachada(sel, fa);
}
function barajar() { if ($('#intro').classList.contains('activa')) $('#introFachada').innerHTML = fachadaAlAzar(); }

// ── etapa 0: ciudad ──
function mostrarCiudad() {
  prepararEscena();
  Escena.modoCiudad(estado.casas);
  const n = Object.keys(estado.casas).length, piezas = Object.values(estado.casas).flatMap(c => Object.values(c.sel));
  const estilos = new Set(piezas.map(id => PIEZA[id]?.estilo)).size;
  $('#datosCiudad').innerHTML = `<div><dt>Casas nuevas</dt><dd>${n}</dd></div><div><dt>Piezas usadas</dt><dd>${piezas.length}</dd></div>
    <div><dt>Estilos</dt><dd>${estilos}</dd></div><div><dt>Parcelas</dt><dd>${BARRIO.parcelas.length}</dd></div>`;
}
function abrirLote(ref) {
  const lote = prepararLote(ref);
  if (!lote) return;
  usarLote(lote);
  const c = estado.casas[ref];
  Object.assign(estado, {
    ref, patios: c ? structuredClone(c.patios) : [], sel: c ? { ...c.sel } : {}, fachada: c ? structuredClone(c.fachada) : fachadaInicial(lote.ancho),
    techo: c ? c.techo : 'azotea', patioSel: null, ultimo: null, filtro: null, cat: 'revestimiento',
  });
  $('#loteTitulo').textContent = `${ref === BARRIO.inicial ? 'Calle Feria 37' : 'Parcela ' + ref.slice(0, 7)} · ${lote.area} m² · ${fmtM(lote.ancho)} m de frente`;
  Planta.preparar();
  renderPanelPlanta();
  ir('planta');
}
function guardarCasa() {
  estado.casas[estado.ref] = casaDeEstado();
  guardarCiudad();
  ir('ciudad');
  Escena.enfocar(estado.ref);
}

// ── etapa 1: planta ──
function renderPanelPlanta() {
  $('#listaPatios').innerHTML = estado.patios.map((p, i) => `
    <li class="${p.id === estado.patioSel ? 'sel' : ''}" data-id="${p.id}">
      <span class="muestra" style="background:${FUNC[p.funcion].color}"></span>
      <div><b>Patio ${i + 1}</b><small>${fmtM(p.w)} × ${fmtM(p.h)} m · ${fmtM(p.w * p.h)} m²</small></div>
      <select data-id="${p.id}">${FUNCIONES.map(f => `<option value="${f.id}"${f.id === p.funcion ? ' selected' : ''}>${f.nombre}</option>`).join('')}</select>
      <button class="quitar" data-id="${p.id}" title="Quitar patio">×</button>
    </li>`).join('') || '<li class="vacio">Sin patios todavía. La casa sevillana y la casa chorizo viven alrededor de uno.</li>';
  const lote = LOTE ? Math.abs(Geo.area(LOTE.poly)) : 0, libre = estado.patios.reduce((a, p) => a + p.w * p.h, 0);
  $('#datosPlanta').innerHTML = `<div><dt>Parcela</dt><dd>${lote.toFixed(0)} m²</dd></div><div><dt>Patios</dt><dd>${libre.toFixed(1)} m²</dd></div>
    <div><dt>FOS</dt><dd>${lote ? ((lote - libre) / lote).toFixed(2) : '–'}</dd></div><div><dt>Frente</dt><dd>${LOTE ? fmtM(LOTE.ancho) : '–'} m</dd></div>`;
  actualizarPasos();
}

// ── etapa 2: fachada ──
function burbuja(p, chica = false) {
  const e = ESTILOS[p.estilo], on = estado.sel[p.cat] === p.id, textura = p.cat === 'revestimiento' || p.cat === 'zocalo';
  return `<button class="burbuja${on ? ' on' : ''}${chica ? ' chica' : ''}" data-pieza="${p.id}" style="--c:${e.color}" title="${e.nombre} · ${e.fecha}">
    <span class="globo${textura ? ' textura' : ''}"><img src="${img(p.img).src}" alt="">${on ? '<i class="check">✓</i>' : ''}</span>
    <span class="nombre">${p.nombre}</span><span class="periodo">${e.nombre} · ${e.fecha}</span></button>`;
}
function renderCatalogo() {
  $('#tabs').innerHTML = CATEGORIAS.map(c => `<button data-cat="${c.id}" class="${c.id === estado.cat ? 'on' : ''}${estado.sel[c.id] ? ' lleno' : ''}">
    ${c.nombre}${c.obligatoria ? '<sup title="Obligatoria">●</sup>' : ''}</button>`).join('');
  const piezas = PIEZAS.filter(p => p.cat === estado.cat), estilos = [...new Set(piezas.map(p => p.estilo))];
  if (estado.filtro && !estilos.includes(estado.filtro)) estado.filtro = null;
  $('#filtros').innerHTML = `<button data-est="" class="${!estado.filtro ? 'on' : ''}">Todos los estilos</button>` +
    estilos.map(e => `<button data-est="${e}" class="${estado.filtro === e ? 'on' : ''}" style="--c:${ESTILOS[e].color}">${ESTILOS[e].nombre}</button>`).join('');
  const cat = CAT[estado.cat];
  $('#burbujas').innerHTML = `<p class="ayuda-cat">${cat.obligatoria ? '<b>Obligatoria.</b> ' : ''}${estado.cat === 'balcon' ? 'Se usa en las celdas marcadas como balcón. ' : ''}Tocá una pieza para usarla; tocala de nuevo para sacarla.</p>`
    + piezas.filter(p => !estado.filtro || p.estilo === estado.filtro).map(p => burbuja(p)).join('');
  const u = estado.ultimo && PIEZA[estado.ultimo];
  const sug = u ? PIEZAS.filter(p => p.estilo === u.estilo && p.cat !== u.cat && !estado.sel[p.cat]).slice(0, 5) : [];
  $('#sugerencias').innerHTML = sug.length ? `<h4>El archivo te sugiere · <span style="color:${ESTILOS[u.estilo].color}">${ESTILOS[u.estilo].nombre}</span></h4><div class="fila">${sug.map(p => burbuja(p, true)).join('')}</div>` : '';
}
function renderEncargo() {
  const elegidas = CATEGORIAS.filter(c => estado.sel[c.id]).map(c => PIEZA[estado.sel[c.id]]);
  $('#carrito').innerHTML = elegidas.map(p => `<li><span class="mini"><img src="${img(p.img).src}" alt=""></span><div><small>${CAT[p.cat].nombre}</small><b>${p.nombre}</b>
    <em style="--c:${ESTILOS[p.estilo].color}">${ESTILOS[p.estilo].nombre}</em></div><button class="quitar" data-cat="${p.cat}" title="Sacar">×</button></li>`).join('')
    || '<li class="vacio">El encargo está vacío. Elegí piezas del catálogo.</li>';
  const faltan = obligatoriasFaltantes();
  $('#faltan').textContent = faltan.length ? `Falta elegir: ${faltan.map(c => c.nombre.toLowerCase()).join(', ')}.` : 'Ya podés ver la casa en volumen.';
  $('#aCasa').disabled = faltan.length > 0;
  actualizarPasos();
}
function renderElevacion() {
  const fa = estado.fachada;
  $('#pisosN').textContent = fa.pisos; $('#modulosN').textContent = fa.modulos;
  $('#elevacion').innerHTML = componerFachada(estado.sel, fa, { interactiva: true });
}
function renderFachada() { renderCatalogo(); renderEncargo(); renderElevacion(); }
function elegir(id) {
  const p = PIEZA[id];
  if (estado.sel[p.cat] === id) { delete estado.sel[p.cat]; estado.ultimo = null; }
  else { estado.sel[p.cat] = id; estado.ultimo = id; }
  renderFachada();
}

// ── etapa 3: casa ──
function mostrarCasa() {
  prepararEscena();
  Escena.modoCasa(estado.casas, LOTE, casaDeEstado());
  Escena.vista('axo');
  $('#corte').value = 1000; actualizarCorte();
  renderTechos(); renderFicha();
}
function renderTechos() {
  $('#techos').innerHTML = TECHOS.map(t => `<button data-techo="${t.id}" class="${t.id === estado.techo ? 'on' : ''}" style="--c:${ESTILOS[t.estilo].color}">${t.nombre}<small>${ESTILOS[t.estilo].nombre}</small></button>`).join('');
}
function actualizarCorte() {
  const v = +$('#corte').value, alto = estado.fachada.pisos * ALTO_NIVEL + 3;
  if (v >= 1000) { Escena.corte(null); $('#corteTxt').textContent = 'Sin corte'; return; }
  const y = .3 + v / 1000 * alto, n = Math.floor(y / ALTO_NIVEL);
  Escena.corte(y);
  $('#corteTxt').textContent = `Corte a +${y.toFixed(2)} m · ${n === 0 ? 'Planta baja' : n < estado.fachada.pisos ? `Piso ${n}` : 'Techo'}`;
}
function renderFicha() {
  const elegidas = CATEGORIAS.filter(c => estado.sel[c.id]).map(c => PIEZA[estado.sel[c.id]]);
  const techo = TECHOS.find(t => t.id === estado.techo), todos = [...elegidas.map(p => p.estilo), techo.estilo];
  const anios = todos.map(e => ESTILOS[e].anio), min = Math.min(...anios), max = Math.max(...anios);
  const x = a => ((a - 1700) / (2126 - 1700) * 100).toFixed(1);
  $('#ficha').innerHTML = `<h3>Ficha de obra</h3>
    <p class="lugar">${$('#loteTitulo').textContent} · ${estado.patios.length} patio${estado.patios.length === 1 ? '' : 's'} · ${estado.fachada.pisos} planta${estado.fachada.pisos > 1 ? 's' : ''}</p>
    <div class="numeros"><div><b>${elegidas.length + 1}</b><span>fragmentos</span></div><div><b>${new Set(todos).size}</b><span>estilos</span></div><div><b>${max - min}</b><span>años de archivo</span></div><div><b>0</b><span>piezas nuevas</span></div></div>
    <div class="linea-tiempo"><span class="eje"></span>${todos.map(e => `<i style="left:${x(ESTILOS[e].anio)}%;--c:${ESTILOS[e].color}" title="${ESTILOS[e].nombre}"></i>`).join('')}
      <i class="hoy" style="left:100%" title="2126"></i><small style="left:0">1700</small><small style="right:0">2126</small></div>
    <ul>${elegidas.map(p => `<li><em style="--c:${ESTILOS[p.estilo].color}"></em><b>${p.nombre}</b><small>${CAT[p.cat].nombre} · ${ESTILOS[p.estilo].nombre}</small></li>`).join('')}
      <li><em style="--c:${ESTILOS[techo.estilo].color}"></em><b>${techo.nombre}</b><small>Techo · ${ESTILOS[techo.estilo].nombre}</small></li></ul>
    <p class="cierre">Una casa de 2126 hecha con ${max - min} años de pasado. Todo está recortado del archivo; nada es nuevo.</p>`;
}
function renderCreditos() {
  $('#listaCreditos').innerHTML = CREDITOS.map(c => `<li><a href="${c.url}" target="_blank" rel="noopener">${c.archivo}</a> · ${c.autor || 'autor desconocido'} · ${c.licencia}</li>`).join('')
    + '<li>Texturas: <a href="https://polyhaven.com" target="_blank" rel="noopener">Poly Haven</a> (CC0).</li><li>Parcelario y edificación: Dirección General del Catastro (INSPIRE).</li>';
}

// ── eventos ──
document.addEventListener('DOMContentLoaded', () => {
  cargarCiudad();
  usarLote(prepararLote(BARRIO.inicial));
  Planta.iniciar($('#svgPlanta'), estado, renderPanelPlanta);
  actualizarPasos();
  barajar();
  setInterval(barajar, 2600);
  renderCreditos();

  $('#empezar').onclick = () => ir('ciudad');
  document.querySelectorAll('.pasos button').forEach(b => b.onclick = () => ir(b.dataset.paso));
  $('#irFeria').onclick = () => abrirLote(BARRIO.inicial);
  $('#vistaAerea').onclick = () => Escena.vista('aerea');
  $('#borrarCiudad').onclick = () => {
    if (!confirm('¿Vaciar la ciudad? Se borran todas las casas construidas.')) return;
    estado.casas = {}; guardarCiudad(); mostrarCiudad();
  };
  $('#creditos').onclick = () => $('#dialogoCreditos').showModal();

  $('#agregarPatio').onclick = () => { if (!Planta.agregar()) alert('No entra otro patio de 3 × 3 m. Achicá o mové los que ya están.'); renderPanelPlanta(); };
  $('#listaPatios').addEventListener('change', e => { const p = estado.patios.find(q => q.id === +e.target.dataset.id); if (p) { p.funcion = e.target.value; Planta.render(); renderPanelPlanta(); } });
  $('#listaPatios').addEventListener('click', e => {
    if (e.target.classList.contains('quitar')) { Planta.quitar(+e.target.dataset.id); renderPanelPlanta(); return; }
    const li = e.target.closest('li[data-id]');
    if (li && e.target.tagName !== 'SELECT') { estado.patioSel = +li.dataset.id; Planta.render(); renderPanelPlanta(); }
  });
  $('#aFachada').onclick = () => ir('fachada');

  $('#tabs').onclick = e => { const c = e.target.closest('button')?.dataset.cat; if (c) { estado.cat = c; renderCatalogo(); } };
  $('#filtros').onclick = e => { const b = e.target.closest('button'); if (b) { estado.filtro = b.dataset.est || null; renderCatalogo(); } };
  $('.catalogo').addEventListener('click', e => { const b = e.target.closest('[data-pieza]'); if (b) elegir(b.dataset.pieza); });
  $('#carrito').onclick = e => { const c = e.target.closest('.quitar')?.dataset.cat; if (c) { delete estado.sel[c]; renderFachada(); } };
  $('#elevacion').onclick = e => { const c = e.target.closest('.celda'); if (c) { ciclarCelda(estado.fachada, +c.dataset.f, +c.dataset.i); renderElevacion(); } };
  document.querySelectorAll('[data-ajuste]').forEach(b => b.onclick = () => {
    const fa = estado.fachada, [que, d] = b.dataset.ajuste.split(':');
    redimensionarFachada(fa, fa.pisos + (que === 'pisos' ? +d : 0), fa.modulos + (que === 'modulos' ? +d : 0));
    renderElevacion();
  });
  $('#aCasa').onclick = () => ir('casa');

  $('#techos').onclick = e => { const t = e.target.closest('[data-techo]')?.dataset.techo; if (t) { estado.techo = t; Escena.modoCasa(estado.casas, LOTE, casaDeEstado()); renderTechos(); renderFicha(); } };
  $('#corte').oninput = actualizarCorte;
  document.querySelectorAll('[data-vista]').forEach(b => b.onclick = () => Escena.vista(b.dataset.vista));
  $('#captura').onclick = () => { const a = document.createElement('a'); a.href = Escena.captura(); a.download = 'casa-feria-2126.png'; a.click(); };
  $('#volverFachada').onclick = () => ir('fachada');
  $('#guardarCasa').onclick = guardarCasa;
});
