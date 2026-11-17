export function createPublicCache<T>(ttlMs: number, clock?: () => number): {
  get(render: () => Promise<T>): Promise<{ value: T; state: string }>;
};
