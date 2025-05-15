import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from '../services/login.service';
import { TokenService } from '../services/token.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  message = '';
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private loginService: LoginService,
    private router: Router,
    private tokenService: TokenService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  login(): void {
    if (this.loginForm.invalid) {
      this.message = 'Please fill in all required fields.';
      return;
    }

    this.isLoading = true;
    const { username, password } = this.loginForm.value;

    this.loginService.login(username, password).subscribe({
      next: (res) => {
        this.tokenService.storeAccessToken(res.accessToken);
        this.tokenService.storeRefreshToken(res.refreshToken);

        if (this.tokenService.isTokenValid(res.accessToken)) {
          this.authService.setLoginState(true);
          this.router.navigate(['/']);
        } else {
          this.message = 'Invalid token received. Please try again.';
        }
      },
      error: (err) => {
        this.message = err?.error?.message || 'Login failed. Please try again.';
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}
