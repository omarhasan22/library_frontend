import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RegistrationService } from '../services/registration.service';
import { ToastService } from '../shared/services/toast.service';

type Field = 'username' | 'email' | 'password' | 'confirmPassword';

/** /register — creates a regular (non-admin) account, then hands over to /login with the username filled in. */
@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['../shared/styles/auth.css', './register.component.css'],
  standalone: false
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  errMessage = '';
  isLoading = false;
  submitted = false;
  showPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private registerService: RegistrationService,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.registerForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirm = control.get('confirmPassword');
    if (!password || !confirm || !confirm.value) return null;
    return password.value !== confirm.value ? { passwordMismatch: true } : null;
  }

  error(field: Field): string | null {
    if (!this.submitted) return null;
    const c = this.registerForm.get(field);
    const e = c?.errors;
    switch (field) {
      case 'username':
        if (e?.['required']) return 'اختر اسم مستخدم.';
        if (e?.['minlength']) return 'اسم المستخدم 3 أحرف على الأقل.';
        if (e?.['maxlength']) return 'اسم المستخدم 20 حرفاً على الأكثر.';
        return null;
      case 'email':
        if (e?.['required']) return 'اكتب بريدك الإلكتروني.';
        if (e?.['email']) return 'صيغة البريد الإلكتروني غير صحيحة.';
        return null;
      case 'password':
        if (e?.['required']) return 'اختر كلمة مرور.';
        if (e?.['minlength']) return 'كلمة المرور 6 أحرف على الأقل.';
        return null;
      case 'confirmPassword':
        if (e?.['required']) return 'أعد كتابة كلمة المرور.';
        if (this.registerForm.errors?.['passwordMismatch']) return 'كلمتا المرور غير متطابقتين.';
        return null;
    }
  }

  register(): void {
    this.submitted = true;
    this.errMessage = '';
    if (this.registerForm.invalid) {
      const order: Field[] = ['username', 'email', 'password', 'confirmPassword'];
      const first = order.find(f => this.error(f));
      if (first) document.getElementById('reg-' + first)?.focus();
      return;
    }
    this.isLoading = true;
    const v = this.registerForm.value;
    this.registerService.register(v.email, v.username, v.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.toast.success('تم إنشاء الحساب. سجّل الدخول الآن.');
        this.router.navigate(['/login'], { queryParams: { u: String(v.username).trim() } });
      },
      error: err => {
        this.isLoading = false;
        const server = String(err?.error?.error || err?.error?.message || '');
        this.errMessage = /exist|taken|duplicate|E11000/i.test(server)
          ? 'اسم المستخدم أو البريد الإلكتروني مستخدم من قبل.'
          : /[؀-ۿ]/.test(server) ? server : 'تعذّر إنشاء الحساب. حاول مرة أخرى.';
      }
    });
  }
}
