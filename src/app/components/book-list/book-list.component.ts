import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BookService } from '../../services/book.service';
import { Book } from '../../models/book.model';
import { AuthService } from '../../services/auth.service';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-book-list',
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.css']
})
export class BookListComponent implements OnInit, OnDestroy {
  // Books data
  books: Book[] = [];
  loading: boolean = false;

  // Statistics
  totalBooks: number = 0;
  uniqueAuthors: number = 0;
  uniquePublishers: number = 0;
  filteredCount: number = 0;

  // View mode
  viewMode: 'table' | 'grid' = 'table';

  // Search and filters
  simpleSearchTerm: string = '';
  showAdvancedSearch: boolean = false;
  searchFilters = [
    { field: 'all', value: '' }
  ];

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 30;
  totalPages: number = 1;

  // Sorting
  sortField: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Auth
  isAdmin: boolean = false;
  private authSubscription?: Subscription;

  // Debounce for search
  private searchSubject = new Subject<void>();
  private searchSubscription?: Subscription;

  // Table columns configuration
  // merged table columns configuration
  categories = [
    { key: 'title', value: 'العنوان', sortable: true },

    { key: 'authors', value: 'المؤلف', sortable: false },
    { key: 'commentators', value: 'الشارحون', sortable: false },
    { key: 'editors', value: 'المحقق', sortable: false },
    { key: 'caretakers', value: 'من اعتنى بهم', sortable: false },

    { key: 'publishers', value: 'الدار', sortable: false },

    { key: 'category', value: 'التصنيف', sortable: true },
    { key: 'subject', value: 'التصنيف الفرعي', sortable: true },

    // { key: 'publicationYear', value: 'سنة الطباعة', sortable: true },
    // { key: 'editionNumber', value: 'رقم الطبعة', sortable: true },

    // { key: 'numberOfVolumes', value: 'عدد الأجزاء', sortable: true },
    // { key: 'numberOfFolders', value: 'عدد المجلدات', sortable: true },

    { key: 'roomNumber', value: 'الغرفة', sortable: false },
    { key: 'wallNumber', value: 'الاستاند', sortable: false },
    { key: 'shelfNumber', value: 'الرف', sortable: false },
    { key: 'bookNumber', value: 'الكتاب', sortable: true }
  ];



  visibleColumns = this.categories;

  constructor(
    private bookService: BookService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Subscribe to user changes to check admin status
    this.authSubscription = this.authService.currentUser$.subscribe((user: any) => {
      console.log('BookList - Current user:', user);
      console.log('BookList - User role:', user?.role);
      this.isAdmin = user?.role == 'admin';
      console.log('BookList - Is admin:', this.isAdmin);
    });

    // Setup debounced search
    this.searchSubscription = this.searchSubject
      .pipe(
        debounceTime(300), // Wait 300ms after the last search trigger
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.loadBooks();
      });

    // load query params / url state if you have any
    this.loadQueryParams();

    // restore saved filters from localStorage BEFORE loading books
    const saved = this.getSavedFiltersFromLocalStorage();
    if (saved && saved.length) {
      this.searchFilters = saved;
      // if you're restoring advanced filters, clear simple term
      this.simpleSearchTerm = '';
      // Load books only if we have saved filters and no query params
      if (!this.route.snapshot.queryParams['search'] && !this.route.snapshot.queryParams['category'] && !this.route.snapshot.queryParams['subjectTitle']) {
        this.loadBooks();
      }
    } else if (!this.route.snapshot.queryParams['search'] && !this.route.snapshot.queryParams['category'] && !this.route.snapshot.queryParams['subjectTitle']) {
      // Only load books if no query params and no saved filters
      this.loadBooks();
    }
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
  /** Read saved filters safely from localStorage */
  private getSavedFiltersFromLocalStorage(): Array<{ field: string, value: string }> | null {
    try {
      const raw = localStorage.getItem('bookSearchFilters');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return null;
      // Normalize entries and ensure values are strings
      return parsed.map(f => ({
        field: f.field ?? 'all',
        value: (f.value ?? '').toString()
      }));
    } catch (err) {
      console.warn('Could not parse saved bookSearchFilters from localStorage:', err);
      // corrupt value: remove it so future loads are clean
      localStorage.removeItem('bookSearchFilters');
      return null;
    }
  }
  // checkAuth(): void {
  //   this.authService.currentUser$.subscribe(user => {
  //     this.isAdmin = user?.role === 'admin';
  //   });
  // }

  loadQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      console.log("params ", params);

      // Initialize search filters array
      this.searchFilters = [];

      // Check if search parameter exists - treat as simple search
      if (params['search']) {
        this.simpleSearchTerm = params['search'];
        this.searchFilters.push({
          field: 'all',  // Changed from 'search' to 'all' for simple search
          value: params['search']
        });
      }

      // Check if category parameter exists
      if (params['category']) {
        this.searchFilters.push({
          field: 'category',
          value: params['category']
        });
      }

      // Check if subjectTitle parameter exists
      if (params['subjectTitle']) {
        this.searchFilters.push({
          field: 'subject',
          value: params['subjectTitle']
        });
      }
      console.log("this.searchFilters", this.searchFilters);

