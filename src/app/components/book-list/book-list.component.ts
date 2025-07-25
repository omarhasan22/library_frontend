import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
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

  getNames(list?: { name?: string }[]): string {
    return list && list.length ? list.map(i => i.name).filter(Boolean).join(', ') : '—';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['addedBook'] && this.addedBook) {
      // Check if book already exists (avoid duplicates)
      const exists = this.books.some(book => book._id === this.addedBook!._id);
      if (!exists) {
        this.books.unshift(this.addedBook); // Add to top
      }
    }
  }

  loadBooks(): void {
    this.bookService.getAllBooks(this.searchQuery).subscribe(
      (data) => this.books = data,
      (error) => console.error('Error fetching books:', error)
    );
  }

  onSearch(): void {
    this.bookService.getAllBooks(this.searchQuery).subscribe(
      (data) => this.books = data,
      (error) => console.error('Error:', error)
    );
  }

  viewBook(id: string): void {
    this.router.navigate(['/books', id]);
  }
}
