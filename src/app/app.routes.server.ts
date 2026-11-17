import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'acerca', renderMode: RenderMode.Server },
  { path: 'privacidad', renderMode: RenderMode.Prerender },
  { path: 'recursos', renderMode: RenderMode.Server },
  { path: '**', renderMode: RenderMode.Client },
];
