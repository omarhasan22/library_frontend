import { Injectable, Injector } from '@angular/core';
import {
  HttpBackend, HttpClient, HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, map, shareReplay, switchMap } from 'rxjs/operators';
import { TokenService } from '../services/token.service';
import { AuthService } from '../services/auth.service';
import { environment } from 'src/environments/environment';

// Requests that must never trigger a refresh (they are how you get tokens in the first place).
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh'];

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  // One refresh at a time: concurrent 401s all wait for the same request.
  private refreshInFlight$: Observable<string> | null = null;
  // Talks to the backend directly, bypassing interceptors, so the refresh call can't loop.
  private readonly rawHttp: HttpClient;

  constructor(
    private tokenService: TokenService,
    private injector: Injector,
    httpBackend: HttpBackend
  ) {
    this.rawHttp = new HttpClient(httpBackend);
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (AUTH_ENDPOINTS.some(path => req.url.includes(path))) {
      return next.handle(req);
    }

    return next.handle(this.withToken(req, this.tokenService.getAccessToken())).pipe(
      catchError((error: unknown) => {
        const expired = error instanceof HttpErrorResponse && error.status === 401;
        if (!expired || !this.tokenService.getRefreshToken()) {
          return throwError(() => error);
        }
        // Access token expired: refresh once, then retry the original request once.
        return this.refreshAccessToken().pipe(
          catchError(() => {
            this.endSession();
            return throwError(() => error);
          }),
          switchMap(token => next.handle(this.withToken(req, token)))
        );
      })
    );
  }

  private withToken(req: HttpRequest<any>, token: string | null): HttpRequest<any> {
    return token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  }

  private refreshAccessToken(): Observable<string> {
    if (!this.refreshInFlight$) {
      const refreshToken = this.tokenService.getRefreshToken();
      this.refreshInFlight$ = this.rawHttp
        .post<{ accessToken: string }>(`${environment.apiUrl}/auth/refresh`, { refreshToken })
        .pipe(
          map(res => {
            this.tokenService.updateAccessToken(res.accessToken);
            return res.accessToken;
          }),
          finalize(() => (this.refreshInFlight$ = null)),
          shareReplay(1)
        );
    }
    return this.refreshInFlight$;
  }

  // The refresh token is no longer accepted: log out and send the user to the login page,
  // coming back to where they were afterwards.
  private endSession(): void {
    // Resolved lazily: AuthService and Router depend on HttpClient, which depends on this interceptor.
    this.injector.get(AuthService).logout();
    const router = this.injector.get(Router);
    if (!router.url.startsWith('/login')) {
      router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
    }
  }
}
