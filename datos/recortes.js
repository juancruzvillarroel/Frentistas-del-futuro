/* Fuentes del catálogo: recortes de fotos libres (Wikimedia Commons) y texturas CC0 (Poly Haven).
   r = recorte en fracciones de la foto [x0, y0, x1, y1]; forma 'arco' recorta la parte superior en medio punto. */
const RECORTES = [
  // Colonial
  { id: 'col-puerta', f: 'AR Tucuman 0610 001 (17190455306).jpg', r: [.395, .355, .635, .845] },
  { id: 'col-portada', f: 'AR Tucuman 0610 001 (17190455306).jpg', r: [.285, .02, .75, .87] },
  { id: 'col-ventana', f: 'AR Tucuman 0610 001 (17190455306).jpg', r: [.145, .47, .285, .765] },
  // Italianizante
  { id: 'ita-puerta', f: 'Casa Chorizo Corto.jpg', r: [.265, .39, .39, .89], forma: 'arco' },
  { id: 'ita-puerta2', f: '22122012-P1000867 (8337435956).jpg', r: [.40, .215, .74, .835] },
  { id: 'ita-ventana', f: 'Casa Chorizo Corto.jpg', r: [.437, .375, .603, .79], forma: 'arco' },
  { id: 'ita-dintel', f: 'Casa Chorizo Corto.jpg', r: [.43, .29, .615, .39] },
  { id: 'ita-coronamiento', f: 'Casa Chorizo Corto.jpg', r: [.63, .095, .90, .225] },
  { id: 'ita-balcon', f: 'Pasaje San Lorenzo 374, casa, balcón.jpg', r: [.19, .13, .50, .93] },
  // Academicismo francés
  { id: 'fra-puerta', f: '22122012-P1000930 (8336386573).jpg', r: [.31, .075, .80, .89], forma: 'arco' },
  { id: 'fra-puerta2', f: '22122012-P1010004 (8337457500).jpg', r: [.28, .14, .635, .805] },
  { id: 'fra-balcon', f: 'Callao street, BA 11.JPG', r: [.14, .345, .435, .578] },
  { id: 'fra-ventana', f: 'Callao street, BA 11.JPG', r: [.125, .62, .445, .885] },
  { id: 'fra-buhardilla', f: 'Callao street, BA 11.JPG', r: [.205, .09, .45, .235] },
  { id: 'fra-cornisa', f: 'Callao street, BA 11.JPG', r: [.14, .255, .34, .318] },
  // Art Nouveau
  { id: 'nou-puerta', f: 'Art Nouveau door Recoleta.jpg', r: [.2, 0, .8, .94] },
  { id: 'nou-puerta2', f: '22122012-P1000979 (8337453112).jpg', r: [.29, .14, .84, .85], forma: 'arco' },
  // Art Déco
  { id: 'dec-puerta', f: 'Hacia Wes.jpg', r: [.32, .24, .81, .985] },
  { id: 'dec-ventana', f: 'Aguero 2038 2042 arq 11.jpg', r: [.295, .23, .40, .475] },
  { id: 'dec-balcon', f: 'Aguero 2038 2042 arq 11.jpg', r: [.42, .325, .66, .74] },
  { id: 'dec-ventana2', f: 'Aguero 2038 2042 arq 11.jpg', r: [.09, .70, .395, 1] },
  // Neocolonial
  { id: 'neo-portada', f: 'Fachada del Palacio Noel.jpg', r: [.43, .14, .76, .89] },
  { id: 'neo-ventana', f: 'Fachada del Palacio Noel.jpg', r: [.83, .45, .975, .78] },
  // Pintoresquismo (chalet marplatense)
  { id: 'pin-puerta', f: 'Chalet Derqui-facade.jpg', r: [.17, .40, .40, .91] },
  { id: 'pin-puerta2', f: 'Chalet luminoso.jpg', r: [.49, .37, .585, .765] },
  { id: 'pin-ventana', f: 'Chalet Derqui-facade.jpg', r: [.51, .47, .87, .68] },
  { id: 'pin-tejas', f: 'Chalet Derqui-facade.jpg', r: [.30, .13, .90, .32] },
  { id: 'pin-piedra', f: 'Chalet Derqui-facade.jpg', r: [.42, .71, .94, .88] },
  // Racionalismo
  { id: 'rac-ventana', f: 'Casa en Monteagudo - Florencio Varela.JPG', r: [.22, .42, .385, .66] },
  { id: 'rac-puerta', f: 'Casa en Monteagudo - Florencio Varela.JPG', r: [.53, .41, .615, .70] },
  // Brutalismo
  { id: 'bru-ventana', f: 'Contra frente.jpg', r: [.60, .575, .75, .735] },
  // Sevilla
  { id: 'sev-ventana', f: 'Ventana con reja.jpg', r: [.07, .05, .93, .905], forma: 'arco' },
  { id: 'sev-ventana2', f: 'Columnas y ventana con rejas.JPG', r: [.22, .24, .86, .87] },
  { id: 'sev-balcon', f: 'Calle feria sevillana electricidad anibal g 2008001.jpg', r: [.15, .49, .30, .665] },
  { id: 'sev-coronamiento', f: 'Calle feria sevillana electricidad anibal g 2008001.jpg', r: [.06, .20, .94, .30] },
  { id: 'sev-zocalo', f: 'Zócalo del Patio del Aljibe, Museo de Bellas Artes de Sevilla.jpg', r: [0, .3, 1, .93] },
];

// texturas CC0 de Poly Haven (se bajan a 1k y se achican a 512 px)
const TEXTURAS = [
  'white_plaster_rough_01', 'yellow_plaster', 'plastered_wall_02', 'beige_wall_001', 'white_stucco', 'red_plaster_weathered',
  'rustic_stone_wall', 'red_brick_03', 'wood_textured_concrete', 'concrete_wall_008', 'granite_tile',
  'clay_roof_tiles_02', 'roof_slates_02', 'terracotta_floor_tiles', 'checkered_pavement_tiles',
  'asphalt_02', 'cobblestone_floor_09', 'patterned_paving', 'sparse_grass',
];
