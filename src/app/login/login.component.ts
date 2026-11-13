import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { LoginService } from '../services/login.service';
import { TokenService } from '../services/token.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../shared/services/toast.service';

/** /login — accepts a username or an email. Returns to ?returnUrl= after signing in. */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['../shared/styles/auth.css', './login.component.css'],
  standalone: false
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  message = '';
  isLoading = false;
  submitted = false;
  showPassword = false;
  returnUrl = '/';

  constructor(
    private formBuilder: FormBuilder,
    private loginService: LoginService,
    private router: Router,
    private route: ActivatedRoute,
    private tokenService: TokenService,
    private authService: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.returnUrl = this.safeReturnUrl(this.route.snapshot.queryParams['returnUrl']);
    if (this.authService.isAuthenticated()) {
      this.router.navigateByUrl(this.returnUrl);
      return;
    }
    this.loginForm = this.formBuilder.group({
      // Prefilled after registering (?u=username).
      emailOrUsername: [this.route.snapshot.queryParams['u'] || '', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  error(name: 'emailOrUsername' | 'password'): string | null {
    const c = this.loginForm.get(name);
    if (!this.submitted || !c?.errors) return null;
    if (name === 'emailOrUsername') return 'اكتب اسم المستخدم أو البريد الإلكتروني.';
    return c.errors['required'] ? 'اكتب كلمة المرور.' : 'كلمة المرور 6 أحرف على الأقل.';
  }

  login(): void {
    this.submitted = true;
    this.message = '';
    if (this.loginForm.invalid) {
      const first = this.error('emailOrUsername') ? 'login-user' : 'login-password';
      document.getElementById(first)?.focus();
      return;
    }

    this.isLoading = true;
    const { emailOrUsername, password, rememberMe } = this.loginForm.value;
    const identifier = String(emailOrUsername).trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

    this.loginService.login(identifier, password, isEmail).pipe(
      switchMap(res => {
        this.tokenService.storeAccessToken(res.accessToken, rememberMe);
        this.tokenService.storeRefreshToken(res.refreshToken, rememberMe);
        this.authService.setLoginState(true);
        if (res.user) {
          this.authService.setUserInfo(res.user);
          return of(res.user);
        }
        return this.authService.loadUserData();
      })
    ).subscribe({
      next: (user: any) => {
        this.isLoading = false;
        this.toast.success(user?.username ? `أهلاً بك، ${user.username}` : 'تم تسجيل الدخول');
        this.router.navigateByUrl(this.returnUrl);
      },
      error: err => {
        this.isLoading = false;
        this.message = err?.status === 401 || err?.status === 404 || err?.status === 400
          ? 'اسم المستخدم أو كلمة المرور غير صحيحة.'
          : err?.status === 429
            ? 'محاولات كثيرة. انتظر قليلاً ثم حاول مجدداً.'
            : 'تعذّر تسجيل الدخول. تحقّق من الاتصال وحاول مرة أخرى.';
        this.authService.logout();
      }
    });
  }

  /** Only same-site paths (never an absolute URL from the query string). */
  private safeReturnUrl(url: unknown): string {
    return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') ? url : '/';
  }
}
