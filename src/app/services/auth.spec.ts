import { HttpClient } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { Auth, tokenExpiry } from './auth';
import { authInterceptor } from './auth.interceptor';

function jwt(payload: object): string {
  const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${encode({ alg: 'HS256' })}.${encode(payload)}.firma`;
}

describe('Auth', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
  });

  it('reads the exp claim without validating the signature', () => {
    expect(tokenExpiry(jwt({ exp: 1700000000 }))).toBe(1700000000000);
    expect(tokenExpiry('basura')).toBeNull();
  });

  it('treats expired tokens as signed out and removes them', () => {
    const auth = TestBed.inject(Auth);
    localStorage.setItem('access_token', jwt({ exp: Math.floor(Date.now() / 1000) - 60 }));
    expect(auth.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('access_token')).toBeNull();
    localStorage.setItem('access_token', jwt({ exp: Math.floor(Date.now() / 1000) + 600 }));
    expect(auth.isAuthenticated()).toBe(true);
  });

  it('loads the profile once and clears it on logout', () => {
    const auth = TestBed.inject(Auth);
    const http = TestBed.inject(HttpTestingController);
    auth.loadUser()!.subscribe();
    http.expectOne('/api/auth/me').flush({ id: 1, nombre: 'Ana', email: 'a@x.org' });
    expect(auth.user()?.nombre).toBe('Ana');
    expect(auth.loadUser()).toBeNull();
    auth.logout();
    expect(auth.user()).toBeNull();
  });

  it('adds the bearer token only to API calls', () => {
    localStorage.setItem('access_token', 'abc');
    const client = TestBed.inject(HttpClient);
    const http = TestBed.inject(HttpTestingController);
    client.get('/api/patients/').subscribe();
    client.get('/public/resources').subscribe();
    expect(http.expectOne('/api/patients/').request.headers.get('Authorization')).toBe('Bearer abc');
    expect(http.expectOne('/public/resources').request.headers.has('Authorization')).toBe(false);
  });

  it('ends the session and redirects to login when the API answers 401', () => {
    localStorage.setItem('access_token', 'abc');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const client = TestBed.inject(HttpClient);
    client.get('/api/patients/').subscribe({ error: () => {} });
    TestBed.inject(HttpTestingController).expectOne('/api/patients/')
      .flush({ detail: 'Tu sesión expiró' }, { status: 401, statusText: 'Unauthorized' });
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { sesion: 'expirada' } });
  });

  it('does not treat a failed login as an expired session', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');
    TestBed.inject(Auth).login('a@x.org', 'mala').subscribe({ error: () => {} });
    TestBed.inject(HttpTestingController).expectOne('/api/auth/login')
      .flush({ detail: 'Credenciales incorrectas' }, { status: 401, statusText: 'Unauthorized' });
    expect(navigate).not.toHaveBeenCalled();
  });
});
