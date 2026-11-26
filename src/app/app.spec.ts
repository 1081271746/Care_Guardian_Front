import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [App], providers: [provideRouter(routes)] });
  });

  it('renders the router outlet and the toast region', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('cg-toasts')).toBeTruthy();
  });

  it('sends signed-out visitors of private pages to login, remembering the target', async () => {
    const router = TestBed.inject(Router);
    TestBed.createComponent(App);
    await router.navigateByUrl('/evolucion');
    expect(router.url).toBe('/login?volver=%2Fevolucion');
  });

  it('declares a lazy route for every private module', () => {
    const shell = routes.find(route => route.children)!;
    expect(shell.children!.map(child => child.path)).toEqual([
      'dashboard', 'dashboard/:patientId', 'pacientes', 'medicamentos', 'citas', 'sintomas', 'notas', 'alertas', 'evolucion',
    ]);
    expect(shell.children!.every(child => typeof child.loadComponent === 'function')).toBe(true);
  });
});
