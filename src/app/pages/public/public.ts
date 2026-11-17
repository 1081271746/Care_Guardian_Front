import { Component, REQUEST_CONTEXT, TransferState, afterNextRender, inject, makeStateKey, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

const RESOURCE_KEY = makeStateKey<any>('public-resources');
@Component({
  selector: 'app-public',
  imports: [RouterLink],
  template: `
    <main style="max-width:850px;margin:60px auto;padding:24px;font:18px/1.7 Arial;color:#193e42">
      <nav><a routerLink="/login">CareGuardian</a> · <a routerLink="/acerca">Acerca</a> ·
        <a routerLink="/privacidad">Privacidad</a> · <a routerLink="/recursos">Recursos</a></nav>
      <p>Rendering: {{ mode }}</p>
      @if (mode === 'SSR') {
        <h1>Acompañamiento para cuidadores</h1>
        <p>CareGuardian organiza síntomas, medicamentos, citas y observaciones del cuidado.
          Los datos personales se consultan exclusivamente en áreas privadas autenticadas.</p>
        <p>Esta página pública se renderiza en el servidor en cada petición.</p>
      } @else if (mode === 'SSG') {
        <h1>Privacidad y uso responsable de IA</h1>
        <p>Los registros pertenecen al equipo de cuidado asignado. No se incluyen en páginas públicas ni cachés compartidas.</p>
        <p>Solo con autorización explícita se envían estadísticas minimizadas a Groq. No se envían nombres,
          documentos, contactos ni textos libres. La versión del consentimiento y el resumen quedan registrados.</p>
        <p>La IA es descriptiva: no diagnostica, no prescribe y no sustituye una consulta profesional.</p>
        <p>Esta página se genera durante el build (SSG). El operador debe proporcionar su política de conservación
          y canal de atención antes de tratar datos reales.</p>
      } @else {
        <h1>Recursos para el cuidado</h1>
        @for (item of resources().items; track $index) { <h2>{{ item.title }}</h2><p>{{ item.text }}</p> }
        <p>Versión pública: {{ resources().version }} · Regenerado: {{ resources().generatedAt }}</p>
        <p>HTML público con expiración y revalidación en segundo plano. No es hidratación incremental.</p>
      }
    </main>`,
})
export class PublicPage {
  mode = inject(ActivatedRoute).snapshot.data['mode'];
  private context = inject(REQUEST_CONTEXT, { optional: true }) as any;
  private transfer = inject(TransferState);
  private http = inject(HttpClient);
  resources = signal(this.transfer.get(RESOURCE_KEY, this.context?.publicContent ?? { items: [], version: '', generatedAt: '' }));
  constructor() {
    if (this.context?.publicContent) this.transfer.set(RESOURCE_KEY, this.context.publicContent);
    afterNextRender(() => {
      if (this.mode === 'ISR equivalente' && !this.resources().version) {
        this.http.get('/public/resources').subscribe({ next: data => this.resources.set(data), error: () => {} });
      }
    });
  }
}
