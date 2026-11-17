// Run against the built Node server, never a production instance with patient data.
import assert from 'node:assert/strict';
const origin = process.env.FRONTEND_TEST_ORIGIN || 'http://127.0.0.1:4000';
for (const [path, title, mode] of [
  ['/acerca', 'Acompañamiento para cuidadores', 'SSR'],
  ['/privacidad', 'Privacidad y uso responsable de IA', 'SSG'],
  ['/recursos', 'Recursos para el cuidado', 'ISR-equivalent'],
]) {
  const response = await fetch(origin + path);
  const html = await response.text();
  assert.equal(response.status, 200, path);
  assert.ok(html.includes(title), path + ' contains server-generated title');
  assert.equal(response.headers.get('x-rendering-mode'), mode);
  assert.ok(response.headers.get('cache-control').includes('no-store'));
}
for (const path of ['/evolucion?patientId=900', '/dashboard/900', '/pacientes']) {
  const response = await fetch(origin + path);
  const html = await response.text();
  assert.equal(response.status, 200, path);
  assert.equal(response.headers.get('x-rendering-mode'), 'CSR');
  assert.ok(!html.includes('PRIVATE-FREE-TEXT'));
  assert.ok(!html.includes('Evolución del adulto mayor'), 'private component is not server-rendered');
}
const first = await fetch(origin + '/recursos');
const second = await fetch(origin + '/recursos?ignored=1', {
  headers: { Cookie: 'test-cookie=not-private-data', Authorization: 'Bearer test-only-invalid' },
});
assert.equal(await first.text(), await second.text(), 'request headers/query cannot poison public HTML');
assert.ok(['HIT', 'STALE'].includes(second.headers.get('x-public-cache')));
const proxy = await fetch(origin + '/api/evolution/patients/900');
assert.ok([401, 403].includes(proxy.status), 'API proxy reaches backend auth');
assert.ok(proxy.headers.get('cache-control').includes('no-store'));
console.log('Rendering and API proxy smoke checks passed');

if (process.env.RESOURCE_TEST_FILE) {
  const { readFile, writeFile } = await import('node:fs/promises');
  const path = process.env.RESOURCE_TEST_FILE;
  const original = await readFile(path, 'utf8');
  try {
    const data = JSON.parse(original);
    data.version = 'smoke-regenerated';
    await writeFile(path, JSON.stringify(data));
    // Start the test server with PUBLIC_CACHE_TTL_SECONDS=1.
    await new Promise(resolve => setTimeout(resolve, 1100));
    const stale = await fetch(origin + '/recursos');
    assert.equal(stale.headers.get('x-public-cache'), 'STALE');
    let updated = false;
    for (let i = 0; i < 20 && !updated; i++) {
      await new Promise(resolve => setTimeout(resolve, 150));
      updated = (await (await fetch(origin + '/recursos')).text()).includes('smoke-regenerated');
    }
    assert.ok(updated, 'public content regenerates without rebuilding the app');
    console.log('Live incremental regeneration check passed');
  } finally { await writeFile(path, original); }
}
