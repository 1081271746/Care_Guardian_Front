import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ConnectionBanner } from './shared/connection-banner';
import { Toasts } from './shared/toasts';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toasts, ConnectionBanner],
  template: `<cg-connection-banner /><router-outlet /><cg-toasts />`,
})
export class App {}
