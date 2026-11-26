import { CHART, plot } from './line-chart';

describe('plot', () => {
  it('spaces irregular timestamps proportionally to real time', () => {
    const points = plot([
      { fecha: '2026-01-01T00:00:00Z', valor: 0 },
      { fecha: '2026-01-02T00:00:00Z', valor: 5 },
      { fecha: '2026-01-11T00:00:00Z', valor: 10 },
    ], 0, 10);
    expect(points[1].x - points[0].x).toBeCloseTo((points[2].x - points[0].x) / 10);
    expect(points[0].y).toBe(CHART.height - CHART.bottom);
    expect(points[2].y).toBe(CHART.top);
  });

  it('sorts chronologically and drops invalid points instead of inventing values', () => {
    const points = plot([
      { fecha: '2026-01-05T00:00:00Z', valor: 3 },
      { fecha: 'no-es-fecha', valor: 4 },
      { fecha: '2026-01-01T00:00:00Z', valor: Number.NaN },
      { fecha: '2026-01-02T00:00:00Z', valor: 1 },
    ], 0, 10);
    expect(points.map(p => p.valor)).toEqual([1, 3]);
  });

  it('centres a single measurement', () => {
    const [only] = plot([{ fecha: '2026-01-01T00:00:00Z', valor: 37 }], 35, 41);
    expect(only.x).toBeCloseTo(CHART.left + (CHART.width - CHART.left - CHART.right) / 2);
  });
});
