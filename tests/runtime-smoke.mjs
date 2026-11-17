// Disposable local integration test. No external credentials or patient data.
import { spawn, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';

const temporary = await mkdtemp(join(tmpdir(), 'careguardian-smoke-'));
const resourcesFile = join(temporary, 'resources.json');
await writeFile(resourcesFile, await readFile('content/recursos.json'));
const backendDir = process.env.BACKEND_DIR;
assert.ok(backendDir, 'Set BACKEND_DIR to the verified backend checkout');
const env = { ...process.env, SECRET_KEY: randomBytes(48).toString('base64url'),
  DATABASE_URL: `sqlite:///${temporary}/smoke.db`, GROQ_API_KEY: '', GROQ_MODEL: '',
};
const children = [];
async function ready(url) {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(url)).ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error('Local test server did not become ready');
}
try {
  const migration = spawnSync(process.env.PYTHON || 'python',
    ['-m', 'alembic', 'upgrade', 'head'], { cwd: backendDir, env, stdio: 'inherit' });
  assert.equal(migration.status, 0);
  children.push(spawn(process.env.PYTHON || 'python',
    ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8009'],
    { cwd: backendDir, env, stdio: 'inherit' }));
  await ready('http://127.0.0.1:8009/health');
  const frontendEnv = { ...process.env, PORT: '4400', API_BASE_URL: 'http://127.0.0.1:8009',
    PUBLIC_ORIGIN: 'http://127.0.0.1:4400', PUBLIC_CACHE_TTL_SECONDS: '1',
    PUBLIC_RESOURCES_FILE: resourcesFile, RESOURCE_TEST_FILE: resourcesFile,
    FRONTEND_TEST_ORIGIN: 'http://127.0.0.1:4400' };
  children.push(spawn(process.execPath, ['dist/careguardian_front/server/server.mjs'],
    { env: frontendEnv, stdio: 'inherit' }));
  await ready('http://127.0.0.1:4400/health');
  const api = 'http://127.0.0.1:4400/api';
  const password = randomBytes(32).toString('base64url');
  const email = 'runtime-caregiver@example.org';
  const post = (path, body, token) => fetch(api + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  assert.equal((await post('/users/', { nombre: 'Prueba aislada', email, password })).status, 200);
  const login = await post('/auth/login', { email, password });
  assert.equal(login.status, 200);
  const { access_token: token } = await login.json();
  assert.equal(typeof token, 'string'); // Never print credentials in test output.
  const patientResponse = await post('/patients/', { nombres: 'Prueba', apellidos: 'Aislada',
    fecha_nacimiento: '1950-01-01', documento: 'RUNTIME-TEST-ONLY' }, token);
  assert.equal(patientResponse.status, 200);
  const { id } = await patientResponse.json();
  for (const nivel_dolor of [0, 6]) {
    assert.equal((await post(`/symptoms/patients/${id}`, { nivel_dolor }, token)).status, 200);
  }
  const authorized = { headers: { Authorization: `Bearer ${token}` } };
  const history = await fetch(`${api}/evolution/patients/${id}`, authorized);
  assert.equal(history.status, 200);
  const evolution = await history.json();
  assert.equal(evolution.metricas.nivel_dolor.cantidad, 2);
  assert.equal(evolution.metricas.nivel_dolor.promedio, 3);
  assert.equal((await post(`/evolution/patients/${id}/analyses`, {
    consentimiento: false, version_consentimiento: 'groq-minimized-v1' }, token)).status, 422);
  assert.equal((await post(`/evolution/patients/${id}/analyses`, {
    consentimiento: true, version_consentimiento: 'groq-minimized-v1' }, token)).status, 503);
  assert.equal((await fetch(`${api}/evolution/patients/${id}/analyses`, authorized)).status, 200);
  console.log('Login, assignment, real statistics, consent and missing-provider checks passed through proxy');
  const checks = spawn(process.execPath, ['tests/rendering-smoke.mjs'],
    { env: frontendEnv, stdio: 'inherit' });
  assert.equal(await new Promise(resolve => checks.once('exit', resolve)), 0);
  console.log('Disposable frontend + FastAPI runtime verification passed');
} finally {
  for (const child of children) child.kill('SIGTERM');
  await Promise.all(children.map(child => new Promise(resolve => {
    if (child.exitCode !== null) resolve(); else child.once('exit', resolve);
  })));
  await rm(temporary, { recursive: true, force: true });
}
