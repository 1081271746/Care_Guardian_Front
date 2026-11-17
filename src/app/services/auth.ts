import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

interface LoginResponse {
  access_token: string;
  token_type: string;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {

  private apiUrl = '/api';

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/auth/login`,
      {
        email,
        password
      }
    ).pipe(
      tap(response => {
        localStorage.setItem('access_token', response.access_token);
      })
    );
  }

  getToken(): string | null {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
  }

  logout(): void {
    localStorage.removeItem('access_token');
  }
}