import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { formatDateTime } from '../services/format';

export interface ChartPoint { fecha: string; valor: number }
export interface PlottedPoint { x: number; y: number; label: string; valor: number }

export const CHART = { width: 640, height: 220, left: 40, right: 16, top: 16, bottom: 34 };

/**
 * Plots real measurements only. X is proportional to the actual time between
 * records (irregular gaps stay visible); nothing is interpolated or smoothed.
 */
export function plot(points: ChartPoint[], min: number, max: number): PlottedPoint[] {
  const valid = points
    .filter(p => Number.isFinite(p.valor) && !Number.isNaN(Date.parse(p.fecha)))
    .sort((a, b) => Date.parse(a.fecha) - Date.parse(b.fecha));
  if (!valid.length) return [];
  const low = Math.min(min, ...valid.map(p => p.valor));
  const high = Math.max(max, ...valid.map(p => p.valor));
  const first = Date.parse(valid[0].fecha);
  const span = Date.parse(valid[valid.length - 1].fecha) - first;
  const plotW = CHART.width - CHART.left - CHART.right;
  const plotH = CHART.height - CHART.top - CHART.bottom;
  return valid.map(p => ({
    x: CHART.left + (span ? ((Date.parse(p.fecha) - first) / span) * plotW : plotW / 2),
    y: CHART.top + (high === low ? plotH / 2 : (1 - (p.valor - low) / (high - low)) * plotH),
    label: formatDateTime(p.fecha),
    valor: p.valor,
  }));
}

@Component({
  selector: 'cg-line-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    svg { width: 100%; height: auto; overflow: visible; }
    .grid line { stroke: var(--cg-line); stroke-dasharray: 3 4; }
    .axis { font: 11px var(--cg-font-body); fill: var(--cg-ink-muted); }
    .link { fill: none; stroke-width: 2; opacity: 0.45; }
    .dot { stroke: #fff; stroke-width: 2; }
  `,
  template: `
    <svg [attr.viewBox]="'0 0 ' + chart.width + ' ' + chart.height" role="img" [attr.aria-label]="summary()">
      <g class="grid">
        @for (tick of ticks(); track tick.value) {
          <line [attr.x1]="chart.left" [attr.x2]="chart.width - chart.right" [attr.y1]="tick.y" [attr.y2]="tick.y" />
          <text class="axis" [attr.x]="chart.left - 8" [attr.y]="tick.y + 4" text-anchor="end">{{ tick.value }}</text>
        }
      </g>
      @if (plotted().length > 1) {
        <polyline class="link" [attr.points]="line()" [attr.stroke]="color()" />
      }
      @for (point of plotted(); track $index) {
        <circle class="dot" [attr.cx]="point.x" [attr.cy]="point.y" r="5" [attr.fill]="color()">
          <title>{{ point.label }}: {{ point.valor }}{{ unit() }}</title>
        </circle>
      }
      @if (plotted().length) {
        <text class="axis" [attr.x]="chart.left" [attr.y]="chart.height - 8">{{ firstLabel() }}</text>
        <text class="axis" [attr.x]="chart.width - chart.right" [attr.y]="chart.height - 8" text-anchor="end">{{ lastLabel() }}</text>
      }
    </svg>`,
})
export class LineChart {
  readonly points = input.required<ChartPoint[]>();
  readonly min = input(0);
  readonly max = input(10);
  readonly unit = input('');
  readonly color = input('var(--cg-series-1)');
  readonly title = input('Mediciones');

  protected chart = CHART;
  readonly plotted = computed(() => plot(this.points(), this.min(), this.max()));
  protected line = computed(() => this.plotted().map(p => `${p.x},${p.y}`).join(' '));
  protected firstLabel = computed(() => this.plotted()[0]?.label.split(',')[0] ?? '');
  protected lastLabel = computed(() => this.plotted().at(-1)?.label.split(',')[0] ?? '');
  protected ticks = computed(() => {
    const values = this.points().map(p => p.valor);
    const low = Math.min(this.min(), ...values);
    const high = Math.max(this.max(), ...values);
    const plotH = CHART.height - CHART.top - CHART.bottom;
    return [high, (high + low) / 2, low].map(value => ({
      value: Math.round(value * 10) / 10,
      y: CHART.top + (high === low ? plotH / 2 : (1 - (value - low) / (high - low)) * plotH),
    }));
  });
  protected summary = computed(() =>
    `${this.title()}: ${this.plotted().length} mediciones reales` +
    (this.plotted().length ? `, de ${this.plotted()[0].valor} a ${this.plotted().at(-1)!.valor}${this.unit()}` : ''));
}
