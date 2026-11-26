import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { Notifier } from '../services/notifier';
import { Icon } from './icon';

@Component({
  selector: 'cg-toasts',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { position: fixed; right: 20px; bottom: 20px; z-index: 50; display: flex; flex-direction: column; gap: 10px; max-width: min(380px, calc(100vw - 40px)); }
    .toast { display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: 12px;
      background: var(--cg-ink); color: #fff; box-shadow: var(--cg-shadow); font-size: var(--cg-text-sm);
      animation: cg-rise .25s var(--cg-ease) both; }
    .toast.success cg-icon { color: #8fd6a9; }
    .toast.error { background: #7c241f; }
    .toast p { flex: 1; }
    button { background: none; border: 0; color: inherit; opacity: .7; cursor: pointer; padding: 0; }
  `,
  template: `
    <div aria-live="polite" aria-atomic="false">
      @for (toast of notifier.toasts(); track toast.id) {
        <div class="toast" [class]="'toast ' + toast.kind" role="status">
          <cg-icon [name]="toast.kind === 'error' ? 'warning' : toast.kind === 'success' ? 'check' : 'info'" />
          <p>{{ toast.text }}</p>
          <button type="button" (click)="notifier.dismiss(toast.id)" aria-label="Cerrar aviso"><cg-icon name="close" [size]="16" /></button>
        </div>
      }
    </div>`,
})
export class Toasts {
  protected notifier = inject(Notifier);
}
