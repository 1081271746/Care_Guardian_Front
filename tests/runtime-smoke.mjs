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
