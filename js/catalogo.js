/* Catálogo de los frentistas del futuro: fragmentos fotográficos de la casa argentina (y sevillana),
   recortados de fotos libres de Wikimedia Commons. Ver CREDITOS en imagenes.js. */

const S = 40; // px por metro en la elevación

const ESTILOS = {
  colonial:      { nombre: 'Colonial',              fecha: 's. XVII–XIX', anio: 1780, color: '#9a7b4f' },
  italianizante: { nombre: 'Italianizante',         fecha: '1870–1910',   anio: 1890, color: '#b8862e' },
  frances:       { nombre: 'Academicismo francés',  fecha: '1890–1930',   anio: 1910, color: '#7d6f8f' },
  nouveau:       { nombre: 'Art Nouveau',           fecha: '1900–1915',   anio: 1907, color: '#5f8a46' },
  neocolonial:   { nombre: 'Neocolonial',           fecha: '1915–1940',   anio: 1925, color: '#b0623a' },
  deco:          { nombre: 'Art Déco',              fecha: '1925–1945',   anio: 1935, color: '#2f6c8f' },
  racionalismo:  { nombre: 'Racionalismo',          fecha: '1930–1960',   anio: 1940, color: '#6f767d' },
  pintoresco:    { nombre: 'Chalet pintoresquista', fecha: '1930–1960',   anio: 1950, color: '#8a6a3c' },
  brutalismo:    { nombre: 'Brutalismo',            fecha: '1960–1980',   anio: 1970, color: '#55585c' },
  contemporaneo: { nombre: 'Contemporáneo',         fecha: '2000–hoy',    anio: 2015, color: '#a24d36' },
  sevillano:     { nombre: 'Sevillano',             fecha: 's. XVI–1929', anio: 1880, color: '#2e7d6b' },
};

const CATEGORIAS = [
  { id: 'revestimiento', nombre: 'Revestimiento', obligatoria: true },
  { id: 'puerta',        nombre: 'Puerta',        obligatoria: true },
  { id: 'ventana',       nombre: 'Ventana',       obligatoria: true },
  { id: 'balcon',        nombre: 'Balcón' },
  { id: 'ornamento',     nombre: 'Ornamento' },
  { id: 'coronamiento',  nombre: 'Coronamiento' },
  { id: 'zocalo',        nombre: 'Zócalo' },
];
const CAT = Object.fromEntries(CATEGORIAS.map(c => [c.id, c]));