      // Load books with all filters applied (AND condition)
      if (this.searchFilters.length > 0) {
        this.loadBooks();
      }
    });
  }

  loadBooks(): void {
    this.loading = true;

    // trim and take only filters with a non-empty value
    const filters = this.searchFilters
      .map(f => ({ ...f, value: (f.value ?? '').toString().trim() }))
      .filter(f => f.value !== '');

    // Determine if this is advanced search
    // Advanced search: multiple filters OR single filter that's not 'all' field
    console.log("filters ", filters);

    const isAdvanced = filters.length > 1 ||
      (filters.length === 1 && filters[0].field !== 'all' && filters[0].value !== '');

    const query = isAdvanced ? 'advanced' : '';
    const searchTerm = isAdvanced ? JSON.stringify(filters) : this.simpleSearchTerm;

    console.log('Search details:', { isAdvanced, query, searchTerm, filters });

    // Save only the active/trimmed filters
    if (filters.length > 0) {
      localStorage.setItem('bookSearchFilters', JSON.stringify(filters));
    } else {
      // If user cleared filters, remove saved state
      localStorage.removeItem('bookSearchFilters');
    }

    this.bookService.getAllBooks(query, searchTerm, this.currentPage, this.itemsPerPage, this.sortField, this.sortDirection)
      .subscribe(
        (res) => {
          this.books = res.books;
          this.totalBooks = res.totalBooks;
          this.uniqueAuthors = res.uniqueAuthors;
          this.uniquePublishers = res.uniquePublishers;
          this.filteredCount = res.filteredCount || res.books.length;
          this.totalPages = Math.ceil(this.filteredCount / this.itemsPerPage);
          this.loading = false;

          // Scroll to last viewed book if exists
          setTimeout(() => {
            const lastViewedBookId = localStorage.getItem('lastViewedBookId');
            if (lastViewedBookId) {
              const el = document.getElementById(`book-${lastViewedBookId}`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('highlight');
                setTimeout(() => el.classList.remove('highlight'), 2000);
                localStorage.removeItem('lastViewedBookId');
              }
            }
          }, 100);
        },
        (error) => {
          console.error('Error loading books', error);
          this.loading = false;
        }
      );
  }

  performSimpleSearch(): void {
    this.searchFilters = [{
      field: 'all',
      value: this.simpleSearchTerm
    }];
    this.currentPage = 1;
    this.loadBooks();

    // this.searchSubject.next(); // Trigger debounced search
  }

  toggleAdvancedSearch(): void {
    this.showAdvancedSearch = !this.showAdvancedSearch;
  }

  addFilter(): void {
    this.searchFilters.push({ field: 'title', value: '' });
  }

  removeFilter(index: number): void {
    if (this.searchFilters.length > 1) {
      this.searchFilters.splice(index, 1);
      this.searchSubject.next(); // Trigger search after removing filter
    }
  }

  onFilterChange(): void {
    this.currentPage = 1; // Reset to first page when filters change
    this.searchSubject.next(); // Trigger debounced search
  }

  resetSearch(): void {
    this.searchFilters = [{ field: 'all', value: '' }];
    this.simpleSearchTerm = '';
    this.currentPage = 1;
    localStorage.removeItem('bookSearchFilters');
    this.searchSubject.next(); // Trigger debounced search
  }

  sort(field: string): void {
    if (!this.categories.find(c => c.key === field)?.sortable) return;

    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.searchSubject.next(); // Trigger debounced search
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.loading = true;
      this.currentPage = page;
      this.searchSubject.next(); // Trigger debounced search
      this.scrollToTop();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let end = Math.min(this.totalPages, start + maxPages - 1);

    if (end - start < maxPages - 1) {
      start = Math.max(1, end - maxPages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  viewBook(id: string): void {
    localStorage.setItem('lastViewedBookId', id);
    this.router.navigate(['/books', id]);
  }

  editBook(id: string): void {
    this.router.navigate(['/edit-book', id]);
  }

  deleteBook(id: string): void {
    if (confirm('هل أنت متأكد من حذف هذا الكتاب؟')) {
      this.bookService.deleteBook(id).subscribe(
        () => {
          this.loadBooks();
        },
        (error) => console.error('Error deleting book', error)
      );
    }
  }

  exportData(): void {
    // Implement export functionality
    console.log('Exporting data...');
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToBottom(): void {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
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
      return book[key]?.title || 'غير مصنف';
    }

    if (['roomNumber', 'shelfNumber', 'wallNumber', 'bookNumber'].includes(key)) {
      return book.address?.[key] ?? '—';
    }

    return value !== undefined && value !== null ? value : '—';
  }

  getNames(list?: { name?: string }[]): string {
    return list && list.length ? list.map(i => i.name).filter(Boolean).join(', ') : 'غير محدد';
  }

  getTitles(list?: { title?: string }[]): string {
    return list && list.length ? list.map(i => i.title).filter(Boolean).join(', ') : 'غير محدد';
  }
}