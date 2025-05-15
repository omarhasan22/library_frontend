import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.isAuthenticated());
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private tokenService: TokenService) {}

  setLoginState(isLoggedIn: boolean): void {
    this.isLoggedInSubject.next(isLoggedIn);
  }

  isAuthenticated(): boolean {
        console.log(123);
    const token = this.tokenService.getAccessToken();
    return token ? this.tokenService.isTokenValid(token) : false;
  }

  logout(): void {
    this.tokenService.clearTokens();
    this.setLoginState(false);
  }
}
