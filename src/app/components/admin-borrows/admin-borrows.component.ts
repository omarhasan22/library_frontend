import { Component, OnInit } from '@angular/core';
import { BorrowService, BorrowResponse, BorrowStatistics } from '../../services/borrow.service';
import { Borrow } from '../../models/borrow.model';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

import { ToastService } from '../../shared/services/toast.service';
import { ConfirmService } from '../../shared/services/confirm.service';
@Component({
  selector: 'app-admin-borrows',
  templateUrl: './admin-borrows.component.html',
  styleUrls: ['./admin-borrows.component.css']
})
export class AdminBorrowsComponent implements OnInit {
  Math = Math; // Expose Math to template

  borrows: Borrow[] = [];
  statistics: BorrowStatistics = {
    totalBorrows: 0,
    activeBorrows: 0,
    returnedBooks: 0,
    overdueBooks: 0
  };

  currentPage = 1;
  totalPages = 1;
  totalBorrows = 0;
  limit = 20;

  statusFilter = 'all'; // all, active, returned
  loading = false;
  loadingStats = false;

  isAdmin = false;

  constructor(
    private borrowService: BorrowService,
    private authService: AuthService,
    private router: Router,
    private toast: ToastService,
    private dialog: ConfirmService
  ) { }

  ngOnInit(): void {
    // The route's adminGuard has already checked the role (and the API enforces it).
    this.isAdmin = this.authService.isAdmin();
    this.loadBorrows();
    this.loadStatistics();
  }

  loadBorrows(): void {
    this.loading = true;

    this.borrowService.getAllBorrows(this.currentPage, this.limit, this.statusFilter)
      .subscribe(
        (response: BorrowResponse) => {
          this.borrows = response.borrows;
          this.currentPage = response.currentPage;
          this.totalPages = response.totalPages;
          this.totalBorrows = response.total;
          this.loading = false;
        },
        (error) => {
          console.error('Error loading borrows:', error);
          this.loading = false;
        }
      );
  }

  loadStatistics(): void {
    this.loadingStats = true;

    this.borrowService.getBorrowStatistics()
      .subscribe(
        (stats: BorrowStatistics) => {
          this.statistics = stats;
          this.loadingStats = false;
        },
        (error) => {
          console.error('Error loading statistics:', error);
          this.loadingStats = false;
        }
      );
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.loadBorrows();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadBorrows();
    }
  }

  async returnBook(borrowId: string): Promise<void> {
    if ((await this.dialog.ask({ title: 'تأكيد إرجاع الكتاب؟', confirmText: 'إرجاع' }))) {
      this.borrowService.returnBook(borrowId)
        .subscribe(
          () => {
            this.toast.success('تم إرجاع الكتاب بنجاح');
            this.loadBorrows();
            this.loadStatistics();
          },
          (error) => {
            console.error('Error returning book:', error);
            this.toast.error('حدث خطأ في إرجاع الكتاب');
          }
        );
    }
  }

  async sendDueDateReminders(): Promise<void> {
    if ((await this.dialog.ask({ title: 'إرسال تذكيرات موعد الإرجاع؟', message: 'سيصل تذكير بالبريد إلى جميع المستعيرين الحاليين.', confirmText: 'إرسال' }))) {
      this.borrowService.sendDueDateReminders()
        .subscribe(
          (response) => {
            this.toast.success(`تم إرسال ${response.results.filter((r: any) => r.success).length} تذكير بنجاح`);
          },
          (error) => {
            console.error('Error sending reminders:', error);
            this.toast.error('حدث خطأ في إرسال التذكيرات');
          }
        );
    }
  }

  async sendOverdueNotifications(): Promise<void> {
    if ((await this.dialog.ask({ title: 'إرسال تنبيهات التأخير؟', message: 'سيصل تنبيه بالبريد إلى جميع المتأخرين في الإرجاع.', confirmText: 'إرسال' }))) {
      this.borrowService.sendOverdueNotifications()
        .subscribe(
          (response) => {
            this.toast.success(`تم إرسال ${response.results.filter((r: any) => r.success).length} تنبيه بنجاح`);
          },
          (error) => {
            console.error('Error sending notifications:', error);
            this.toast.error('حدث خطأ في إرسال التنبيهات');
          }
        );
    }
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

  getUserName(borrow: Borrow): string {
    if (typeof borrow.user === 'string') {
      return 'مستخدم غير محدد';
    }
    return borrow.user?.username || 'مستخدم غير محدد';
  }

  getUserEmail(borrow: Borrow): string {
    if (typeof borrow.user === 'string') {
      return '';
    }
    return borrow.user?.email || '';
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

}