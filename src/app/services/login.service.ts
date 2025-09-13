import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user?: {
    id: string;
    email: string;
    username: string;
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
    const payload = isEmail
      ? { email: emailOrUsername.toLowerCase().trim(), password }
      : { username: emailOrUsername.trim(), password };

    // If username is provided but backend expects email, try to handle it
    // You might need to adjust this based on your backend implementation
    if (!isEmail && !payload.email) {
      // If backend only accepts email, you might need a separate endpoint
      // or modify the backend to accept both email and username
      payload.email = emailOrUsername.trim(); // Fallback attempt
    }

    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, payload)
      .pipe(
        map(response => {
          console.log('Login successful');
          return response;
        }),
        catchError(this.handleError)
      );
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
      // Server-side error
      console.error(`Backend returned code ${error.status}, body was:`, error.error);

      if (error.status === 401) {
        errorMessage = 'Invalid credentials';
      } else if (error.status === 404) {
        errorMessage = 'User not found';
      } else if (error.status === 429) {
        errorMessage = 'Too many login attempts. Please try again later.';
      } else if (error.status === 0) {
        errorMessage = 'Cannot connect to server';
      } else {
        errorMessage = error.error?.message || `Server error: ${error.status}`;
      }
    }

    return throwError(() => ({ error: { message: errorMessage }, status: error.status }));
  }
}