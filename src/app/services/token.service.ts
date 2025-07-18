import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  private ACCESS_TOKEN_KEY = 'access_token';
  private REFRESH_TOKEN_KEY = 'refresh_token';

  storeAccessToken(token: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  getAccessToken(): string | any {
    console.log("12344");
    
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  storeRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  private decodePayload(token: string): any | null {
    try {
      // JWT format: header.payload.signature
      const payload = token.split('.')[1];
      // atob decodes base64 string (browser built-in)
      const decodedJson = atob(payload);
      return JSON.parse(decodedJson);
    } catch {
      return null;
    }
  }

  isTokenValid(token: string): boolean {
    const decoded = this.decodePayload(token);
    if (!decoded || !decoded.exp) return false;
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp > currentTime;
  }

  decodeToken(token: string): any | null {
    try {
      const payload = token.split('.')[1];
      const decodedJson = atob(payload);
      return JSON.parse(decodedJson);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
}
