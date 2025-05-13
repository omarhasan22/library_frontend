import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BookService } from '../../services/book.service';
import { Book } from '../../models/book.model';

@Component({
  selector: 'app-book-detail',
  templateUrl: './book-detail.component.html',
  styleUrls: ['./book-detail.component.css']
})
export class BookDetailComponent implements OnInit {
  book: Book | null = null;

  constructor(private route: ActivatedRoute, private bookService: BookService) {}

  ngOnInit(): void {
    const bookId = this.route.snapshot.paramMap.get('id');
    if (bookId) {
      this.loadBook(bookId);
    }
  }

  loadBook(id: string): void {
    this.bookService.getBookById(id).subscribe(
      (data) => (this.book = data),
      (error) => console.error('Error fetching book details:', error)
    );
  }
}
