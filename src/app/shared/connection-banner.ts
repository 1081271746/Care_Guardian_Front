import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';

import { Icon } from './icon';

/** Warns when the device goes offline so caregivers know saves will fail. */
@Component({
  selector: 'cg-connection-banner',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .offline { position: fixed; left: 50%; top: 12px; transform: translateX(-50%); z-index: 60;
      display: flex; gap: 8px; align-items: center; padding: 10px 16px; border-radius: 999px;
      background: var(--cg-ink); color: #fff; font-size: var(--cg-text-sm); box-shadow: var(--cg-shadow); }
  `,
  template: `
    @if (offline()) {
      <div class="offline" role="alert"><cg-icon name="warning" [size]="18" />
        Sin conexión: los cambios no se guardarán hasta que vuelva internet.</div>
    }`,
})
export class ConnectionBanner {
  readonly offline = signal(typeof navigator !== 'undefined' && navigator.onLine === false);

  constructor() {
    if (typeof window === 'undefined') return;
    const update = () => this.offline.set(!navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    });
  }
}
