// Servidor local para las herramientas de datos/ (recortar.html guarda archivos con POST /guardar). Uso: node datos/servidor.js  → http://localhost:5173
const http = require('http'), fs = require('fs'), path = require('path');
const root = require('path').join(__dirname, '..');
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json' };
http.createServer((req, res) => {
  const ruta = decodeURIComponent(req.url.split('?')[0]);
  // POST /guardar?nombre=carpeta/archivo  body: data URL o texto
  if (req.method === 'POST' && ruta === '/guardar') {
    const nombre = new URL(req.url, 'http://x').searchParams.get('nombre');
    if (!nombre || nombre.includes('..')) { res.writeHead(400); return res.end(); }
    let cuerpo = '';
    req.on('data', d => cuerpo += d).on('end', () => {
      const destino = path.join(root, 'datos', nombre);
      fs.mkdirSync(path.dirname(destino), { recursive: true });
      const m = cuerpo.match(/^data:[^;]+;base64,(.*)$/s);
      fs.writeFileSync(destino, m ? Buffer.from(m[1], 'base64') : cuerpo);
      res.writeHead(200); res.end('ok');
    });
    return;
  }
  const f = path.join(root, ruta === '/' ? 'index.html' : ruta);
  fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': (tipos[path.extname(f)] || 'application/octet-stream') + '; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(d); });
}).listen(5173);
