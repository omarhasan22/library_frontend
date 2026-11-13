import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { BorrowService } from '../../services/borrow.service';
import { Borrow } from '../../models/borrow.model';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

import { ToastService } from '../../shared/services/toast.service';
import { ConfirmService } from '../../shared/services/confirm.service';
@Component({
   selector: 'app-user-borrows',
   templateUrl: './user-borrows.component.html',
   styleUrls: ['./user-borrows.component.css']
})
export class UserBorrowsComponent implements OnInit, OnDestroy {
   private userSubscription?: Subscription;
   Math = Math; // Expose Math to template

   borrows: Borrow[] = [];
   activeBorrows: Borrow[] = [];
   returnedBorrows: Borrow[] = [];

   activeTab = 'active'; // active, returned, all
   loading = false;

   isLoggedIn = false;
   currentUser: any = null;

   constructor(
      private borrowService: BorrowService,
      private authService: AuthService,
      private router: Router,
      private toast: ToastService,
      private dialog: ConfirmService
    ) { }

   ngOnInit(): void {
      // The route's authGuard guarantees a session; load once, and just track the user for display.
      this.isLoggedIn = true;
      this.loadMyBorrows();
      this.userSubscription = this.authService.currentUser$.subscribe(user => {
         this.currentUser = user;
      });
   }

   ngOnDestroy(): void {
      this.userSubscription?.unsubscribe();
   }

   loadMyBorrows(): void {
      this.loading = true;

      this.borrowService.getMyBorrows('all')
         .subscribe(
            (borrows: Borrow[]) => {
               this.borrows = borrows;
               this.activeBorrows = borrows.filter(b => !b.returned);
               this.returnedBorrows = borrows.filter(b => b.returned);
               this.loading = false;
            },
            (error) => {
               console.error('Error loading borrows:', error);
               this.loading = false;
            }
         );
   }

   getCurrentBorrows(): Borrow[] {
      switch (this.activeTab) {
         case 'active':
            return this.activeBorrows;
         case 'returned':
            return this.returnedBorrows;
         default:
            return this.borrows;
      }
   }

   setActiveTab(tab: string): void {
      this.activeTab = tab;
   }

   isOverdue(endDate: Date): boolean {
      return new Date(endDate) < new Date();
   }

   getDaysUntilDue(endDate: Date): number {
      const today = new Date();
      const due = new Date(endDate);
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
   }

   getBookTitle(borrow: Borrow): string {
      if (typeof borrow.book === 'string') {
         return 'كتاب غير محدد';
      }
      return borrow.book?.title || 'كتاب غير محدد';
   }

   getBookAuthors(borrow: Borrow): string {
      if (typeof borrow.book === 'string') {
         return '';
      }
      if (borrow.book?.authors && Array.isArray(borrow.book.authors)) {
         return borrow.book.authors.map((author: any) => author.name).join('، ');
      }
      return '';
   }

   getStatusText(borrow: Borrow): string {
      if (borrow.returned) {
         return 'مُرجع';
      }
      if (this.isOverdue(borrow.endDate)) {
         return 'متأخر';
      }
      const daysLeft = this.getDaysUntilDue(borrow.endDate);
      if (daysLeft <= 3) {
         return 'قارب الانتهاء';
      }
      return 'نشط';
   }

   getStatusClass(borrow: Borrow): string {
      if (borrow.returned) {
         return 'status-returned';
      }
      if (this.isOverdue(borrow.endDate)) {
         return 'status-overdue';
      }
      const daysLeft = this.getDaysUntilDue(borrow.endDate);
      if (daysLeft <= 3) {
         return 'status-warning';
      }
      return 'status-active';
   }

   getProgressPercentage(borrow: Borrow): number {
      if (borrow.returned) {
         return 100;
      }

      const start = new Date(borrow.startDate);
      const end = new Date(borrow.endDate);
      const now = new Date();

      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const passedDays = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      return Math.min(Math.max((passedDays / totalDays) * 100, 0), 100);
   }

   navigateToBook(borrow: Borrow): void {
      if (typeof borrow.book === 'object' && borrow.book?._id) {
         this.router.navigate(['/books', borrow.book._id]);
      }
   }

   getOverdueBorrowsCount(): number {
      return this.activeBorrows.filter(b => this.isOverdue(b.endDate)).length;
   }

   getBorrowDurationDays(borrow: Borrow): number {
      const startTime = new Date(borrow.startDate).getTime();
      const endTime = new Date(borrow.endDate).getTime();
      return Math.round((endTime - startTime) / (1000 * 60 * 60 * 24));
   }

   async returnBook(borrow: Borrow): Promise<void> {
      const bookTitle = this.getBookTitle(borrow);
      const isOverdue = this.isOverdue(borrow.endDate);
      const daysInfo = isOverdue
         ? `متأخر ${Math.abs(this.getDaysUntilDue(borrow.endDate))} يوم`
         : `باقي ${this.getDaysUntilDue(borrow.endDate)} يوم`;

      const confirmMessage = `هل أنت متأكد من إرجاع هذا الكتاب؟\n\nالكتاب: ${bookTitle}\nالحالة: ${daysInfo}`;

      if ((await this.dialog.ask({ title: 'تأكيد إرجاع الكتاب؟', message: confirmMessage, confirmText: 'إرجاع' }))) {
         this.borrowService.returnBook(borrow._id!)
            .subscribe(
               () => {
                  this.toast.success('تم إرجاع الكتاب بنجاح!');
                  this.loadMyBorrows(); // Reload the list
               },
               (error) => {
                  console.error('Error returning book:', error);
                  this.toast.apiError(error, 'حدث خطأ في إرجاع الكتاب');
               }
            );
      }
   }

   canReturnBook(borrow: Borrow): boolean {
      return !borrow.returned;
   }
}