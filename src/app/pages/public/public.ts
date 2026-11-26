import { ChangeDetectionStrategy, Component, REQUEST_CONTEXT, TransferState, afterNextRender, inject, makeStateKey, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Icon } from '../../shared/icon';

interface PublicResources {
  version: string;
  generatedAt: string;
  items: { title: string; text: string }[];
}

const RESOURCE_KEY = makeStateKey<PublicResources>('public-resources');

/** Public pages: /acerca (SSR), /privacidad (prerendered) and /recursos (cached SSR). */
@Component({
  selector: 'app-public',
  imports: [RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './public.html',
  styleUrl: './public.css',
})
export class PublicPage {
  mode = inject(ActivatedRoute).snapshot.data['mode'] as string;
  private context = inject(REQUEST_CONTEXT, { optional: true }) as { publicContent?: PublicResources } | null;
  private transfer = inject(TransferState);
  private http = inject(HttpClient);
  resources = signal<PublicResources>(this.transfer.get(RESOURCE_KEY,
    this.context?.publicContent ?? { items: [], version: '', generatedAt: '' }));

  constructor() {
    if (this.context?.publicContent) this.transfer.set(RESOURCE_KEY, this.context.publicContent);
    afterNextRender(() => {
      if (this.mode === 'ISR equivalente' && !this.resources().version) {
        this.http.get<PublicResources>('/public/resources').subscribe({ next: data => this.resources.set(data), error: () => {} });
      }
    });
  }
}
