import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Stroke icons (24×24 grid, 1.75px) drawn for CareGuardian; no icon font or CDN. */
const PATHS: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  users: 'M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35M15.5 4.15a3.5 3.5 0 0 1 0 6.7',
  pill: 'M10.5 20.5 3.5 13.5a4.95 4.95 0 0 1 7-7l7 7a4.95 4.95 0 0 1-7 7M8.5 8.5l7 7',
  calendar: 'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 10h16M8 2v4M16 2v4',
  pulse: 'M3 12h4l2.5-6 4 12 2.5-6H21',
  note: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4',
  bell: 'M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10.3 20a1.94 1.94 0 0 0 3.4 0',
  chart: 'M4 19h16M6 15l4-5 3 3 5-7',
  shield: 'M12 21s8-3.5 8-10V5l-8-3-8 3v6c0 6.5 8 10 8 10M9 11.5l2 2 4-4',
  logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11',
  plus: 'M12 5v14M5 12h14',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14M20 20l-3.5-3.5',
  edit: 'M4 20h4L19 9a2.83 2.83 0 0 0-4-4L4 16zM13.5 6.5l4 4',
  archive: 'M3 5h18v4H3zM5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M10 13h4',
  check: 'M5 12.5 10 17l9-10',
  close: 'M6 6l12 12M18 6 6 18',
  menu: 'M4 7h16M4 12h16M4 17h16',
  warning: 'M10.3 4.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0M12 9v4M12 17h.01',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 16v-4M12 8h.01',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7v5l3 2',
  user: 'M18 20a6 6 0 0 0-12 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  chevron: 'M9 6l6 6-6 6',
  sparkles: 'M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z',
  refresh: 'M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4',
  heart: 'M12 20s-7-4.4-9-9a4.6 4.6 0 0 1 8.2-4.1L12 8l.8-1.1A4.6 4.6 0 0 1 21 11c-2 4.6-9 9-9 9',
  thermometer: 'M14 14.76V4a2 2 0 0 0-4 0v10.76a4 4 0 1 0 4 0',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5',
  lock: 'M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1M8 11V7a4 4 0 0 1 8 0v4',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
  'eye-off': 'M3 3l18 18M10.6 5.1A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-2.6 3.4M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a10 10 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2',
};

@Component({
  selector: 'cg-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', style: 'display:inline-flex' },
  template: `
    <svg viewBox="0 0 24 24" [attr.width]="size()" [attr.height]="size()" fill="none"
         stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <path [attr.d]="path()" />
    </svg>`,
})
export class Icon {
  readonly name = input.required<string>();
  readonly size = input(20);
  protected path = computed(() => PATHS[this.name()] ?? PATHS['info']);
}
