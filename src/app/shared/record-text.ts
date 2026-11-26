import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const DEMO_MARKER = /^CG-DEMO-[\w-]+?-\d{4}\s*·\s*/;

/** Separates the demo-data marker (CG-DEMO-…) from the readable text. */
export function splitDemo(value: string | null | undefined): { demo: boolean; text: string; marker: string } {
  const text = value ?? '';
  const match = text.match(DEMO_MARKER);
  return match
    ? { demo: true, text: text.slice(match[0].length), marker: match[0].replace(/\s*·\s*$/, '') }
    : { demo: false, text, marker: '' };
}

/**
 * Renders stored free text. Demo records keep being clearly identified
 * (badge + marker in the tooltip) without the long marker cluttering the UI.
 */
@Component({
  selector: 'cg-record-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `.demo { margin-right: 6px; vertical-align: 1px; font-size: 10.5px; padding: 1px 7px; }`,
  template: `@if (parts().demo) {<span class="badge plain badge-muted demo" [title]="parts().marker">Demo</span>}{{ parts().text }}`,
})
export class RecordText {
  readonly value = input<string | null | undefined>('');
  protected parts = computed(() => splitDemo(this.value()));
}
