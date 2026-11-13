import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

// These guards only shape navigation; the API enforces the same rules on every request.

// Logged-in users only; others go to the login page and come back afterwards.
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated()
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

// Admins only. If the profile isn't loaded yet (fresh tab), wait for it instead of guessing.
export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
  if (auth.currentUser) {
    return auth.isAdmin() ? true : router.createUrlTree(['/']);
  }
  return auth.loadUserData().pipe(
    map(user => (user?.role === 'admin' ? true : router.createUrlTree(['/']))),
    catchError(() => of(router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })))
  );
};
