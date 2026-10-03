/* Escena 3D única: el barrio real de calle Feria (Catastro) y las casas de los frentistas.
   Modo 'ciudad': se eligen parcelas. Modo 'casa': se mira, corta y techa la casa en construcción. */

const ALTO_PISO_BARRIO = 3.3, RADIO = 175;
const W3 = ([x, y], h = 0) => new THREE.Vector3(x, h, -y); // barrio (x este, y norte) → mundo

function azar(seed) { let s = seed % 2147483647 || 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const hashRef = ref => [...ref].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 2147483647, 7);

const Escena = (() => {
  let renderer, scene, camera, controls, el, info, sol, plano, alElegir;
  let modo = 'ciudad', hover = null, abajoEn = null, casaActual = null;
  const porParcela = {}, casasG = {}, cacheTex = {};
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  const marcables = [];

  // ── texturas ──
  function textura(id, metros = 1, ajustar) {
    const clave = id + metros;
    if (cacheTex[clave]) return cacheTex[clave];
    const t = new THREE.TextureLoader().load(img(id).src);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / metros, 1 / metros);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 8;
    ajustar?.(t);
    return cacheTex[clave] = t;
  }
  const mat = (o = {}) => new THREE.MeshStandardMaterial({ roughness: .92, metalness: 0, ...o });

  // fachadas genéricas del barrio, pintadas en un canvas: revoque + ventanas con postigos o balcones
  function texturaFachada(color, semilla) {
    const cv = document.createElement('canvas'), g = cv.getContext('2d'), rnd = azar(semilla);
    cv.width = 512; cv.height = 282; // 6 m × 3,3 m
    const pm = 512 / 6;
    g.fillStyle = color; g.fillRect(0, 0, cv.width, cv.height);
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${rnd() > .5 ? '255,255,255' : '40,30,20'},${rnd() * .04})`; g.fillRect(rnd() * 512, rnd() * 282, 2 + rnd() * 6, 2 + rnd() * 6); }
    g.fillStyle = 'rgba(40,30,20,.08)'; g.fillRect(0, 0, 512, 5);
    const postigo = ['#5b7562', '#7a5a42', '#8a8d84', '#58708a'][Math.floor(rnd() * 4)], balcon = rnd() > .55;
    for (const cx of [1.5, 4.5]) {
      const w = .9 * pm, h = (balcon ? 2.1 : 1.45) * pm, x = cx * pm - w / 2, y = 282 - (balcon ? .2 : 1.1) * pm - h;
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x - 5, y - 5, w + 10, h + 7);
      g.fillStyle = '#4a4f52'; g.fillRect(x, y, w, h);
      g.fillStyle = 'rgba(190,210,220,.22)'; g.fillRect(x + 4, y + 4, w * .4, h * .5);
      g.fillStyle = postigo;
      if (rnd() > .35) { g.fillRect(x - w * .48, y, w * .44, h); g.fillRect(x + w * 1.04, y, w * .44, h); }
      g.strokeStyle = 'rgba(30,30,30,.7)'; g.lineWidth = 1.6;
      if (balcon) { g.fillStyle = 'rgba(80,70,60,.9)'; g.fillRect(x - 14, 282 - .2 * pm, w + 28, 7); for (let bx = x - 12; bx < x + w + 14; bx += 7) { g.beginPath(); g.moveTo(bx, 282 - .2 * pm); g.lineTo(bx, 282 - 1.1 * pm); g.stroke(); } g.beginPath(); g.moveTo(x - 14, 282 - 1.1 * pm); g.lineTo(x + w + 14, 282 - 1.1 * pm); g.stroke(); }
      else for (let bx = x + 6; bx < x + w; bx += 9) { g.beginPath(); g.moveTo(bx, y); g.lineTo(bx, y + h); g.stroke(); }
    }
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 6, 1 / ALTO_PISO_BARRIO); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8;
    return t;
  }

  // ── geometrías ──
  // muros de un polígono extruido: u = largo acumulado, v = altura (en metros)
  function geoMuros(poly, h0, h1) {
    const pos = [], uv = [];
    let acum = 0;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const A0 = W3(a, h0), B0 = W3(b, h0), A1 = W3(a, h1), B1 = W3(b, h1);
      pos.push(...A0.toArray(), ...B0.toArray(), ...B1.toArray(), ...A0.toArray(), ...B1.toArray(), ...A1.toArray());
      uv.push(acum, h0, acum + L, h0, acum + L, h1, acum, h0, acum + L, h1, acum, h1);
      acum += L;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  }
  // tapa plana (con agujeros) a una altura; uv en metros
  function geoTapa(poly, h, agujeros = []) {
    const forma = new THREE.Shape(poly.map(([x, y]) => new THREE.Vector2(x, y)));
    agujeros.forEach(a => forma.holes.push(new THREE.Path(a.map(([x, y]) => new THREE.Vector2(x, y)))));
    const g = new THREE.ShapeGeometry(forma);
    g.rotateX(-Math.PI / 2); g.translate(0, h, 0);
    return g;
  }
  // losa con espesor
  function geoLosa(poly, h, e, agujeros = []) {
    const forma = new THREE.Shape(poly.map(([x, y]) => new THREE.Vector2(x, y)));
    agujeros.forEach(a => forma.holes.push(new THREE.Path(a.map(([x, y]) => new THREE.Vector2(x, y)))));
    const g = new THREE.ExtrudeGeometry(forma, { depth: e, bevelEnabled: false });
    g.rotateX(-Math.PI / 2); g.translate(0, h, 0);
    return g;
  }
  // techo de teja a cuatro aguas aproximado: abanico de cada lado hacia el centro
  function geoTejado(poly, h, alto) {
    const [cx, cy] = Geo.centroide(poly), pos = [], uv = [], C = W3([cx, cy], h + alto);
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      pos.push(...W3(a, h).toArray(), ...W3(b, h).toArray(), ...C.toArray());
      uv.push(a[0] * .7, a[1] * .7, b[0] * .7, b[1] * .7, cx * .7, cy * .7);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  }
  function malla(geo, material, grupo, sombra = true) {
    const m = new THREE.Mesh(geo, material);
    m.castShadow = m.receiveShadow = sombra;
    grupo.add(m);
    return m;
  }

  // ── árboles variados ──
  function arbol(grupo, x, y, rnd, base = 0) {
    const k = .75 + rnd() * .6, g = new THREE.Group();
    if (rnd() < .22) { // palmera
      const alto = 6 + rnd() * 4;
      malla(new THREE.CylinderGeometry(.16, .26, alto, 8), mat({ color: '#7a6a55' }), g).position.y = alto / 2;
      for (let i = 0; i < 9; i++) {
        const hoja = malla(new THREE.ConeGeometry(.35, 3.2, 4), mat({ color: new THREE.Color().setHSL(.27 + rnd() * .05, .45, .26 + rnd() * .08) }), g);
        hoja.scale.z = .2; hoja.position.set(0, alto, 0);
        hoja.rotation.set(0, i * .7, 0); hoja.rotateX(1.9 + rnd() * .5); hoja.translateY(1.4);
      }
    } else {
      const alto = (2 + rnd()) * k;
      malla(new THREE.CylinderGeometry(.1 * k, .18 * k, alto, 7), mat({ color: '#5b4532' }), g).position.y = alto / 2;
      const n = 4 + Math.floor(rnd() * 4), tono = .2 + rnd() * .1;
      for (let i = 0; i < n; i++) {
        const geo = new THREE.IcosahedronGeometry(1, 1), p = geo.attributes.position;
        for (let v = 0; v < p.count; v++) p.setXYZ(v, p.getX(v) * (1 + (rnd() - .5) * .35), p.getY(v) * (1 + (rnd() - .5) * .35), p.getZ(v) * (1 + (rnd() - .5) * .35));
        geo.computeVertexNormals();
        const c = malla(geo, mat({ color: new THREE.Color().setHSL(tono + (rnd() - .5) * .04, .38 + rnd() * .15, .2 + rnd() * .1), flatShading: true, roughness: 1 }), g);
        const s = (1 + rnd() * .7) * k;
        c.scale.set(s, s * (.75 + rnd() * .3), s);
        c.position.set((rnd() - .5) * 1.6 * k, alto + .6 * k + rnd() * 1.2 * k, (rnd() - .5) * 1.6 * k);
      }
    }
    g.position.copy(W3([x, y], base));
    g.rotation.y = rnd() * 6.28;
    grupo.add(g);
    return g;
  }

  // ── el barrio ──
  function barrio() {
    const g = new THREE.Group();
    const calle = mat({ map: textura('asphalt_02', 5), color: '#b9b4ac' });
    malla(geoTapa([[-400, -400], [400, -400], [400, 400], [-400, 400]], 0), calle, g, false).receiveShadow = true;
    // muros encalados en su mayoría, algunos en albero y almagra, como en la foto aérea del barrio
    const colores = ['#f6f3ec', '#f3eee4', '#f7f4ee', '#efe6d2', '#f1e3bd', '#ecd49a', '#e7c3ad', '#f4f1ea'];
    const muros = colores.map((c, i) => ({ fachada: mat({ map: texturaFachada(c, i + 3), side: THREE.DoubleSide }), liso: mat({ color: c, side: THREE.DoubleSide }) }));
    const claro = mat({ map: textura('white_plaster_rough_01', 3), color: '#efebe4' });
    const azoteas = [claro, claro, mat({ map: textura('concrete_wall_008', 4), color: '#e4ddd2' }), mat({ map: textura('terracotta_floor_tiles', 2.5), color: '#ffe9df' })];
    const teja = mat({ map: textura('clay_roof_tiles_02', 1, t => t.repeat.set(.7, .7)), color: '#e8b9ae', side: THREE.DoubleSide });
    const patios = [mat({ map: textura('checkered_pavement_tiles', 2) }), mat({ map: textura('terracotta_floor_tiles', 2) })];
    const porRef = {};
    BARRIO.edificios.forEach(e => (porRef[e.ref] ||= []).push(e));
    const arboles = new THREE.Group(); g.add(arboles);

    for (const par of BARRIO.parcelas) {
      const c = Geo.centroide(par.p);
      if (Math.hypot(c[0], c[1]) > RADIO + 60) continue;
      const rnd = azar(hashRef(par.ref)), gp = new THREE.Group();
      gp.userData.ref = par.ref;
      // suelo de la parcela (patios y espacios libres)
      malla(geoTapa(par.p, .04), patios[Math.floor(rnd() * 2)], gp, false).receiveShadow = true;
      const partes = porRef[par.ref] || [], muro = muros[Math.floor(rnd() * muros.length)];
      const tejado = rnd() < .45, azotea = azoteas[Math.floor(rnd() * azoteas.length)];
      let construida = 0;
      for (const e of partes) {
        const h = e.n * ALTO_PISO_BARRIO;
        construida += Math.abs(Geo.area(e.p));
        malla(geoMuros(e.p, 0, h), muro.fachada, gp);
        if (tejado && e.n <= 3) malla(geoTejado(e.p, h, Math.min(1.8, Math.sqrt(Math.abs(Geo.area(e.p))) * .18)), teja, gp);
        else { malla(geoMuros(e.p, h, h + .9), muro.liso, gp); malla(geoTapa(e.p, h), azotea, gp); }
      }
      // árboles en los patios grandes
      const libre = Math.abs(Geo.area(par.p)) - construida;
      if (libre > 70) for (let t = 0, n = Math.min(3, Math.floor(libre / 70)); t < 40 && n > 0; t++) {
        const [a, b, cc, d] = par.caja, q = [a + rnd() * (cc - a), b + rnd() * (d - b)];
        if (Geo.dentro(q, par.p) && !partes.some(e => Geo.dentro(q, e.p))) { arbol(gp, q[0], q[1], rnd, .04); n--; }
      }
      g.add(gp);
      porParcela[par.ref] = gp;
      if (Math.hypot(c[0], c[1]) < RADIO) gp.traverse(o => { if (o.isMesh) { o.userData.ref = par.ref; marcables.push(o); } });
    }
    // marca del lote inicial: calle Feria 37
    const ini = Geo.centroide(PARCELA[BARRIO.inicial].p);
    const pin = new THREE.Group();
    malla(new THREE.CylinderGeometry(.12, .12, 9, 8), mat({ color: '#d9962a', emissive: '#6a3c00' }), pin).position.y = 13.5;
    malla(new THREE.SphereGeometry(1, 20, 14), mat({ color: '#e8a73a', emissive: '#8a4c00' }), pin).position.y = 18.5;
    pin.position.copy(W3(ini));
    pin.userData.pin = true;
    g.add(pin);
    return g;
  }

  // ── la casa del frentista, en coordenadas del barrio ──
  function construirCasa(lote, casa, anis) {
    const g = new THREE.Group(), P = lote.mundo, FH = ALTO_NIVEL, pisos = casa.fachada.pisos, H = pisos * FH;
    const agujeros = casa.patios.map(p => patioPoly(p).map(P));
    const sg = Geo.area(lote.polyMundo) > 0 ? 1 : -1;
    const mMuro = mat({ color: '#ece4d4', side: THREE.DoubleSide });
    const mLosa = mat({ color: '#d6cbb6' });
    // muro: caja a lo largo de un lado, corrida hacia adentro del polígono
    const muro = (a, b, h0, h1, t, signo) => {
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
      if (L < .05) return;
      const nx = -dy / L * signo, ny = dx / L * signo, m = malla(new THREE.BoxGeometry(L + t, h1 - h0, t), mMuro, g);
      m.position.copy(W3([(a[0] + b[0]) / 2 + nx * t / 2, (a[1] + b[1]) / 2 + ny * t / 2], (h0 + h1) / 2));
      m.rotation.y = Math.atan2(dy, dx);
    };
    const contorno = (poly, h0, h1, t, signo) => poly.forEach((a, i) => muro(a, poly[(i + 1) % poly.length], h0, h1, t, signo));
    for (let f = 0; f < pisos; f++) {
      malla(geoLosa(lote.polyMundo, f * FH, .2, agujeros), mLosa, g);
      contorno(lote.polyMundo, f * FH + .2, (f + 1) * FH, .25, sg);
      agujeros.forEach(a => contorno(a, f * FH + .2, (f + 1) * FH, .2, -(Geo.area(a) > 0 ? 1 : -1)));
    }
    techo(g, lote, casa, H, agujeros, mMuro, contorno, sg);
    // patios
    casa.patios.forEach((p, i) => {
      malla(geoTapa(agujeros[i], .06), mat({ map: textura('checkered_pavement_tiles', 1.5) }), g, false).receiveShadow = true;
      const c = P([p.x + p.w / 2, p.y + p.h / 2]), rnd = azar(p.id * 97 + 5);
      if (p.funcion === 'naranjos' || p.funcion === 'descanso' || p.funcion === 'luz') arbol(g, c[0], c[1], rnd, .06);
      if (p.funcion === 'agua') {
        const f = malla(new THREE.CylinderGeometry(1, 1.1, .5, 32), mat({ map: textura('white_plaster_rough_01', 1) }), g); f.position.copy(W3(c, .3));
        const a = malla(new THREE.CylinderGeometry(.9, .9, .05, 32), mat({ color: '#4f8fb0', roughness: .2 }), g); a.position.copy(W3(c, .53));
      }
      if (p.funcion === 'huerta') for (let k = -1; k <= 1; k++) {
        const cantero = malla(new THREE.BoxGeometry(p.w * .8, .35, .5), mat({ color: '#5f7f3a', roughness: 1 }), g);
        cantero.position.copy(W3(P([p.x + p.w / 2, p.y + p.h / 2 + k * p.h * .28]), .2)); cantero.rotation.y = Math.atan2(lote.r[1], lote.r[0]);
      }
    });
    // fachada: una cinta que sigue el frente real de la parcela
    fachada3d(g, lote, casa, anis);
    return g;
  }

  function techo(g, lote, casa, H, agujeros, mMuro, contorno, sg) {
    const tipo = casa.techo || 'azotea', poly = lote.polyMundo;
    const tapa = tipo === 'jardin' ? mat({ map: textura('sparse_grass', 3) }) : mat({ map: textura('white_plaster_rough_01', 3), color: '#efe9df' });
    const Hf = medidasFachada(casa.sel, casa.fachada).tope / S; // el alero arranca sobre el coronamiento de la fachada
    malla(geoLosa(poly, H, .25, agujeros), tapa, g);
    contorno(poly, H + .25, H + 1.1, .22, sg);
    agujeros.forEach(a => contorno(a, H + .25, H + 1.1, .18, -(Geo.area(a) > 0 ? 1 : -1)));
    const n = lote.n, cad = lote.cadena;
    if (tipo === 'teja' || tipo === 'pizarra') {
      // faldón sobre la primera crujía, desde el frente hacia adentro
      const D = Math.min(tipo === 'teja' ? 4.5 : 3.2, lote.fondo * .5), alto = tipo === 'teja' ? D * .45 : D * 1.1, vuelo = tipo === 'teja' ? .45 : .2;
      const m = mat({ map: textura(tipo === 'teja' ? 'clay_roof_tiles_02' : 'roof_slates_02', 1.6), side: THREE.DoubleSide });
      const pos = [], uv = [];
      let acum = 0;
      for (let i = 0; i < cad.length - 1; i++) {
        const a = cad[i], b = cad[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const fa = W3([a[0] - n[0] * vuelo, a[1] - n[1] * vuelo], Hf), fb = W3([b[0] - n[0] * vuelo, b[1] - n[1] * vuelo], Hf);
        const ba = W3([a[0] + n[0] * D, a[1] + n[1] * D], Hf + alto), bb = W3([b[0] + n[0] * D, b[1] + n[1] * D], Hf + alto);
        pos.push(...fa.toArray(), ...fb.toArray(), ...bb.toArray(), ...fa.toArray(), ...bb.toArray(), ...ba.toArray());
        const s = Math.hypot(D + vuelo, alto);
        uv.push(acum, 0, acum + L, 0, acum + L, s, acum, 0, acum + L, s, acum, s);
        acum += L;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv.map(v => v / 1.6), 2));
      geo.computeVertexNormals();
      malla(geo, m, g);
      // hastiales en las puntas
      for (const a of [cad[0], cad.at(-1)]) {
        const t = new THREE.BufferGeometry();
        t.setAttribute('position', new THREE.Float32BufferAttribute([...W3(a, Hf).toArray(), ...W3([a[0] + n[0] * D, a[1] + n[1] * D], Hf).toArray(), ...W3([a[0] + n[0] * D, a[1] + n[1] * D], Hf + alto).toArray()], 3));
        t.computeVertexNormals();
        malla(t, mMuro, g);
      }
    }
    if (tipo === 'mirador') {
      const mid = lote.mundo([lote.ancho / 2, 3]), lado = 3.4, h = 3.2;
      const torre = malla(new THREE.BoxGeometry(lado, h, lado), mMuro, g);
      torre.position.copy(W3(mid, H + .25 + h / 2)); torre.rotation.y = Math.atan2(lote.r[1], lote.r[0]);
      for (let k = 0; k < 4; k++) { // aberturas
        const v = malla(new THREE.BoxGeometry(1, 1.7, .05), mat({ color: '#22262a', roughness: .3 }), torre);
        v.position.set(Math.sin(k * Math.PI / 2) * (lado / 2 + .01), .2, Math.cos(k * Math.PI / 2) * (lado / 2 + .01)); v.rotation.y = k * Math.PI / 2;
      }
      const cup = malla(new THREE.ConeGeometry(lado * .78, 1.7, 4), mat({ map: textura('clay_roof_tiles_02', 1) }), g);
      cup.position.copy(W3(mid, H + .25 + h + .85)); cup.rotation.y = torre.rotation.y + Math.PI / 4;
    }
    if (tipo === 'jardin') {
      const rnd = azar(7), [a, b, c, d] = Geo.caja(poly);
      for (let t = 0, k = 0; t < 200 && k < 14; t++) {
        const q = [a + rnd() * (c - a), b + rnd() * (d - b)];
        if (!Geo.dentro(q, poly) || agujeros.some(h => Geo.dentro(q, h))) continue;
        arbol(g, q[0], q[1], rnd, H + .25).scale.setScalar(.45 + rnd() * .3); k++;
      }
    }
  }

  function fachada3d(g, lote, casa, anis) {
    const md = medidasFachada(casa.sel, casa.fachada), alto = md.tope / S, cad = lote.cadena, n = lote.n;
    const pos = [], uv = [], idx = [];
    let acum = 0;
    cad.forEach((c, i) => {
      if (i) acum += Math.hypot(c[0] - cad[i - 1][0], c[1] - cad[i - 1][1]);
      const q = [c[0] - n[0] * .14, c[1] - n[1] * .14];
      pos.push(...W3(q, 0).toArray(), ...W3(q, alto).toArray());
      uv.push(acum / lote.ancho, 0, acum / lote.ancho, 1);
      if (i) { const k = i * 2; idx.push(k - 2, k, k + 1, k - 2, k + 1, k - 1); }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    const m = new THREE.MeshStandardMaterial({ transparent: true, alphaTest: .3, side: THREE.DoubleSide, roughness: .85, color: '#ffffff' });
    const cinta = malla(geo, m, g, false); cinta.receiveShadow = true;
    const im = new Image();
    im.onload = () => {
      const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
      cv.getContext('2d').drawImage(im, 0, 0);
      const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = anis;
      m.map = t; m.needsUpdate = true;
    };
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(componerFachada(casa.sel, casa.fachada, { exportar: true }));
  }

  // ── escena ──
  function iniciar(contenedor, infoEl, cb) {
    el = contenedor; info = infoEl; alElegir = cb;
    THREE.ColorManagement.legacyMode = false;
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#dfe3e2');
    scene.fog = new THREE.Fog('#dfe3e2', 420, 900);
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 2000);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.maxPolarAngle = 1.35; controls.minZoom = .5; controls.maxZoom = 14; controls.screenSpacePanning = false;
    scene.add(new THREE.HemisphereLight(0xeaf2ff, 0x9a8466, .7));
    sol = new THREE.DirectionalLight(0xfff0d8, 1.6);
    sol.position.set(90, 160, 60); sol.castShadow = true;
    sol.shadow.mapSize.set(4096, 4096);
    Object.assign(sol.shadow.camera, { left: -200, right: 200, top: 200, bottom: -200, near: 10, far: 500 });
    sol.shadow.bias = -.0006; sol.shadow.normalBias = .04;
    scene.add(sol, sol.target);
    plano = new THREE.Plane(new THREE.Vector3(0, -1, 0), 100);
    scene.add(barrio());
    vista('aerea');

    const cv = renderer.domElement;
    cv.addEventListener('pointermove', e => { if (!e.buttons) apuntar(e); });
    cv.addEventListener('pointerleave', () => marcar(null));
    cv.addEventListener('pointerdown', e => { abajoEn = [e.clientX, e.clientY]; });
    cv.addEventListener('pointerup', e => {
      if (modo !== 'ciudad' || !abajoEn || Math.hypot(e.clientX - abajoEn[0], e.clientY - abajoEn[1]) > 5) return;
      apuntar(e);
      if (hover) alElegir(hover);
    });
    window.addEventListener('resize', ajustar);
    ajustar();
    (function bucle() { requestAnimationFrame(bucle); if (el.hidden) return; controls.update(); renderer.render(scene, camera); })();
  }

  function ajustar() {
    const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    const a = w / h, f = 60;
    Object.assign(camera, { left: -f * a, right: f * a, top: f, bottom: -f });
    camera.updateProjectionMatrix();
  }

  // cámaras: vista aérea del barrio, axonométrica, frente y planta del lote actual
  function vista(tipo, lote = casaActual?.lote) {
    let destino = lote ? W3(Geo.centroide(lote.polyMundo), 4) : W3(Geo.centroide(PARCELA[BARRIO.inicial].p), 0);
    let off, zoom;
    if (tipo === 'aerea') { off = new THREE.Vector3(-90, 150, 130); zoom = 1; }
    else if (tipo === 'axo' && lote) { const [n, r] = [lote.n, lote.r]; off = new THREE.Vector3(-n[0] * 55 - r[0] * 35, 110, n[1] * 55 + r[1] * 35); zoom = 3.2; } // desde la calle, en diagonal
    else if (tipo === 'axo') { off = new THREE.Vector3(-70, 90, 70); zoom = 3.2; }
    else if (tipo === 'frente') { const n = lote.n; off = new THREE.Vector3(-n[0] * 7, 0, n[1] * 7); zoom = 4; } // parado en la vereda de enfrente
    else { off = new THREE.Vector3(0, 200, .01); zoom = 3.4; }
    if (tipo === 'frente') {
      const alto = medidasFachada(casaActual.casa.sel, casaActual.casa.fachada).tope / S;
      destino = W3(lote.mundo([lote.ancho / 2, 0]), alto * .55);
      zoom = Math.min(8, 60 / Math.max(alto * 1.4, lote.ancho * .45));
    }
    camera.near = tipo === 'frente' ? .1 : -1000; // de frente, lo que queda detrás de la cámara (la vereda de enfrente) no se dibuja
    controls.target.copy(destino);
    camera.position.copy(destino).add(off);
    camera.zoom = zoom; camera.updateProjectionMatrix(); controls.update();
  }

  function apuntar(e) {
    if (modo !== 'ciudad') return;
    const r = renderer.domElement.getBoundingClientRect();
    ptr.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(marcables, false)[0];
    marcar(hit ? hit.object.userData.ref : null, e.clientX - r.left, e.clientY - r.top);
  }

  // resalta toda la parcela (o la casa del frentista que la ocupa)
  const resaltado = new THREE.MeshStandardMaterial({ color: '#f0b44c', emissive: '#7a4a00', emissiveIntensity: .55, roughness: .8, side: THREE.DoubleSide });
  function pintar(ref, on) {
    const g = casasG[ref] || porParcela[ref];
    g?.traverse(o => {
      if (!o.isMesh) return;
      if (on) { o.userData.mat ??= o.material; o.material = resaltado; } else if (o.userData.mat) o.material = o.userData.mat;
    });
  }
  function marcar(ref, x, y) {
    if (hover && hover !== ref) pintar(hover, false);
    if (ref && ref !== hover) pintar(ref, true);
    hover = ref;
    el.style.cursor = ref ? 'pointer' : '';
    if (!ref) { info.hidden = true; return; }
    const par = PARCELA[ref], pisos = Math.max(0, ...BARRIO.edificios.filter(e => e.ref === ref).map(e => e.n)), casa = Escena.casas?.[ref];
    const lote = prepararLote(ref);
    info.innerHTML = `<b>${ref === BARRIO.inicial ? 'Calle Feria 37' : 'Parcela ' + ref.slice(0, 7)}</b>
      <span>${par.a} m² · ${lote ? `frente de ${fmtM(lote.ancho)} m` : 'sin frente a la calle'} · hoy ${pisos} planta${pisos === 1 ? '' : 's'}</span>
      <em>${casa ? 'Casa de un frentista · clic para editarla' : lote ? 'Clic para construir acá' : 'No se puede construir'}</em>`;
    info.hidden = false; info.style.left = `${x + 16}px`; info.style.top = `${y + 16}px`;
  }

  // levanta las casas guardadas y oculta lo que hoy hay en esas parcelas
  function ponerCasas(casas, actual) {
    Escena.casas = casas;
    const anis = renderer.capabilities.getMaxAnisotropy();
    for (const [ref, g] of Object.entries(casasG)) { scene.remove(g); liberar(g); delete casasG[ref]; }
    for (const g of Object.values(porParcela)) g.visible = true;
    const todas = { ...casas, ...(actual ? { [actual.lote.ref]: actual.casa } : {}) };
    for (const [ref, casa] of Object.entries(todas)) {
      const lote = prepararLote(ref);
      if (!lote) continue;
      const g = construirCasa(lote, casa, anis);
      g.traverse(o => { if (o.isMesh) o.userData.ref = ref; });
      scene.add(g); casasG[ref] = g;
      if (porParcela[ref]) porParcela[ref].visible = false;
    }
    marcables.length = 0;
    for (const [ref, g] of Object.entries({ ...porParcela, ...casasG })) {
      if (!g.visible) continue;
      const c = Geo.centroide(PARCELA[ref].p);
      if (Math.hypot(c[0], c[1]) < RADIO) g.traverse(o => { if (o.isMesh) marcables.push(o); });
    }
  }
  function liberar(g) { g.traverse(o => { o.geometry?.dispose(); if (o.material && o.material !== resaltado && !Object.values(cacheTex).includes(o.material.map)) o.material.map?.dispose(); }); }

  function modoCiudad(casas) {
    modo = 'ciudad'; casaActual = null; corte(null);
    ponerCasas(casas);
    ajustar();
  }
  function modoCasa(casas, lote, casa) {
    modo = 'casa'; marcar(null);
    casaActual = { lote, casa };
    const otras = { ...casas }; delete otras[lote.ref];
    ponerCasas(otras, casaActual);
    ajustar();
  }
  function enfocar(ref) { const lote = prepararLote(ref); if (lote) vista('axo', lote); }

  function corte(y) {
    sol.castShadow = y === null;
    if (y === null) renderer.clippingPlanes = [];
    else { plano.constant = y; renderer.clippingPlanes = [plano]; }
  }
  const captura = () => renderer.domElement.toDataURL('image/png');

  return { iniciar, ajustar, vista, modoCiudad, modoCasa, enfocar, corte, captura, casas: {} };
})();
