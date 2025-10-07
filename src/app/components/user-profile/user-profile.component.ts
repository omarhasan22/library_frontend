import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService, User } from '../../services/auth.service';

@Component({
   selector: 'app-user-profile',
   templateUrl: './user-profile.component.html',
   styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
   profileForm: FormGroup;
   passwordForm: FormGroup;
   currentUser: User | null = null;
   loading = false;
   message = '';
   messageType = '';
   isEditingProfile = false;
   isEditingPassword = false;

   constructor(
      private fb: FormBuilder,
      private authService: AuthService
   ) {
      this.profileForm = this.fb.group({
         username: ['', [Validators.required, Validators.minLength(3)]],
         email: ['', [Validators.required, Validators.email]]
      });

      this.passwordForm = this.fb.group({
         currentPassword: ['', [Validators.required]],
         newPassword: ['', [Validators.required, Validators.minLength(6)]],
         confirmPassword: ['', [Validators.required]]
      }, { validators: this.passwordMatchValidator });
   }

   ngOnInit(): void {
      this.loadCurrentUser();
   }

   loadCurrentUser(): void {
      // First try to get fresh data from API
      this.authService.getProfile().subscribe({
         next: (user) => {
            this.currentUser = user;
            this.profileForm.patchValue({
               username: user.username,
               email: user.email
            });
         },
         error: (error) => {
            console.error('Failed to load profile, using cached data:', error);
            // Fallback to cached user data
            this.authService.currentUser$.subscribe(user => {
               if (user) {
                  this.currentUser = user;
                  this.profileForm.patchValue({
                     username: user.username,
                     email: user.email
                  });
               }
            });
         }
      });
   }

   passwordMatchValidator(form: FormGroup) {
      const newPassword = form.get('newPassword');
      const confirmPassword = form.get('confirmPassword');

      if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
         confirmPassword.setErrors({ passwordMismatch: true });
         return { passwordMismatch: true };
      }

      return null;
   }

   startEditingProfile(): void {
      this.isEditingProfile = true;
      this.message = '';
   }

   cancelEditingProfile(): void {
      this.isEditingProfile = false;
      this.profileForm.patchValue({
         username: this.currentUser?.username || '',
         email: this.currentUser?.email || ''
      });
      this.message = '';
   }

   onProfileSubmit(): void {
      if (this.profileForm.valid) {
         this.loading = true;
         this.message = '';

         const { username, email } = this.profileForm.value;

         this.authService.updateProfile({ username, email }).subscribe({
            next: (response) => {
               this.message = 'تم تحديث الملف الشخصي بنجاح';
               this.messageType = 'success';
               this.loading = false;
               this.isEditingProfile = false;
            },
            error: (error) => {
               this.message = error.error?.error || 'حدث خطأ أثناء تحديث الملف الشخصي';
               this.messageType = 'error';
               this.loading = false;
            }
         });
      }
   }

   startEditingPassword(): void {
      this.isEditingPassword = true;
      this.passwordForm.reset();
      this.message = '';
   }

   cancelEditingPassword(): void {
      this.isEditingPassword = false;
      this.passwordForm.reset();
      this.message = '';
   }

   onPasswordSubmit(): void {
      if (this.passwordForm.valid) {
         this.loading = true;
         this.message = '';

         const { currentPassword, newPassword } = this.passwordForm.value;

         this.authService.updateProfile({
            currentPassword,
            newPassword
         }).subscribe({
            next: (response) => {
               this.message = 'تم تحديث كلمة المرور بنجاح';
               this.messageType = 'success';
               this.passwordForm.reset();
               this.loading = false;
               this.isEditingPassword = false;
            },
            error: (error) => {
               this.message = error.error?.error || 'حدث خطأ أثناء تحديث كلمة المرور';
               this.messageType = 'error';
               this.loading = false;
            }
         });
      }
   }

   getFieldError(fieldName: string): string {
      const field = this.profileForm.get(fieldName);
      if (field?.errors && field.touched) {
         if (field.errors['required']) return `${fieldName} مطلوب`;
         if (field.errors['email']) return 'البريد الإلكتروني غير صحيح';
         if (field.errors['minlength']) return `${fieldName} يجب أن يكون 3 أحرف على الأقل`;
      }
      return '';
   }

   getPasswordFieldError(fieldName: string): string {
      const field = this.passwordForm.get(fieldName);
      if (field?.errors && field.touched) {
         if (field.errors['required']) return `${fieldName} مطلوب`;
         if (field.errors['minlength']) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
         if (field.errors['passwordMismatch']) return 'كلمات المرور غير متطابقة';
      }
      return '';
   }

   clearMessage(): void {
      this.message = '';
   }
}
