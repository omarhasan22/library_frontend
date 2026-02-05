import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PublisherService, Publisher, PublisherResponse, PublisherStats } from '../../services/publisher.service';

@Component({
   selector: 'app-publisher-dashboard',
   templateUrl: './publisher-dashboard.component.html',
   styleUrls: ['./publisher-dashboard.component.css']
})
export class PublisherDashboardComponent implements OnInit {
   publishers: Publisher[] = [];
   stats: PublisherStats | null = null;
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
   publisherForm: FormGroup;
   isEditing = false;
   editingPublisher: Publisher | null = null;

   constructor(
      private publisherService: PublisherService,
      private fb: FormBuilder
   ) {
      this.publisherForm = this.fb.group({
         title: ['', [Validators.required, Validators.minLength(2)]]
      });
   }

   ngOnInit(): void {
      this.loadPublishers();
      this.loadStats();
   }

   loadPublishers(): void {
      this.loading = true;
      this.publisherService.getAllPublishers(this.currentPage, this.limit, this.searchTerm)
         .subscribe({
            next: (response: PublisherResponse) => {
               this.publishers = response.publishers;
               this.totalPages = response.totalPages;
               this.total = response.total;
               this.loading = false;
            },
            error: (error) => {
               this.showMessage('حدث خطأ أثناء تحميل الناشرين', 'error');
               this.loading = false;
            }
         });
   }

   loadStats(): void {
      this.publisherService.getPublisherStats().subscribe({
         next: (stats: PublisherStats) => {
            this.stats = stats;
         },
         error: (error) => {
            console.error('Failed to load stats:', error);
         }
      });
   }

   onSearch(): void {
      this.currentPage = 1;
      this.loadPublishers();
   }

   onPageChange(page: number): void {
      if (page >= 1 && page <= this.totalPages) {
         this.currentPage = page;
         this.loadPublishers();
      }
   }

   openAddForm(): void {
      this.isEditing = false;
      this.editingPublisher = null;
      this.publisherForm.reset();
   }

   openEditForm(publisher: Publisher): void {
      this.isEditing = true;
      this.editingPublisher = publisher;
      this.publisherForm.patchValue({
         title: publisher.title
      });
   }

   closeForm(): void {
      this.isEditing = false;
      this.editingPublisher = null;
      this.publisherForm.reset();
   }

   onSubmit(): void {
      if (this.publisherForm.valid) {
         const formData = this.publisherForm.value;

         if (this.isEditing && this.editingPublisher) {
            this.updatePublisher(this.editingPublisher._id!, formData);
         } else {
            this.createPublisher(formData);
         }
      }
   }

   createPublisher(publisherData: any): void {
      this.loading = true;
      this.publisherService.createPublisher(publisherData).subscribe({
         next: (publisher) => {
            this.showMessage('تم إضافة الناشر بنجاح', 'success');
            this.loadPublishers();
            this.loadStats();
            this.closeForm();
            this.loading = false;
         },
         error: (error) => {
            this.showMessage('حدث خطأ أثناء إضافة الناشر', 'error');
            this.loading = false;
         }
      });
   }

   updatePublisher(id: string, publisherData: any): void {
      this.loading = true;
      this.publisherService.updatePublisher(id, publisherData).subscribe({
         next: (publisher) => {
            this.showMessage('تم تحديث الناشر بنجاح', 'success');
            this.loadPublishers();
            this.closeForm();
            this.loading = false;
         },
         error: (error) => {
            this.showMessage('حدث خطأ أثناء تحديث الناشر', 'error');
            this.loading = false;
         }
      });
   }

   deletePublisher(publisher: Publisher): void {
      if (confirm(`هل أنت متأكد من حذف الناشر "${publisher.title}"؟`)) {
         this.loading = true;
         this.publisherService.deletePublisher(publisher._id!).subscribe({
            next: () => {
               this.showMessage('تم حذف الناشر بنجاح', 'success');
               this.loadPublishers();
               this.loadStats();
               this.loading = false;
            },
            error: (error) => {
               this.showMessage('حدث خطأ أثناء حذف الناشر', 'error');
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

}
