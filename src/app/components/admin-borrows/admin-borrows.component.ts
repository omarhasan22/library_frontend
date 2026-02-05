import { Component, OnInit } from '@angular/core';
import { BorrowService, BorrowResponse, BorrowStatistics } from '../../services/borrow.service';
import { Borrow } from '../../models/borrow.model';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

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
    private router: Router
  ) { }

  ngOnInit(): void {
    // Temporarily load without admin check for testing
    this.isAdmin = true;
    this.loadBorrows();
    this.loadStatistics();

    // Check if user is admin
    this.authService.currentUser$.subscribe(user => {
      console.log('AdminBorrows - Current user:', user);
      console.log('AdminBorrows - User role:', user?.role);
    });
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

  returnBook(borrowId: string): void {
    if (confirm('هل أنت متأكد من إرجاع هذا الكتاب؟')) {
      this.borrowService.returnBook(borrowId)
        .subscribe(
          () => {
            alert('تم إرجاع الكتاب بنجاح');
            this.loadBorrows();
            this.loadStatistics();
          },
          (error) => {
            console.error('Error returning book:', error);
            alert('حدث خطأ في إرجاع الكتاب');
          }
        );
    }
  }

  sendDueDateReminders(): void {
    if (confirm('هل تريد إرسال تذكيرات موعد الإرجاع لجميع المستعيرين؟')) {
      this.borrowService.sendDueDateReminders()
        .subscribe(
          (response) => {
            alert(`تم إرسال ${response.results.filter((r: any) => r.success).length} تذكير بنجاح`);
          },
          (error) => {
            console.error('Error sending reminders:', error);
            alert('حدث خطأ في إرسال التذكيرات');
          }
        );
    }
  }

  sendOverdueNotifications(): void {
    if (confirm('هل تريد إرسال تنبيهات التأخير لجميع المتأخرين؟')) {
      this.borrowService.sendOverdueNotifications()
        .subscribe(
          (response) => {
            alert(`تم إرسال ${response.results.filter((r: any) => r.success).length} تنبيه بنجاح`);
          },
          (error) => {
            console.error('Error sending notifications:', error);
            alert('حدث خطأ في إرسال التنبيهات');
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