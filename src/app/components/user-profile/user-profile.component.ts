import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/services/toast.service';

const LABELS: Record<string, string> = {
  username: 'اسم المستخدم', email: 'البريد الإلكتروني',
  currentPassword: 'كلمة المرور الحالية', newPassword: 'كلمة المرور الجديدة', confirmPassword: 'تأكيد كلمة المرور'
};
const DATE_FMT = new Intl.DateTimeFormat('ar-u-nu-latn', { dateStyle: 'long' });

/** /profile — account details and password, each saved on its own. */
@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  currentUser: any = null;
  loadingUser = true;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  savingProfile = false;
  savingPassword = false;
  profileSubmitted = false;
  passwordSubmitted = false;
  profileError = '';
  passwordError = '';
  showPasswords = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private toast: ToastService) {
    this.profileForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]]
    });
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: (g: AbstractControl): ValidationErrors | null => {
      const a = g.get('newPassword')?.value;
      const b = g.get('confirmPassword')?.value;
      return a && b && a !== b ? { passwordMismatch: true } : null;
    } });
  }

  ngOnInit(): void {
    this.authService.getProfile().subscribe({
      next: user => this.setUser(user),
      error: () => this.setUser(this.authService.currentUser)
    });
  }

  private setUser(user: any): void {
    this.loadingUser = false;
    this.currentUser = user;
    if (user) this.profileForm.reset({ username: user.username, email: user.email });
  }

  get initial(): string {
    return (this.currentUser?.username || '؟').charAt(0).toUpperCase();
  }

  get joined(): string {
    const d = this.currentUser?.createdAt ? new Date(this.currentUser.createdAt) : null;
    return d && !Number.isNaN(d.getTime()) ? DATE_FMT.format(d) : '';
  }

  get profileChanged(): boolean {
    const v = this.profileForm.value;
    return v.username !== this.currentUser?.username || v.email !== this.currentUser?.email;
  }

  error(form: 'profile' | 'password', name: string): string | null {
    const submitted = form === 'profile' ? this.profileSubmitted : this.passwordSubmitted;
    const group = form === 'profile' ? this.profileForm : this.passwordForm;
    if (!submitted) return null;
    const e = group.get(name)?.errors;
    if (e?.['required']) return `${LABELS[name]} مطلوب.`;
    if (e?.['email']) return 'صيغة البريد الإلكتروني غير صحيحة.';
    if (e?.['minlength']) return `${LABELS[name]}: ${e['minlength'].requiredLength} أحرف على الأقل.`;
    if (name === 'confirmPassword' && group.errors?.['passwordMismatch']) return 'كلمتا المرور غير متطابقتين.';
    return null;
  }

  saveProfile(): void {
    this.profileSubmitted = true;
    this.profileError = '';
    if (this.profileForm.invalid || !this.profileChanged) return;
    const { username, email } = this.profileForm.value;
    this.savingProfile = true;
    this.authService.updateProfile({ username: String(username).trim(), email: String(email).trim() }).subscribe({
      next: () => {
        this.savingProfile = false;
        this.profileSubmitted = false;
        this.currentUser = { ...this.currentUser, username, email };
        this.toast.success('تم حفظ بيانات الحساب');
      },
      error: err => {
        this.savingProfile = false;
        const server = String(err?.error?.error || '');
        this.profileError = /exist|taken|duplicate|E11000/i.test(server)
          ? 'اسم المستخدم أو البريد مستخدم من قبل.' : 'تعذّر حفظ البيانات. حاول مرة أخرى.';
      }
    });
  }

  resetProfile(): void {
    this.profileSubmitted = false;
    this.profileError = '';
    this.profileForm.reset({ username: this.currentUser?.username, email: this.currentUser?.email });
  }

  savePassword(): void {
    this.passwordSubmitted = true;
    this.passwordError = '';
    if (this.passwordForm.invalid) return;
    const { currentPassword, newPassword } = this.passwordForm.value;
    this.savingPassword = true;
    this.authService.updateProfile({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.savingPassword = false;
        this.passwordSubmitted = false;
        this.passwordForm.reset();
        this.toast.success('تم تغيير كلمة المرور');
      },
      error: err => {
        this.savingPassword = false;
        this.passwordError = err?.status === 400 || err?.status === 401
          ? 'كلمة المرور الحالية غير صحيحة.' : 'تعذّر تغيير كلمة المرور. حاول مرة أخرى.';
      }
    });
  }
}
