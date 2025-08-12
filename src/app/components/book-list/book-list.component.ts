import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { BookService } from '../../services/book.service';
import { Book } from '../../models/book.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-book-list',
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.css'],
  standalone: false

})
export class BookListComponent implements OnInit {
  books: Book[] = [];
  searchQuery: string = '';
  @Input() addedBook: Book | null = null;

  totalBooks: number = 0;
  uniqueAuthors: number = 0;
  uniquePublishers: number = 0;

  searchOption: string = 'all';
  searchTerm: string = '';
  searchFilters = [
    { field: 'all', value: '' } // default empty search
  ];
  categories = [
    { key: 'title', value: 'العنوان' },
    { key: 'authors', value: 'المؤلف' },
    { key: 'commentators', value: 'الشارحون' },
    { key: 'editors', value: 'المحقق' },
    { key: 'caretakers', value: 'من اعتنى بهم' },
    { key: 'numberOfVolumes', value: 'عدد الأجزاء' },
    { key: 'numberOfFolders', value: 'عدد المجلدات' },
    { key: 'publishers', value: 'الدار' },
    { key: 'editionNumber', value: 'رقم الطبعة' },
    { key: 'publicationYear', value: 'سنة الطباعة' },
    { key: 'category', value: 'التصنيف' },
    { key: 'subject', value: 'التصنيف الفرعي' },
    { key: 'roomNumber', value: ' الغرفة' },
    { key: 'wallNumber', value: ' الاستاند' },
    { key: 'shelfNumber', value: ' الرف' },
    { key: 'bookNumber', value: 'الكتاب ' }
  ];
  private refreshSub!: Subscription;

  constructor(private bookService: BookService, private router: Router) { }

  ngOnInit(): void {
    const saved = localStorage.getItem('bookSearchFilters');
    if (saved) {
      this.searchFilters = JSON.parse(saved);
    }
    this.loadBooks();
  }

  getNames(list?: { name?: string }[]): string {
    return list && list.length ? list.map(i => i.name).filter(Boolean).join(', ') : '—';
  }

  getTitles(list?: { title?: string }[]): string {
    return list && list.length ? list.map(i => i.title).filter(Boolean).join(', ') : '—';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['addedBook'] && this.addedBook) {
      const exists = this.books.some(book => book._id === this.addedBook!._id);
      if (!exists) {
        this.books.unshift(this.addedBook);
        this.totalBooks++;
        this.uniqueAuthors += this.addedBook.authors?.length || 0;
        this.uniquePublishers += this.addedBook.publishers?.length || 0;
      }
    }
  }

  loadBooks(): void {
    const filters = this.searchFilters.filter(f => f.value?.trim());

    const isAdvanced = filters.length > 1 || (filters.length === 1 && filters[0].field !== 'all' && filters[0].value.trim() !== '');

    const query = isAdvanced ? 'advanced' : '';
    const searchTerm = isAdvanced ? JSON.stringify(filters) : '';

    localStorage.setItem('bookSearchFilters', JSON.stringify(this.searchFilters));

    this.bookService.getAllBooks(query, searchTerm).subscribe(
      (res) => {
        this.books = res.books;
        this.totalBooks = res.totalBooks;
        this.uniqueAuthors = res.uniqueAuthors;
        this.uniquePublishers = res.uniquePublishers;

        // Scroll to last viewed book
        setTimeout(() => {
          const lastViewedBookId = localStorage.getItem('lastViewedBookId');
          if (lastViewedBookId) {
            const el = document.getElementById(`book-${lastViewedBookId}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              localStorage.removeItem('lastViewedBookId');
            }
          }
        }, 10); // Slight delay to ensure DOM is rendered
      },
      (error) => console.error('Error loading books', error)
    );
  }


  viewBook(id: string): void {
    localStorage.setItem('lastViewedBookId', id);
    this.router.navigate(['/books', id]);
  }


  renderValue(book: any, key: string): string {
    const value = book[key];

    if (['authors', 'editors', 'commentators', 'caretakers', 'muhashis'].includes(key)) {
      return this.getNames(value);
    }

    if (key === 'publishers') {
      return this.getTitles(value);
    }

    if (key === 'category' || key === 'subject') {
      return book[key]?.title || '—';
    }

    if (['roomNumber', 'shelfNumber', 'wallNumber', 'bookNumber'].includes(key)) {
      return book.address?.[key] ?? '—';
    }

    return value !== undefined && value !== null ? value : '—';
  }

  resetSearch(): void {
    this.searchFilters = [{ field: 'all', value: '' }];
    localStorage.removeItem('bookSearchFilters');
    this.loadBooks();
  }

  addFilter(): void {
    this.searchFilters.push({ field: 'title', value: '' });
  }

  removeFilter(index: number): void {
    if (this.searchFilters.length > 1) {
      this.searchFilters.splice(index, 1);
    }
  }

  scrollToTop(): void {
    const table = document.getElementById('book-table');
    if (table) {
      table.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  scrollToBottom(): void {
    if (this.books.length > 0) {
      const lastBookId = this.books[this.books.length - 1]._id;
      const el = document.getElementById(`book-${lastBookId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
  }


}
