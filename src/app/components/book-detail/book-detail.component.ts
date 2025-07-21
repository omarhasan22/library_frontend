import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookService } from '../../services/book.service';
import { Book } from '../../models/book.model';

@Component({
  selector: 'app-book-detail',
  templateUrl: './book-detail.component.html',
  styleUrls: ['./book-detail.component.css']
})
export class BookDetailComponent implements OnInit {
  book!: Book;
  borrowDuration: number = 1;
  showBorrowForm = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookService: BookService
  ) {
  }

  ngOnInit(): void {
    const bookId = this.route.snapshot.paramMap.get('id');
    if (bookId) {
      this.bookService.getBookById(bookId).subscribe(
        (b) => this.book = b,
        (err) => console.error('Failed to load book', err)
      );
    }

  }

  // borrowBook(): void {
  //   if (!this.book || !this.book._id) return;
  //   const payload = { bookId: this.book._id, duration: this.borrowDuration };

  //   this.bookService.borrowBook(payload).subscribe(
  //     () => {
  //       alert('تمت استعارة الكتاب بنجاح');
  //       this.showBorrowForm = false;
  //     },
  //     (err) => {
  //       alert('حدث خطأ في الاستعارة');
  //       console.error(err);
  //     }
  //   );
  // }

  editBook(): void {
    this.router.navigate(['/books/edit', this.book._id]);
  }

  deleteBook(): void {
    if (!confirm('هل أنت متأكد من حذف هذا الكتاب؟')) return;

    this.bookService.deleteBook(this.book._id!).subscribe(
      () => {
        alert('تم حذف الكتاب');
        this.router.navigate(['/books']);
      },
      (err) => {
        alert('فشل حذف الكتاب');
        console.error(err);
      }
    );
  }
}
