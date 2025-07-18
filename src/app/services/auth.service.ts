import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TokenService } from './token.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AuthService  {
  private isLoggedInSubject: BehaviorSubject<boolean>;
  isLoggedIn$: Observable<boolean>;
  private apiUrl = 'http://localhost:8000/users';  // Adjust as per backend URL

  constructor(private tokenService: TokenService,private http: HttpClient) {
    const initialAuthState = this.isAuthenticated();
    this.isLoggedInSubject = new BehaviorSubject<boolean>(initialAuthState);
    this.isLoggedIn$ = this.isLoggedInSubject.asObservable();
  }

  setLoginState(isLoggedIn: boolean): void {
    this.isLoggedInSubject.next(isLoggedIn);
  }

  isAuthenticated(): boolean {
    console.log(123);
    const token = this.tokenService.getAccessToken();
    return token ? this.tokenService.isTokenValid(token) : false;
  }

  isAdmin(): boolean {
    const token = this.tokenService.getAccessToken();
    console.log("token ",token);
    
    if (token) {
      const payload = this.tokenService.decodeToken(token);
      console.log("payload ",payload);
      
      return payload && payload.role === 'admin';
    }
    return false;
  }

  getUserData(): any | null {
    const token = this.tokenService.getAccessToken();
    if (token) {
    const payload = this.tokenService.decodeToken(token);
    console.log("payloadpayload ",payload.userId);
    
    return this.http.get<any>(`${this.apiUrl}/userId/${payload.userId}`);   
  }
    return null;
  }

  logout(): void {
    this.tokenService.clearTokens();
    this.setLoginState(false);
}
}