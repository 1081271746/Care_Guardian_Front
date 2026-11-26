import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface Bar { label: string; value: number; title?: string }

/** Simple vertical bars for counts (e.g. symptom records per day). */
@Component({
  selector: 'cg-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .bars { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; align-items: end; gap: 6px; height: 140px; }
    .bar { position: relative; display: flex; flex-direction: column; justify-content: flex-end; height: 100%; }
    .fill { border-radius: 6px 6px 2px 2px; background: var(--cg-primary); min-height: 2px; transition: height .4s var(--cg-ease); }
    .fill.zero { background: var(--cg-line); }
    .value { font-size: 11px; text-align: center; color: var(--cg-ink-soft); margin-bottom: 4px; font-variant-numeric: tabular-nums; }
    .labels { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 6px; margin-top: 6px; }
    .labels span { font-size: 10.5px; text-align: center; color: var(--cg-ink-muted); overflow: hidden; white-space: nowrap; }
  `,
  template: `
    <div class="bars" role="img" [attr.aria-label]="summary()">
      @for (bar of bars(); track bar.label) {
        <div class="bar" [title]="bar.title ?? bar.label + ': ' + bar.value">
          @if (bar.value) { <span class="value">{{ bar.value }}</span> }
          <div class="fill" [class.zero]="!bar.value" [style.height.%]="(bar.value / max()) * 100"></div>
        </div>
      }
    </div>
    <div class="labels" aria-hidden="true">
      @for (bar of bars(); track bar.label; let i = $index) {
        <span>{{ i % labelEvery() === 0 ? bar.label : '' }}</span>
      }
    </div>`,
})
export class BarChart {
  readonly bars = input.required<Bar[]>();
  readonly description = input('Registros por día');
  protected max = computed(() => Math.max(1, ...this.bars().map(b => b.value)));
  protected labelEvery = computed(() => (this.bars().length > 10 ? 2 : 1));
  protected summary = computed(() =>
    `${this.description()}: ${this.bars().map(b => `${b.label} ${b.value}`).join(', ')}`);
}
