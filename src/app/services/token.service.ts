// token.service.ts - Updated version with proper JWT handling
import { Injectable } from '@angular/core';

interface JwtPayload {
  exp?: number;
  iat?: number;
  sub?: string;
  userId?: string;
  email?: string;
  username?: string;
  role?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  constructor() { }

  // Store access token. Each token lives in exactly one storage, so a stale copy in the
  // other storage can never shadow a fresh one.
  storeAccessToken(token: string, persistent: boolean = false): void {
    this.store(this.ACCESS_TOKEN_KEY, token, persistent);
  }

  // Store refresh token
  storeRefreshToken(token: string, persistent: boolean = false): void {
    this.store(this.REFRESH_TOKEN_KEY, token, persistent);
  }

  // Replace the access token after a refresh, keeping it next to the refresh token.
  updateAccessToken(token: string): void {
    this.storeAccessToken(token, this.isPersistent());
  }

  // True when the session was stored with "remember me" (localStorage).
  isPersistent(): boolean {
    return !!localStorage.getItem(this.REFRESH_TOKEN_KEY) || !!localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  // A session is usable while either token is still valid (an expired access token can be refreshed).
  hasValidSession(): boolean {
    const access = this.getAccessToken();
    const refresh = this.getRefreshToken();
    return (!!access && this.isTokenValid(access)) || (!!refresh && this.isTokenValid(refresh));
  }

  private store(key: string, token: string, persistent: boolean): void {
    (persistent ? sessionStorage : localStorage).removeItem(key);
    (persistent ? localStorage : sessionStorage).setItem(key, token);
  }

  // Get access token
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY) ||
      sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  // Get refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY) ||
      sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  // Clear all tokens
  removeTokens(): void {
    this.clearTokens();
  }

  // Clear tokens (alias for removeTokens)
  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  // Decode token
  decodeToken(token: string): JwtPayload | null {
    return this.getTokenPayload(token);
  }

  // Get token payload
  getTokenPayload(token: string): JwtPayload | null {
    if (!token) return null;

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      return null;
    }
  }

  // Check if token is valid
  isTokenValid(token: string): boolean {
    if (!token) return false;

    try {
      const payload = this.getTokenPayload(token);
      if (!payload || !payload.exp) return false;

      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  // Check if access token is expired
  isAccessTokenExpired(): boolean {
    const token = this.getAccessToken();
    return !token || !this.isTokenValid(token);
  }

  // Get token expiration time
  getTokenExpirationTime(): Date | null {
    const token = this.getAccessToken();
    if (!token) return null;

    const payload = this.getTokenPayload(token);
    if (!payload || !payload.exp) return null;

    return new Date(payload.exp * 1000);
  }
}