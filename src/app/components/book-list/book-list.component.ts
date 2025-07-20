import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BookService } from '../../services/book.service';
import { Book } from '../../models/book.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-book-list',
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.css']
})
export class BookListComponent implements OnInit, OnDestroy {
  books: Book[] = [];
  searchQuery: string = '';
  private refreshSub!: Subscription;

  constructor(private bookService: BookService, private router: Router) {}

  ngOnInit(): void {
    this.loadBooks();

    // 👇 Subscribe to refresh events
    this.refreshSub = this.bookService.onRefreshBooks().subscribe(() => {
      this.loadBooks();
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSub) {
      this.refreshSub.unsubscribe();
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
