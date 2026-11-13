import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user?: {
    _id?: string;
    id?: string;
    email: string;
    username: string;
    role?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  login(emailOrUsername: string, password: string, isEmail: boolean = true): Observable<LoginResponse> {
    // Prepare payload based on whether it's email or username
    // The API accepts an email or a username in either field.
    const payload = isEmail
      ? { email: emailOrUsername.toLowerCase().trim(), password }
      : { username: emailOrUsername.trim(), password };

    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, payload)
      .pipe(catchError(this.handleError));
  }

  // Optional: Add a method to check username availability
  checkUsername(username: string): Observable<boolean> {
    return this.http.get<{ available: boolean }>(
      `${this.baseUrl}/auth/check-username/${username}`
    ).pipe(
      map(response => response.available),
      catchError(() => throwError(() => new Error('Unable to check username')))
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred during login';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error (the API replies with { error: '...' })
      const serverMessage = error.error?.error || error.error?.message;

      if (error.status === 400 && serverMessage) {
        errorMessage = serverMessage;
      } else if (error.status === 401) {
        errorMessage = 'Invalid credentials';
      } else if (error.status === 404) {
        errorMessage = 'User not found';
      } else if (error.status === 429) {
        errorMessage = 'Too many login attempts. Please try again later.';
      } else if (error.status === 0) {
        errorMessage = 'Cannot connect to server';
      } else {
        errorMessage = serverMessage || `Server error: ${error.status}`;
      }
    }

    return throwError(() => ({ error: { message: errorMessage }, status: error.status }));
  }
}