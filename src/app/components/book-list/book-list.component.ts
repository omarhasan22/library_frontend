import { Component, Input, OnInit, SimpleChange } from '@angular/core';
import { Router } from '@angular/router';
import { BookService } from '../../services/book.service';
import { Book } from '../../models/book.model';

@Component({
  selector: 'app-book-list',
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.css']
})
export class BookListComponent implements OnInit {
  books: Book[] = [];
  searchQuery: string = '';
  @Input() addedBook: Book | null = null;

  constructor(private bookService: BookService, private router: Router) { }

  ngOnInit(): void {
    this.loadBooks();
  }

  ngOnChanges(changes: SimpleChange): void {
    if (changes['addedBook'] && this.addedBook) {
      this.books.push(this.addedBook);
    }
  }

  loadBooks(): void {
    this.bookService.getAllBooks(this.searchQuery).subscribe(
      (data) => (this.books = data),
      (error) => console.error('Error fetching books:', error)
    );
  }

  onSearch(): void {
    this.loadBooks();
  }

  viewBook(id: any): void {
    this.router.navigate(['/books', id]);
  }
}
