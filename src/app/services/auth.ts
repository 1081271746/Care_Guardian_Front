import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { API } from './api';
import { CurrentUser, LoginResponse } from './models';

const TOKEN_KEY = 'access_token';

/** localStorage is unavailable during SSR and may throw in private modes. */
function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** Reads the `exp` claim without trusting the token (the API validates it). */
export function tokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const exp = JSON.parse(json).exp;
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private http = inject(HttpClient);

  readonly user = signal<CurrentUser | null>(null);

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API}/auth/login`, { email: email.trim(), password }).pipe(
      tap(response => storage()?.setItem(TOKEN_KEY, response.access_token)),
    );
  }

  /** Public registration (POST /users/); the API always assigns the caregiver role. */
  register(nombre: string, email: string, password: string): Observable<unknown> {
    return this.http.post(`${API}/users/`, { nombre: nombre.trim(), email: email.trim(), password });
  }

  getToken(): string | null {
    return storage()?.getItem(TOKEN_KEY) ?? null;
  }

  /** True when a token exists and has not expired yet. */
  isAuthenticated(now = Date.now()): boolean {
    const token = this.getToken();
    if (!token) return false;
    const expiry = tokenExpiry(token);
    if (expiry !== null && expiry <= now) {
      this.logout();
      return false;
    }
    return true;
  }

  /** Loads the authenticated profile once per session (name for the shell, team counts). */
  loadUser(force = false): Observable<CurrentUser> | null {
    if (!force && this.user()) return null;
    return this.http.get<CurrentUser>(`${API}/auth/me`).pipe(tap(user => this.user.set(user)));
  }

  logout(): void {
    storage()?.removeItem(TOKEN_KEY);
    this.user.set(null);
  }
}
