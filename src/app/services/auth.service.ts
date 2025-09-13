import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { TokenService } from './token.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

export interface User {
  id: string;
  email: string;
  username: string;
  role?: string;
  avatar?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

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
    private http: HttpClient,
    private router: Router
  ) {
    // Check if user is already logged in (page refresh scenario)
    const token = this.tokenService.getAccessToken();
    const storedUser = this.loadStoredUser();

    // Initialize subjects
    this.isLoggedInSubject = new BehaviorSubject<boolean>(!!token && this.tokenService.isTokenValid(token));
    this.isLoggedIn$ = this.isLoggedInSubject.asObservable();

    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser);
    this.currentUser$ = this.currentUserSubject.asObservable();

    // If we have a valid token but no user data, fetch it
    if (this.isAuthenticated() && !storedUser) {
      this.loadUserData().subscribe({
        next: (user) => console.log('User data loaded on init:', user),
        error: (error) => console.error('Failed to load user data on init:', error)
      });
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

  // Check if authenticated
  isAuthenticated(): boolean {
    const token = this.tokenService.getAccessToken();
    return token ? this.tokenService.isTokenValid(token) : false;
  }

  // Check if user is admin
  isAdmin(): boolean {
    const user = this.currentUser;
    return user?.role === 'admin' || false;
  }

  // Set login state - called after successful login
  setLoginState(isLoggedIn: boolean, user: User | null = null): void {
    this.isLoggedInSubject.next(isLoggedIn);

    if (isLoggedIn && user) {
      this.currentUserSubject.next(user);
      this.storeUser(user);
    } else if (!isLoggedIn) {
      this.currentUserSubject.next(null);
      this.clearStoredUser();
    }
  }

  // Set user info
  setUserInfo(user: User): void {
    this.currentUserSubject.next(user);
    this.storeUser(user);
  }

  // Load user data from API using token
  loadUserData(): Observable<User> {
    const token = this.tokenService.getAccessToken();
    if (!token) {
      return throwError(() => new Error('No authentication token found'));
    }

    const payload = this.tokenService.decodeToken(token);
    console.log('Token payload:', payload);

    // Try different payload properties for user ID
    const userId = payload?.userId || payload?.sub;

    if (!userId) {
      console.error('No user ID found in token payload:', payload);
      return throwError(() => new Error('Invalid token payload - no user ID'));
    }

    console.log('Fetching user data for ID:', userId);

    return this.http.get<User>(`${this.baseUrl}/users/userId/${userId}`).pipe(
      tap(user => {
        console.log('User data fetched successfully:', user);
        this.setUserInfo(user);
      }),
      catchError(error => {
        console.error('Failed to fetch user data:', error);
        // Try alternative endpoint if the first one fails
        if (error.status === 404) {
          // Try with just /users/{id} endpoint
          return this.http.get<User>(`${this.baseUrl}/users/${userId}`).pipe(
            tap(user => {
              console.log('User data fetched from alternative endpoint:', user);
              this.setUserInfo(user);
            }),
            catchError(err => {
              console.error('Both user endpoints failed:', err);
              return throwError(() => err);
            })
          );
        }
        return throwError(() => error);
      })
    );
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
    // this.router.navigate(['/login']);
  }

  // Store user in localStorage
  private storeUser(user: User): void {
    try {
      localStorage.setItem('current_user', JSON.stringify(user));
    } catch (error) {
      console.error('Failed to store user data:', error);
    }
  }

  // Load user from localStorage
  private loadStoredUser(): User | null {
    try {
      const userData = localStorage.getItem('current_user');
      if (userData) {
        const user = JSON.parse(userData);
        console.log('Loaded stored user:', user);
        return user;
      }
    } catch (error) {
      console.error('Failed to load stored user data:', error);
    }
    return null;
  }

  // Clear stored user data
  private clearStoredUser(): void {
    localStorage.removeItem('current_user');
  }
}