import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BookService } from '../../services/book.service';
import { BorrowService } from '../../services/borrow.service';

@Component({
  selector: 'app-book-detail',
  templateUrl: './book-detail.component.html',
  styleUrls: ['./book-detail.component.css']
})
export class BookDetailComponent implements OnInit {
  book: any = null;
  showBorrowForm = false;
  borrowDuration: number = 1; // months
  constructor(private route: ActivatedRoute, private bookService: BookService, private borrowService :BorrowService) {}

  ngOnInit(): void {
    const bookId = this.route.snapshot.paramMap.get('id');
    if (bookId) {
      this.loadBook(bookId);
    }
  }

  loadBook(id: string): void {
    this.bookService.getBookById(id).subscribe(
      (data) => this.book = data,
      (error) => console.error('Error fetching book details:', error)
    );
  }

borrowBook(): void {
  if (!this.borrowDuration || this.borrowDuration < 1) {
    alert('Please enter a valid duration in months.');
    return;
  }

  const startDate = new Date(); // current date
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + this.borrowDuration, startDate.getDate() - 1);

  const formattedStartDate = startDate.toISOString().slice(0, 10);
  const formattedEndDate = endDate.toISOString().slice(0, 10);

  this.borrowService.borrowBook(this.book._id, formattedStartDate, formattedEndDate).subscribe({
    next: (res) => {
      alert('Book borrowed successfully!');
      this.showBorrowForm = false;
    },
    error: (err) => {
      alert('Failed to borrow the book: ' + err.error?.error || err.message);
    }
  });
}

}

  


