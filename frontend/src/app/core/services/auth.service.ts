import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthUser, LoginResponse } from '../models';

const TOKEN_KEY = 'insightloop.token';
const USER_KEY = 'insightloop.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<AuthUser | null>(this.loadUser());
  readonly user = this._user.asReadonly();

  // NOTE: computed re-evaluates only when signals it reads change.
  // We read _user() AND call isTokenValid() (which reads localStorage).
  // For guard checks we also call isAuthenticated() as a method-style
  // check via a getter to force re-evaluation on every navigation.
  readonly isAuthenticated = (): boolean => {
    if (!this._user()) return false;
    if (!this.isTokenValid()) {
      this.logout();
      return false;
    }
    return true;
  };

  constructor(private http: HttpClient) {
    if (!this.isTokenValid()) {
      this.logout();
    } else {
      setTimeout(() => {
        this.http.get<AuthUser>('/api/me/permissions').subscribe({
          next: u => {
            localStorage.setItem(USER_KEY, JSON.stringify(u));
            this._user.set(u);
          },
          error: () => this.logout()
        });
      }, 0);
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/auth/login', { email, password }).pipe(
      tap(r => {
        localStorage.setItem(TOKEN_KEY, r.accessToken);
        localStorage.setItem(USER_KEY, JSON.stringify(r.user));
        this._user.set(r.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
  }

  token(): string | null {
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t) return null;
    if (!this.isTokenValid(t)) {
      this.logout();
      return null;
    }
    return t;
  }

  hasRole(role: string): boolean { return this._user()?.roles.includes(role) ?? false; }
  hasAnyRole(roles: string[]): boolean {
    const u = this._user(); if (!u) return false;
    return roles.some(r => u.roles.includes(r));
  }
  hasPermission(p: string): boolean { return this._user()?.permissions.includes(p) ?? false; }

  /** Decode JWT payload and check `exp` (seconds since epoch). */
  private isTokenValid(token?: string | null): boolean {
    const t = token ?? localStorage.getItem(TOKEN_KEY);
    if (!t) return false;
    try {
      const payload = JSON.parse(
        atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
      );
      if (!payload.exp) return false;           // no expiry -> treat as invalid
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  private loadUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    try { return raw ? (JSON.parse(raw) as AuthUser) : null; } catch { return null; }
  }
}
