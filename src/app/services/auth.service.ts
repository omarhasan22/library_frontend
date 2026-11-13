import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { TokenService } from './token.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

export interface User {
  _id?: string;
  id?: string;
  email: string;
  username: string;
  role?: string;
  avatar?: string;
  createdAt?: Date;
  updatedAt?: Date;
  __v?: number;
}

const USER_KEY = 'current_user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = environment.apiUrl;

  private isLoggedInSubject: BehaviorSubject<boolean>;
  public isLoggedIn$: Observable<boolean>;

  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  constructor(
    private tokenService: TokenService,
    private http: HttpClient
  ) {
    // Page load: the session is valid while either token is (an expired access token is refreshed
    // by the interceptor). Without a session, drop any leftover user so the UI doesn't look logged in.
    const hasSession = this.tokenService.hasValidSession();
    if (!hasSession) {
      this.tokenService.clearTokens();
      this.clearStoredUser();
    }
    const storedUser = hasSession ? this.loadStoredUser() : null;

    this.isLoggedInSubject = new BehaviorSubject<boolean>(hasSession);
    this.isLoggedIn$ = this.isLoggedInSubject.asObservable();

    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser);
    this.currentUser$ = this.currentUserSubject.asObservable();

    // Logged in but no user data yet (e.g. new tab): fetch it once, here only.
    if (hasSession && !storedUser) {
      this.loadUserData().subscribe({ error: () => { /* interceptor handles auth failures */ } });
    }
  }

  // Get current user value
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  // True while the session can still be used (valid access token, or a refresh token to renew it).
  isAuthenticated(): boolean {
    return this.tokenService.hasValidSession();
  }

  // Check if user is admin (UI only; the API enforces roles itself)
  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  // Set login state - called after successful login
  setLoginState(isLoggedIn: boolean, user: User | null = null): void {
    this.isLoggedInSubject.next(isLoggedIn);

    if (isLoggedIn && user) {
      this.setUserInfo(user);
    } else if (!isLoggedIn) {
      this.currentUserSubject.next(null);
      this.clearStoredUser();
    }
  }

  // Set user info
  setUserInfo(user: User): void {
    const safeUser = this.withoutSecrets(user);
    this.currentUserSubject.next(safeUser);
    this.storeUser(safeUser);
  }

  // Load user data from API using token
  loadUserData(): Observable<User> {
    if (!this.isAuthenticated()) {
      return throwError(() => new Error('No authentication token found'));
    }
    return this.getProfile();
  }

  // Get user data - for backward compatibility
  getUserData(): Observable<User> | null {
    if (!this.isAuthenticated()) {
      return null;
    }
    return this.loadUserData();
  }

  // Refresh user data
  refreshUserData(): Observable<User> {
    return this.loadUserData();
  }

  // Logout
  logout(): void {
    this.tokenService.clearTokens();
    this.setLoginState(false, null);
  }

  // The user is kept in the same storage as the tokens, so both disappear together
  // (sessionStorage unless "remember me").
  private storeUser(user: User): void {
    try {
      const persistent = this.tokenService.isPersistent();
      (persistent ? sessionStorage : localStorage).removeItem(USER_KEY);
      (persistent ? localStorage : sessionStorage).setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // Storage unavailable (private mode / quota): keep the user in memory only.
    }
  }

  private loadStoredUser(): User | null {
    try {
      const userData = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
      if (!userData) return null;
      const parsed = JSON.parse(userData);
      const user = this.withoutSecrets(parsed);
      // Older versions stored the full profile including the password hash: rewrite it clean.
      if ('password' in parsed) this.storeUser(user);
      return user;
    } catch {
      return null;
    }
  }

  private clearStoredUser(): void {
    try {
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(USER_KEY);
    } catch { }
  }

  private withoutSecrets(user: User): User {
    const { password, ...rest } = user as User & { password?: string };
    return rest;
  }

  // Get user profile
  getProfile(): Observable<User> {
    return this.http.get<{ user: User }>(`${this.baseUrl}/auth/profile`).pipe(
      map(response => response.user),
      tap((user: User) => this.setUserInfo(user))
    );
  }

  // Update user profile
  updateProfile(profileData: { username?: string; email?: string; currentPassword?: string; newPassword?: string }): Observable<any> {
    return this.http.put(`${this.baseUrl}/auth/profile`, profileData).pipe(
      tap((response: any) => {
        if (response.user) {
          this.setUserInfo(response.user);
        }
      })
    );
  }
}
