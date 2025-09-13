import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LoginService } from '../services/login.service';
import { TokenService } from '../services/token.service';
import { AuthService } from '../services/auth.service';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: false
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  message = '';
  isLoading = false;
  isSuccess = false;
  returnUrl: string = '/';

  constructor(
    private formBuilder: FormBuilder,
    private loginService: LoginService,
    private router: Router,
    private route: ActivatedRoute,
    private tokenService: TokenService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Check if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

    this.loginForm = this.formBuilder.group({
      emailOrUsername: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  login(): void {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.message = '';

    const { emailOrUsername, password, rememberMe } = this.loginForm.value;
    const isEmail = this.isValidEmail(emailOrUsername);

    // First login to get tokens
    this.loginService.login(emailOrUsername, password, isEmail).pipe(
      switchMap(loginResponse => {
        console.log('Login response:', loginResponse);

        // Store tokens
        this.tokenService.storeAccessToken(loginResponse.accessToken, rememberMe);
        this.tokenService.storeRefreshToken(loginResponse.refreshToken, rememberMe);

        // Set initial login state
        this.authService.setLoginState(true);

        // If user data is included in login response, use it
        if (loginResponse.user) {
          this.authService.setUserInfo(loginResponse.user);
          return of(loginResponse.user);
        }

        // Otherwise, fetch user data
        console.log('Fetching user data after login...');
        return this.authService.loadUserData();
      })
    ).subscribe({
      next: (user) => {
        console.log('Login complete with user:', user);
        this.isSuccess = true;
        this.message = 'Login successful! Redirecting...';

        setTimeout(() => {
          this.router.navigate([this.returnUrl]);
        }, 1000);
      },
      error: (err) => {
        console.error('Login error:', err);
        this.isLoading = false;

        if (err.status === 401) {
          this.message = 'Invalid email/username or password';
        } else if (err.status === 404) {
          this.message = 'User not found';
        } else {
          this.message = err?.error?.message || 'Login failed. Please try again.';
        }

        // Clear any partial login state
        this.authService.logout();
      }
    });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}