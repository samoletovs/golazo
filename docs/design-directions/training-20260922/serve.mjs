import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.CONCEPT_PORT || 4317);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.png': 'image/png' };
const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405).end();
    return;
  }
  let path;
  try {
    path = decodeURIComponent(new URL(request.url, `http://127.0.0.1:${port}`).pathname);
  } catch {
    response.writeHead(400).end();
    return;
  }
  const file = resolve(root, `.${path === '/' ? '/clubhouse.html' : path}`);
  if (!file.startsWith(`${root}${sep}`) || !mime[extname(file)]) {
    response.writeHead(404).end();
    return;
  }
  try {
    const content = await readFile(file);
    response.writeHead(200, {
      'Content-Type': mime[extname(file)],
      'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'self'; connect-src 'none'; img-src 'self' data:; font-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      'X-Content-Type-Options': 'nosniff',
      'X-Concept-Source': execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch {
    response.writeHead(404).end('Not found');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Local-only concepts: http://127.0.0.1:${port}/clubhouse.html and /companion.html`));
