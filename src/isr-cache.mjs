// One fixed public route only. Never use request/user input as cache content or key.
export function createPublicCache(ttlMs, clock = Date.now) {
  let entry;
  let pending;
  let retryAt = 0;
  const regenerate = render => {
    if (!pending) {
      pending = Promise.resolve().then(render).then(value => {
        entry = { value, at: clock() };
        retryAt = 0;
        return value;
      }).catch(error => {
        retryAt = clock() + 5000;
        throw error;
      }).finally(() => { pending = undefined; });
    }
    return pending;
  };
  return {
    async get(render) {
      if (!entry) return { value: await regenerate(render), state: 'MISS' };
      if (clock() - entry.at < ttlMs) return { value: entry.value, state: 'HIT' };
      if (clock() >= retryAt) void regenerate(render).catch(() => {});
      return { value: entry.value, state: 'STALE' };
    },
  };
}
