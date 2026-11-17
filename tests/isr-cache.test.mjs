import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPublicCache } from '../src/isr-cache.mjs';

test('cache generates once, hits and deduplicates concurrent requests', async () => {
  let calls = 0;
  const cache = createPublicCache(1000);
  const render = async () => { calls++; return { html: '<h1>Public</h1>' }; };
  const results = await Promise.all([cache.get(render), cache.get(render)]);
  assert.equal(calls, 1);
  assert.equal(results[0].state, 'MISS');
  assert.equal((await cache.get(render)).state, 'HIT');
});

test('stale content survives failed regeneration and recovers without rebuilding', async () => {
  let now = 0;
  let version = 1;
  let fail = false;
  const cache = createPublicCache(100, () => now);
  const render = async () => { if (fail) throw Error('failure'); return version; };
  assert.equal((await cache.get(render)).value, 1);
  now = 101; fail = true;
  assert.equal((await cache.get(render)).state, 'STALE');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal((await cache.get(render)).value, 1);
  now = 6000; fail = false; version = 2;
  await cache.get(render);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal((await cache.get(render)).value, 2);
});
