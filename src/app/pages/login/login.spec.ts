import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';

import { Login } from './login';

describe('Login', () => {
  function setup(query: Record<string, string> = {}) {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } },
      ],
    });
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    return { fixture, component: fixture.componentInstance, http: TestBed.inject(HttpTestingController), navigate };
  }

  it('does not call the API while the form is invalid', () => {
    const { component, http } = setup();
    component.submit();
    http.expectNone('/api/auth/login');
    expect(component.form.touched).toBe(true);
  });

  it('logs in, stores the token and returns to the requested page', () => {
    const { component, http, navigate } = setup({ volver: '/evolucion' });
    component.form.setValue({ nombre: '', email: 'ana@example.org', password: 'Clave2026' });
    component.submit();
    const request = http.expectOne('/api/auth/login');
    expect(request.request.body).toEqual({ email: 'ana@example.org', password: 'Clave2026' });
    request.flush({ access_token: 'token-123', token_type: 'bearer' });
    expect(localStorage.getItem('access_token')).toBe('token-123');
    expect(navigate).toHaveBeenCalledWith('/evolucion');
  });

  it('never redirects to another origin after login', () => {
    const { component, http, navigate } = setup({ volver: '//evil.example' });
    component.form.setValue({ nombre: '', email: 'ana@example.org', password: 'x' });
    component.submit();
    http.expectOne('/api/auth/login').flush({ access_token: 't', token_type: 'bearer' });
    expect(navigate).toHaveBeenCalledWith('/dashboard');
  });

  it('shows the API message on wrong credentials', () => {
    const { fixture, component, http } = setup();
    component.form.setValue({ nombre: '', email: 'ana@example.org', password: 'mala' });
    component.submit();
    http.expectOne('/api/auth/login').flush({ detail: 'Credenciales incorrectas' }, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Credenciales incorrectas');
    expect(component.loading()).toBe(false);
  });

  it('registers and then logs in when creating an account', () => {
    const { component, http } = setup();
    component.switchMode('register');
    component.form.setValue({ nombre: 'Ana', email: 'ana@example.org', password: 'corta' });
    component.submit();
    http.expectNone('/api/users/');
    component.form.controls.password.setValue('Segura2026');
    component.submit();
    http.expectOne('/api/users/').flush({ mensaje: 'ok' }, { status: 201, statusText: 'Created' });
    http.expectOne('/api/auth/login').flush({ access_token: 't', token_type: 'bearer' });
  });

  it('explains why the session ended', () => {
    const { fixture } = setup({ sesion: 'expirada' });
    expect(fixture.nativeElement.textContent).toContain('Tu sesión expiró');
  });

  it('toggles password visibility', () => {
    const { fixture, component } = setup();
    const input = fixture.nativeElement.querySelector('#password') as HTMLInputElement;
    expect(input.type).toBe('password');
    component.showPassword.set(true);
    fixture.detectChanges();
    expect(input.type).toBe('text');
  });
});
