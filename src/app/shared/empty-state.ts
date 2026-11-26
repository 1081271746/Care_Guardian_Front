import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Icon } from './icon';

@Component({
  selector: 'cg-empty',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty" role="status">
      <cg-icon [name]="icon()" [size]="40" />
      <strong>{{ title() }}</strong>
      @if (text()) { <span class="small">{{ text() }}</span> }
      <ng-content />
    </div>`,
})
export class EmptyState {
  readonly icon = input('info');
  readonly title = input.required<string>();
  readonly text = input('');
}
