import { Component, OnDestroy, OnInit, Renderer2  } from '@angular/core';
import { Router } from '@angular/router';
import { BookService } from '../services/book.service';
import { Book } from '../models/book.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  books: Book[] = [];
  selectedBook: Book | null = null;
  searchQuery: string = '';
  private scrollHandler: () => void;

  constructor(private bookService: BookService, private router: Router,private renderer: Renderer2) {}

  ngOnInit(): void {
    this.loadBooks();

     // on init, attach our handler
    this.scrollHandler = this.renderer.listen('window', 'scroll', () => {
      const nav = document.querySelector('#mainNav');
      if (!nav) return;
      if (window.scrollY < 100) {
        nav.classList.remove('navbar-shrink');
      } else {
        nav.classList.add('navbar-shrink');
      }
    });

    // also call once to set initial state
    this.scrollHandler();
  }

  ngOnDestroy() {
    // remove listener when leaving home page
    if (this.scrollHandler) {
      this.scrollHandler();
    }
    // and clean up the class so other pages start “un-shrunk”
    const nav = document.querySelector('#mainNav');
    if (nav) {
      nav.classList.remove('navbar-shrink');
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
    this.bookService.getBookById(id).subscribe(
      (data) => (this.selectedBook = data),
      (error) => console.error('Error fetching book:', error)
    );
  }

  clearSelection(): void {
    this.selectedBook = null;
  }
}