// alto: metros que ocupa la pieza en la fachada. modo (coronamiento): 'franja' se repite a lo largo, 'modulo' va una por calle
const PIEZAS = [
  // revestimientos: texturas que se repiten cada `tam` metros
  { id: 'rev-cal',       cat: 'revestimiento', estilo: 'colonial',      nombre: 'Cal blanca',            img: 'white_plaster_rough_01', tam: 2.5 },
  { id: 'rev-ocre',      cat: 'revestimiento', estilo: 'italianizante', nombre: 'Revoque ocre',          img: 'yellow_plaster', tam: 2.5 },
  { id: 'rev-paris',     cat: 'revestimiento', estilo: 'frances',       nombre: 'Símil piedra París',    img: 'beige_wall_001', tam: 2.5 },
  { id: 'rev-gris',      cat: 'revestimiento', estilo: 'deco',          nombre: 'Revoque gris',          img: 'plastered_wall_02', tam: 2.5 },
  { id: 'rev-blanco',    cat: 'revestimiento', estilo: 'racionalismo',  nombre: 'Revoque blanco liso',   img: 'white_stucco', tam: 2.5 },
  { id: 'rev-piedra',    cat: 'revestimiento', estilo: 'pintoresco',    nombre: 'Piedra Mar del Plata',  img: 'rustic_stone_wall', tam: 2.5 },
  { id: 'rev-hormigon',  cat: 'revestimiento', estilo: 'brutalismo',    nombre: 'Hormigón de encofrado', img: 'wood_textured_concrete', tam: 2.5 },
  { id: 'rev-ladrillo',  cat: 'revestimiento', estilo: 'contemporaneo', nombre: 'Ladrillo visto',        img: 'red_brick_03', tam: 2 },
  { id: 'rev-liso',      cat: 'revestimiento', estilo: 'contemporaneo', nombre: 'Hormigón liso',         img: 'concrete_wall_008', tam: 3 },
  { id: 'rev-almagra',   cat: 'revestimiento', estilo: 'sevillano',     nombre: 'Almagra sevillana',     img: 'red_plaster_weathered', tam: 2.5 },
  // puertas
  { id: 'p-col',   cat: 'puerta', estilo: 'colonial',      nombre: 'Portón de madera',                img: 'col-puerta', alto: 3 },
  { id: 'p-col2',  cat: 'puerta', estilo: 'colonial',      nombre: 'Portada con columnas salomónicas', img: 'col-portada', alto: 4.6 },
  { id: 'p-ita',   cat: 'puerta', estilo: 'italianizante', nombre: 'Puerta de casa chorizo',          img: 'ita-puerta', alto: 3.4 },
  { id: 'p-ita2',  cat: 'puerta', estilo: 'italianizante', nombre: 'Puerta con banderola',            img: 'ita-puerta2', alto: 3.4 },
  { id: 'p-fra',   cat: 'puerta', estilo: 'frances',       nombre: 'Puerta de hierro forjado',        img: 'fra-puerta2', alto: 3.4 },
  { id: 'p-fra2',  cat: 'puerta', estilo: 'frances',       nombre: 'Puerta en arco de hierro y vidrio', img: 'fra-puerta', alto: 3.6 },
  { id: 'p-nou',   cat: 'puerta', estilo: 'nouveau',       nombre: 'Puerta Art Nouveau',              img: 'nou-puerta', alto: 3.4 },
  { id: 'p-nou2',  cat: 'puerta', estilo: 'nouveau',       nombre: 'Puerta modernista en arco',       img: 'nou-puerta2', alto: 3.6 },
  { id: 'p-neo',   cat: 'puerta', estilo: 'neocolonial',   nombre: 'Portada neocolonial',             img: 'neo-portada', alto: 4.4 },
  { id: 'p-deco',  cat: 'puerta', estilo: 'deco',          nombre: 'Puerta déco con azulejos',        img: 'dec-puerta', alto: 3 },
  { id: 'p-rac',   cat: 'puerta', estilo: 'racionalismo',  nombre: 'Puerta racionalista',             img: 'rac-puerta', alto: 2.5 },
  { id: 'p-pin',   cat: 'puerta', estilo: 'pintoresco',    nombre: 'Pórtico de piedra',               img: 'pin-puerta', alto: 2.8 },
  { id: 'p-pin2',  cat: 'puerta', estilo: 'pintoresco',    nombre: 'Puerta de chalet',                img: 'pin-puerta2', alto: 2.6 },
  // ventanas
  { id: 'v-col',   cat: 'ventana', estilo: 'colonial',      nombre: 'Ventana con reja colonial',       img: 'col-ventana', alto: 2 },
  { id: 'v-ita',   cat: 'ventana', estilo: 'italianizante', nombre: 'Ventana con postigos y reja',     img: 'ita-ventana', alto: 2.6 },
  { id: 'v-fra',   cat: 'ventana', estilo: 'frances',       nombre: 'Ventana francesa con balconcito', img: 'fra-ventana', alto: 2.6 },
  { id: 'v-neo',   cat: 'ventana', estilo: 'neocolonial',   nombre: 'Ventana neocolonial',             img: 'neo-ventana', alto: 2.2 },
  { id: 'v-deco',  cat: 'ventana', estilo: 'deco',          nombre: 'Ventana déco',                    img: 'dec-ventana', alto: 1.8 },
  { id: 'v-deco2', cat: 'ventana', estilo: 'deco',          nombre: 'Ventana doble con rejas',         img: 'dec-ventana2', alto: 1.6 },
  { id: 'v-rac',   cat: 'ventana', estilo: 'racionalismo',  nombre: 'Ventana con persiana de enrollar', img: 'rac-ventana', alto: 1.6 },
  { id: 'v-pin',   cat: 'ventana', estilo: 'pintoresco',    nombre: 'Ventana de chalet con postigos',  img: 'pin-ventana', alto: 1.4 },
  { id: 'v-bru',   cat: 'ventana', estilo: 'brutalismo',    nombre: 'Módulo de hormigón',              img: 'bru-ventana', alto: 2.2 },
  { id: 'v-sev',   cat: 'ventana', estilo: 'sevillano',     nombre: 'Ventana sevillana con reja',      img: 'sev-ventana', alto: 2.6 },
  { id: 'v-sev2',  cat: 'ventana', estilo: 'sevillano',     nombre: 'Ventana con marco de azulejos',   img: 'sev-ventana2', alto: 2.4 },
  // balcones (pisos altos)
  { id: 'b-ita',   cat: 'balcon', estilo: 'italianizante', nombre: 'Balcón italianizante', img: 'ita-balcon', alto: 3 },
  { id: 'b-fra',   cat: 'balcon', estilo: 'frances',       nombre: 'Balcón de hierro',     img: 'fra-balcon', alto: 2.8 },
  { id: 'b-deco',  cat: 'balcon', estilo: 'deco',          nombre: 'Bow-window déco',      img: 'dec-balcon', alto: 2.6 },
  { id: 'b-sev',   cat: 'balcon', estilo: 'sevillano',     nombre: 'Balcón sevillano',     img: 'sev-balcon', alto: 2.8 },
  // ornamentos sobre las aberturas
  { id: 'o-ita',   cat: 'ornamento', estilo: 'italianizante', nombre: 'Guardapolvo con cartela', img: 'ita-dintel', alto: .9 },
  // coronamientos
  { id: 'c-ita',   cat: 'coronamiento', estilo: 'italianizante', nombre: 'Cornisa con ménsulas',     img: 'ita-coronamiento', alto: .9, modo: 'franja' },
  { id: 'c-fra',   cat: 'coronamiento', estilo: 'frances',       nombre: 'Cornisa académica',        img: 'fra-cornisa', alto: .8, modo: 'franja' },
  { id: 'c-fra2',  cat: 'coronamiento', estilo: 'frances',       nombre: 'Buhardilla con ojo de buey', img: 'fra-buhardilla', alto: 2, modo: 'modulo' },
  { id: 'c-pin',   cat: 'coronamiento', estilo: 'pintoresco',    nombre: 'Alero de tejas',           img: 'pin-tejas', alto: .9, modo: 'franja' },
  { id: 'c-sev',   cat: 'coronamiento', estilo: 'sevillano',     nombre: 'Pretil sevillano',         img: 'sev-coronamiento', alto: 1.3, modo: 'franja' },
  // zócalos
  { id: 'z-sev',   cat: 'zocalo', estilo: 'sevillano',  nombre: 'Zócalo de azulejos', img: 'sev-zocalo', alto: .9 },
  { id: 'z-pin',   cat: 'zocalo', estilo: 'pintoresco', nombre: 'Zócalo de piedra',   img: 'pin-piedra', alto: .9 },
  { id: 'z-deco',  cat: 'zocalo', estilo: 'deco',       nombre: 'Zócalo de granito',  img: 'granite_tile', alto: .9 },
];
const PIEZA = Object.fromEntries(PIEZAS.map(p => [p.id, p]));

// techos que se eligen al ver la volumetría
const TECHOS = [
  { id: 'azotea',  nombre: 'Azotea encalada',     estilo: 'sevillano' },
  { id: 'teja',    nombre: 'Tejado de teja árabe',  estilo: 'colonial' },
  { id: 'pizarra', nombre: 'Mansarda de pizarra',   estilo: 'frances' },
  { id: 'mirador', nombre: 'Azotea con mirador',    estilo: 'italianizante' },
  { id: 'jardin',  nombre: 'Terraza jardín',        estilo: 'racionalismo' },
];

const f2 = v => +(+v).toFixed(2);
let _uid = 0;
const uid = p => `${p}${++_uid}`;
const img = id => IMAGENES[id];
