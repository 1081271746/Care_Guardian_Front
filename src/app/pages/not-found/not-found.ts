import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: grid; place-items: center; min-height: 100vh; padding: 24px; }
    .box { max-width: 440px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 14px; }
    .code { font-family: var(--cg-font-display); font-size: 4rem; line-height: 1; color: var(--cg-primary); }
    cg-icon { color: var(--cg-accent); }
  `,
  template: `
    <div class="box">
      <cg-icon name="search" [size]="36" />
      <p class="code">404</p>
      <h1>No encontramos esa página</h1>
      <p class="soft">Puede que el enlace esté incompleto o que la página ya no exista.</p>
      <div class="row">
        <a routerLink="/dashboard" class="btn btn-primary">Ir al panel</a>
        <a routerLink="/privacidad" class="btn btn-secondary">Privacidad</a>
      </div>
    </div>`,
})
export class NotFound {}
