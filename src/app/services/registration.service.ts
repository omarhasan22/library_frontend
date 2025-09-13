import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

interface RegistrationResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  register(email: string, username: string, password: string): Observable<RegistrationResponse> {
    console.log('Attempting to register user:', { email, username });

    const payload = {
      email: email.toLowerCase().trim(),
      username: username.trim(),
      password
    };
    console.log('Registration payload:', payload);

    return this.http.post<RegistrationResponse>(`${this.baseUrl}/auth/register`, payload)
      .pipe(
        map(response => {
          console.log('Registration successful:', response);
          return response;
        }),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred during registration';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 409) {
        errorMessage = 'User with this email or username already exists';
      } else if (error.status === 400) {
        errorMessage = error.error?.message || 'Invalid registration data';
      } else if (error.status === 0) {
        errorMessage = 'Cannot connect to server. Please check your internet connection';
      } else {
        errorMessage = error.error?.message || `Server error: ${error.status}`;
      }
    }

    console.error('Registration error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}