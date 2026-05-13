import { createServer } from 'node:http';
import { existsSync, createReadStream } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { loadApps } from './repository.js';
import { refreshApps } from './ingest.js';

const publicDir = resolve('public');
const port = Number(process.env.PORT || 4317);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function serveStatic(req, res) {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = pathname === '/' ? join(publicDir, 'index.html') : join(publicDir, pathname);
  if (!file.startsWith(publicDir) || !existsSync(file)) return false;
  res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
  return true;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname === '/health') return sendJson(res, 200, { ok: true });
    if (url.pathname === '/api/apps' && req.method === 'GET') return sendJson(res, 200, { apps: loadApps() });
    if (url.pathname.startsWith('/api/apps/') && req.method === 'GET') {
      const id = decodeURIComponent(url.pathname.split('/').pop());
      const app = loadApps().find((item) => item.id === id);
      return app ? sendJson(res, 200, { app }) : sendJson(res, 404, { error: 'not_found' });
    }
    if (url.pathname === '/api/refresh' && req.method === 'POST') {
      const apps = await refreshApps({ mode: url.searchParams.get('mode') || 'fixture' });
      return sendJson(res, 200, { ok: true, apps });
    }
    if (serveStatic(req, res)) return;
    sendJson(res, 404, { error: 'not_found' });
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) });
  }
});

await refreshApps({ mode: 'fixture' });
server.listen(port, () => console.log('Consumer App Radar listening on :' + port));
