import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TokenService } from './token.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isLoggedInSubject: BehaviorSubject<boolean>;
  isLoggedIn$: Observable<boolean>;

  private baseUrl = environment.apiUrl;

  constructor(private tokenService: TokenService, private http: HttpClient) {
    const initialAuthState = this.isAuthenticated();
    this.isLoggedInSubject = new BehaviorSubject<boolean>(initialAuthState);
    this.isLoggedIn$ = this.isLoggedInSubject.asObservable();
  }

  setLoginState(isLoggedIn: boolean): void {
    this.isLoggedInSubject.next(isLoggedIn);
  }

  isAuthenticated(): boolean {
    const token = this.tokenService.getAccessToken();
    return token ? this.tokenService.isTokenValid(token) : false;
  }

  isAdmin(): boolean {
    const token = this.tokenService.getAccessToken();

    if (token) {
      const payload = this.tokenService.decodeToken(token);

      return payload && payload.role === 'admin';
    }
    return false;
  }

  getUserData(): any | null {
    const token = this.tokenService.getAccessToken();
    if (token) {
      const payload = this.tokenService.decodeToken(token);

      return this.http.get<any>(`${this.baseUrl}/users/userId/${payload.userId}`);
    }
    return null;
  }

  logout(): void {
    this.tokenService.clearTokens();
    this.setLoginState(false);
  }
}