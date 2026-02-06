import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthorService, Author, AuthorResponse, AuthorStats } from '../../services/author.service';
import { AuthService } from '../../services/auth.service';

@Component({
   selector: 'app-author-dashboard',
   templateUrl: './author-dashboard.component.html',
   styleUrls: ['./author-dashboard.component.css']
})
export class AuthorDashboardComponent implements OnInit {
   authors: Author[] = [];
   stats: AuthorStats | null = null;
   loading = false;
   message = '';
   messageType = '';

   // Pagination
   currentPage = 1;
   totalPages = 1;
   total = 0;
   limit = 10;

   // Search and filters
   searchTerm = '';
   selectedType = '';

   // Form
   authorForm: FormGroup;
   isEditing = false;
   editingAuthor: Author | null = null;

   // Admin check
   isAdmin = false;

   // Author types
   authorTypes = [
      { value: 'author', label: 'مؤلف' },
      { value: 'editor', label: 'محقق' },
      { value: 'caretaker', label: 'معتني' },
      { value: 'publisher', label: 'ناشر' },
      { value: 'commentator', label: 'شارح' },
      { value: 'muhashi', label: 'محشي' }
   ];

   constructor(
      private authorService: AuthorService,
      private fb: FormBuilder,
      private authService: AuthService,
      private router: Router
   ) {
      this.authorForm = this.fb.group({
         name: ['', [Validators.required, Validators.minLength(2)]],
         dateOfBirth: [''],
         dateOfDeath: [''],
         type: ['author', [Validators.required]]
      });
   }

   ngOnInit(): void {
      // Check if user is admin
      this.authService.currentUser$.subscribe(user => {
         this.isAdmin = user?.role === 'admin';
         if (!this.isAdmin) {
            // Redirect non-admin users to home page
            this.router.navigate(['/']);
            return;
         }
         // Only load data if user is admin
         this.loadAuthors();
         this.loadStats();
      });
   }

   loadAuthors(): void {
      this.loading = true;
      this.authorService.getAllAuthors(this.currentPage, this.limit, this.searchTerm, this.selectedType)
         .subscribe({
            next: (response: AuthorResponse) => {
               this.authors = response.authors;
               this.totalPages = response.totalPages;
               this.total = response.total;
               this.loading = false;
            },
            error: (error) => {
               this.showMessage('حدث خطأ أثناء تحميل المؤلفين', 'error');
               this.loading = false;
            }
         });
   }

   loadStats(): void {
      this.authorService.getAuthorStats().subscribe({
         next: (stats: AuthorStats) => {
            this.stats = stats;
         },
         error: (error) => {
            console.error('Failed to load stats:', error);
         }
      });
   }

   onSearch(): void {
      this.currentPage = 1;
      this.loadAuthors();
   }

   onTypeFilter(): void {
      this.currentPage = 1;
      this.loadAuthors();
   }

   onPageChange(page: number): void {
      if (page >= 1 && page <= this.totalPages) {
         this.currentPage = page;
         this.loadAuthors();
      }
   }

   openAddForm(): void {
      this.isEditing = false;
      this.editingAuthor = null;
      this.authorForm.reset();
      this.authorForm.patchValue({ type: 'author' });
   }

   openEditForm(author: Author): void {
      this.isEditing = true;
      this.editingAuthor = author;
      this.authorForm.patchValue({
         name: author.name,
         dateOfBirth: author.dateOfBirth ? this.formatDateForInput(author.dateOfBirth) : '',
         dateOfDeath: author.dateOfDeath ? this.formatDateForInput(author.dateOfDeath) : '',
         type: author.type
      });
   }

   closeForm(): void {
      this.isEditing = false;
      this.editingAuthor = null;
      this.authorForm.reset();
   }

   onSubmit(): void {
      if (this.authorForm.valid) {
         const formData = this.authorForm.value;

         if (this.isEditing && this.editingAuthor) {
            this.updateAuthor(this.editingAuthor._id!, formData);
         } else {
            this.createAuthor(formData);
         }
      }
   }

   createAuthor(authorData: any): void {
      this.loading = true;
      this.authorService.createAuthor(authorData).subscribe({
         next: (author) => {
            this.showMessage('تم إضافة المؤلف بنجاح', 'success');
            this.loadAuthors();
            this.loadStats();
            this.closeForm();
            this.loading = false;
         },
         error: (error) => {
            this.showMessage('حدث خطأ أثناء إضافة المؤلف', 'error');
            this.loading = false;
         }
      });
   }

   updateAuthor(id: string, authorData: any): void {
      this.loading = true;
      this.authorService.updateAuthor(id, authorData).subscribe({
         next: (author) => {
            this.showMessage('تم تحديث المؤلف بنجاح', 'success');
            this.loadAuthors();
            this.closeForm();
            this.loading = false;
         },
         error: (error) => {
            this.showMessage('حدث خطأ أثناء تحديث المؤلف', 'error');
            this.loading = false;
         }
      });
   }

   deleteAuthor(author: Author): void {
      if (confirm(`هل أنت متأكد من حذف المؤلف "${author.name}"؟`)) {
         this.loading = true;
         this.authorService.deleteAuthor(author._id!).subscribe({
            next: () => {
               this.showMessage('تم حذف المؤلف بنجاح', 'success');
               this.loadAuthors();
               this.loadStats();
               this.loading = false;
            },
            error: (error) => {
               this.showMessage('حدث خطأ أثناء حذف المؤلف', 'error');
               this.loading = false;
            }
         });
      }
   }

   getAuthorTypeLabel(type: string): string {
      const authorType = this.authorTypes.find(t => t.value === type);
      return authorType ? authorType.label : type;
   }

   formatDateForInput(date: Date | string): string {
      const d = new Date(date);
      return d.toISOString().split('T')[0];
   }

   formatDate(date: Date | string): string {
      const d = new Date(date);
      return d.toLocaleDateString('ar-EG');
   }

   showMessage(message: string, type: 'success' | 'error'): void {
      this.message = message;
      this.messageType = type;
      setTimeout(() => {
         this.message = '';
      }, 5000);
   }

}
