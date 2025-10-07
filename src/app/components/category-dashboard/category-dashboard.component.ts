import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryService, Category, CategoryResponse, CategoryStats } from '../../services/category.service';

@Component({
   selector: 'app-category-dashboard',
   templateUrl: './category-dashboard.component.html',
   styleUrls: ['./category-dashboard.component.css']
})
export class CategoryDashboardComponent implements OnInit {
   categories: Category[] = [];
   stats: CategoryStats | null = null;
   loading = false;
   message = '';
   messageType = '';

   // Pagination
   currentPage = 1;
   totalPages = 1;
   total = 0;
   limit = 10;

   // Search
   searchTerm = '';

   // Form
   categoryForm: FormGroup;
   isEditing = false;
   editingCategory: Category | null = null;

   constructor(
      private categoryService: CategoryService,
      private fb: FormBuilder
   ) {
      this.categoryForm = this.fb.group({
         title: ['', [Validators.required, Validators.minLength(2)]]
      });
   }

   ngOnInit(): void {
      this.loadCategories();
      this.loadStats();
   }

   loadCategories(): void {
      this.loading = true;
      this.categoryService.getAllCategories(this.currentPage, this.limit, this.searchTerm)
         .subscribe({
            next: (response: CategoryResponse) => {
               this.categories = response.categories;
               this.totalPages = response.totalPages;
               this.total = response.total;
               this.loading = false;
            },
            error: (error) => {
               this.showMessage('حدث خطأ أثناء تحميل التصنيفات', 'error');
               this.loading = false;
            }
         });
   }

   loadStats(): void {
      this.categoryService.getCategoryStats().subscribe({
         next: (stats: CategoryStats) => {
            this.stats = stats;
         },
         error: (error) => {
            console.error('Failed to load stats:', error);
         }
      });
   }

   onSearch(): void {
      this.currentPage = 1;
      this.loadCategories();
   }

   onPageChange(page: number): void {
      this.currentPage = page;
      this.loadCategories();
   }

   openAddForm(): void {
      this.isEditing = false;
      this.editingCategory = null;
      this.categoryForm.reset();
   }

   openEditForm(category: Category): void {
      this.isEditing = true;
      this.editingCategory = category;
      this.categoryForm.patchValue({
         title: category.title
      });
   }

   closeForm(): void {
      this.isEditing = false;
      this.editingCategory = null;
      this.categoryForm.reset();
   }

   onSubmit(): void {
      if (this.categoryForm.valid) {
         const formData = this.categoryForm.value;

         if (this.isEditing && this.editingCategory) {
            this.updateCategory(this.editingCategory._id!, formData);
         } else {
            this.createCategory(formData);
         }
      }
   }

   createCategory(categoryData: any): void {
      this.loading = true;
      this.categoryService.createCategory(categoryData).subscribe({
         next: (category) => {
            this.showMessage('تم إضافة التصنيف بنجاح', 'success');
            this.loadCategories();
            this.loadStats();
            this.closeForm();
            this.loading = false;
         },
         error: (error) => {
            this.showMessage('حدث خطأ أثناء إضافة التصنيف', 'error');
            this.loading = false;
         }
      });
   }

   updateCategory(id: string, categoryData: any): void {
      this.loading = true;
      this.categoryService.updateCategory(id, categoryData).subscribe({
         next: (category) => {
            this.showMessage('تم تحديث التصنيف بنجاح', 'success');
            this.loadCategories();
            this.closeForm();
            this.loading = false;
         },
         error: (error) => {
            this.showMessage('حدث خطأ أثناء تحديث التصنيف', 'error');
            this.loading = false;
         }
      });
   }

   deleteCategory(category: Category): void {
      if (confirm(`هل أنت متأكد من حذف التصنيف "${category.title}"؟`)) {
         this.loading = true;
         this.categoryService.deleteCategory(category._id!).subscribe({
            next: () => {
               this.showMessage('تم حذف التصنيف بنجاح', 'success');
               this.loadCategories();
               this.loadStats();
               this.loading = false;
            },
            error: (error) => {
               this.showMessage('حدث خطأ أثناء حذف التصنيف', 'error');
               this.loading = false;
            }
         });
      }
   }

   showMessage(message: string, type: 'success' | 'error'): void {
      this.message = message;
      this.messageType = type;
      setTimeout(() => {
         this.message = '';
      }, 5000);
   }

   getPaginationPages(): number[] {
      const pages: number[] = [];
      const start = Math.max(1, this.currentPage - 2);
      const end = Math.min(this.totalPages, this.currentPage + 2);

      for (let i = start; i <= end; i++) {
         pages.push(i);
      }

      return pages;
   }
}
