import { AngularNodeAppEngine, createNodeRequestHandler, isMainModule, writeResponseToNodeResponse } from '@angular/ssr/node';
import express from 'express';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPublicCache } from './isr-cache.mjs';

const app = express();
app.disable('x-powered-by');
const publicOrigin = process.env['PUBLIC_ORIGIN'] || 'http://localhost';
const allowedHosts = [
  'localhost', '127.0.0.1', new URL(publicOrigin).hostname,
  process.env['RAILWAY_PUBLIC_DOMAIN'],
  ...(process.env['NG_ALLOWED_HOSTS'] || '').split(','),
].filter((host): host is string => !!host?.trim()).map(host => host.trim());
const angularApp = new AngularNodeAppEngine({ allowedHosts });
const browserDistFolder = resolve(dirname(fileURLToPath(import.meta.url)), '../browser');
const ttl = Math.max(1, Number(process.env['PUBLIC_CACHE_TTL_SECONDS'] || 300)) * 1000;
const cache = createPublicCache<{ html: string }>(ttl);

async function publicContent() {
  const parsed = JSON.parse(await readFile(
    process.env['PUBLIC_RESOURCES_FILE'] || resolve('content/recursos.json'), 'utf8'
  ));
  if (typeof parsed.version !== 'string' || !Array.isArray(parsed.items) ||
      parsed.items.some((i: any) => typeof i.title !== 'string' || typeof i.text !== 'string')) {
    throw new Error('Invalid public resources');
  }
  return { ...parsed, generatedAt: new Date().toISOString() };
}

app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/public/resources', async (_req, res) => {
  try { res.json(await publicContent()); }
  catch { res.status(503).json({ detail: 'Recursos no disponibles' }); }
});
// Same-origin API proxy. No browser build-time API URL and no secrets in JS bundles.
app.use('/api', express.raw({ type: () => true, limit: '1mb' }), async (req, res) => {
  const base = process.env['API_BASE_URL'];
  if (!base) { res.status(503).json({ detail: 'API no configurada' }); return; }
  try {
    const target = new URL(base);
    if (!['http:', 'https:'].includes(target.protocol)) throw new Error('Invalid API URL');
    // Do not allow a path or query to replace the trusted upstream origin.
    const path = req.originalUrl.slice(4);
    if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
      res.status(400).end(); return;
    }
    const headers: Record<string, string> = {};
    if (req.headers.authorization) headers['Authorization'] = req.headers.authorization;
    if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type'];
    // The API throttles failed logins per client address: pass the real one along.
    const forwarded = [req.headers['x-forwarded-for'], req.socket.remoteAddress]
      .flat().filter((value): value is string => !!value).join(', ');
    if (forwarded) headers['X-Forwarded-For'] = forwarded;
    const requestId = req.headers['x-request-id'];
    if (typeof requestId === 'string' && /^[A-Za-z0-9]{1,64}$/.test(requestId)) headers['X-Request-ID'] = requestId;
    const upstream = await fetch(target.origin + path, {
      method: req.method, headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
      signal: AbortSignal.timeout(125000), redirect: 'manual',
    });
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    for (const name of ['retry-after', 'x-request-id', 'www-authenticate']) {
      const value = upstream.headers.get(name);
      if (value) res.setHeader(name, value);
    }
    res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch { res.status(502).json({ detail: 'No fue posible contactar con el backend' }); }
});
app.get('/recursos', async (_req, res) => {
  try {
    const cached = await cache.get(async () => {
      // A new header-free request prevents cookies, authorization and host/query poisoning.
      const response = await angularApp.handle(new Request(`${publicOrigin}/recursos`),
        { publicContent: await publicContent() });
      if (!response || response.status !== 200 || response.headers.has('set-cookie')) {
        throw new Error('Public rendering failed');
      }
      return { html: await response.text() };
    });
    res.setHeader('X-Rendering-Mode', 'ISR-equivalent');
    res.setHeader('X-Public-Cache', cached.state);
    res.type('html').send(cached.value.html);
  } catch { res.status(503).send('Recursos públicos temporalmente no disponibles'); }
});
app.use(express.static(browserDistFolder, { maxAge: '1y', index: false, redirect: false }));
app.use((req, res, next) => {
  res.setHeader('X-Rendering-Mode', req.path === '/acerca' ? 'SSR' : req.path === '/privacidad' ? 'SSG' : 'CSR');
  angularApp.handle(req).then(response => {
    if (response) writeResponseToNodeResponse(response, res);
    else next();
  }).catch(next);
});

if (isMainModule(import.meta.url)) {
  app.listen(Number(process.env['PORT'] || 4000), '0.0.0.0');
}
export const reqHandler = createNodeRequestHandler(app);
