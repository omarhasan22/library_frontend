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

  // Store access token
  storeAccessToken(token: string, persistent: boolean = false): void {
    if (persistent) {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(this.ACCESS_TOKEN_KEY, token);
    }
  }

  // Store refresh token
  storeRefreshToken(token: string, persistent: boolean = false): void {
    if (persistent) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    }
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
      console.error('Error decoding token:', error);
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
      console.error('Error validating token:', error);
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