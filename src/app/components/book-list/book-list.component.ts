import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
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
export class BookListComponent implements OnInit, OnDestroy, AfterViewInit {
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

  // Flag to prevent recursive calls
  private isLoadingBooks = false;

  // Scroll retry counter
  private scrollRetries = 0;

  // Room selector for locations export
  selectedRoomNumber: string | null = null;
  availableRooms: string[] = [];

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

    // Load available room numbers
    this.loadAvailableRooms();

    // load query params / url state if you have any
    this.loadQueryParams();

    // restore saved filters from localStorage BEFORE loading books
    // But only if URL doesn't have filters (URL takes precedence)
    const urlParams = this.route.snapshot.queryParams;
    if (!urlParams['filters'] && !urlParams['search'] && !urlParams['category'] && !urlParams['subjectTitle']) {
      const saved = this.getSavedFiltersFromLocalStorage();
      if (saved && saved.length) {
        this.searchFilters = saved;
        // if you're restoring advanced filters, clear simple term
        this.simpleSearchTerm = '';
        // Load books only if we have saved filters and no query params
        this.loadBooks();
      } else {
        // Only load books if no query params and no saved filters
        this.loadBooks();
      }
    }
  }

  ngAfterViewInit(): void {
    // Check if we need to scroll when component view is ready
    if (this.books.length > 0) {
      this.scrollToLastViewedBook();
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

  // Helper methods for UTF-8 safe base64 encoding/decoding
  private encodeBase64(str: string): string {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch (err) {
      console.error('Error encoding to base64:', err);
      return '';
    }
  }

  private decodeBase64(str: string): string {
    try {
      return decodeURIComponent(escape(atob(str)));
    } catch (err) {
      console.error('Error decoding from base64:', err);
      return '';
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

      // Skip if we're already loading books (prevent recursive calls)
      if (this.isLoadingBooks) {
        return;
      }

      // Initialize search filters array
      this.searchFilters = [];

      // Check if page parameter exists
      if (params['page']) {
        const page = parseInt(params['page'], 10);
        if (page >= 1) {
          this.currentPage = page;
        }
      }

      // Check if advanced filters are in URL (base64 encoded JSON)
      if (params['filters']) {
        try {
          const decodedFilters = JSON.parse(this.decodeBase64(params['filters']));
          if (Array.isArray(decodedFilters) && decodedFilters.length > 0) {
            this.searchFilters = decodedFilters.map(f => ({
              field: f.field ?? 'all',
              value: (f.value ?? '').toString()
            }));
            // Clear simple search term when using advanced filters
            this.simpleSearchTerm = '';
            this.showAdvancedSearch = true; // Show advanced search UI
          }
        } catch (err) {
          console.warn('Could not parse filters from URL:', err);
        }
      }
      // Otherwise, check for simple search parameters
      else {
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
      }
      console.log("this.searchFilters", this.searchFilters);

      // Load books if there are filters OR if page parameter exists
      if (this.searchFilters.length > 0 || params['page']) {
        this.loadBooks();
      }
    });
  }

  loadBooks(): void {
    // Prevent recursive calls
    if (this.isLoadingBooks) {
      return;
    }

    this.isLoadingBooks = true;
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
    const searchTerm = isAdvanced ? JSON.stringify(filters) : this.simpleSearchTerm.trim();

    console.log('Search details:', { isAdvanced, query, searchTerm, filters });

    // Save only the active/trimmed filters
    if (filters.length > 0) {
      localStorage.setItem('bookSearchFilters', JSON.stringify(filters));
    } else {
      localStorage.removeItem('bookSearchFilters');
    }

    // Make the API call first
    this.bookService.getAllBooks(query, searchTerm, this.currentPage, this.itemsPerPage, this.sortField, this.sortDirection)
      .subscribe(
        (res) => {
          this.books = res.books;
          this.totalBooks = res.totalBooks;
          this.uniqueAuthors = res.uniqueAuthors;
          this.uniquePublishers = res.uniquePublishers;
          this.filteredCount = res.filteredCount || res.books.length;
          this.totalPages = Math.ceil(this.filteredCount / this.itemsPerPage) || 1;
          this.loading = false;
          this.isLoadingBooks = false;

          // Update URL after successful API call
          if (isAdvanced && filters.length > 0) {
            try {
              const encodedFilters = this.encodeBase64(JSON.stringify(filters));
              this.router.navigate([], {
                relativeTo: this.route,
                queryParams: {
                  filters: encodedFilters,
                  page: this.currentPage > 1 ? this.currentPage.toString() : null,
                  search: null,
                  category: null,
                  subjectTitle: null
                },
                queryParamsHandling: 'merge',
                replaceUrl: true
              });
            } catch (err) {
              console.error('Error encoding filters for URL:', err);
            }
          } else if (filters.length === 0) {
            // Clear filters from URL
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { filters: null },
              queryParamsHandling: 'merge'
            });
          }

          // Scroll to last viewed book if exists
          this.scrollToLastViewedBook();
        },
        (error) => {
          console.error('Error loading books', error);
          this.loading = false;
          this.isLoadingBooks = false;
          alert('حدث خطأ في تحميل الكتب. يرجى المحاولة مرة أخرى.');
        }
      );
  }

  private scrollToLastViewedBook(): void {
    const lastViewedBookId = localStorage.getItem('lastViewedBookId');
    const lastViewedBookPage = localStorage.getItem('lastViewedBookPage');

    if (!lastViewedBookId) return;

    // Restore the page if needed and reload books
    if (lastViewedBookPage) {
      const savedPage = parseInt(lastViewedBookPage, 10);
      if (savedPage >= 1 && savedPage !== this.currentPage) {
        this.currentPage = savedPage;
        localStorage.removeItem('lastViewedBookPage');
        this.scrollRetries = 0;
        this.loadBooks(); // This will call scrollToLastViewedBook again after loading
        return;
      }
      localStorage.removeItem('lastViewedBookPage');
    }

    // Use a timeout to ensure DOM is ready
    setTimeout(() => {
      const el = document.getElementById(`book-${lastViewedBookId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('highlight');
        setTimeout(() => {
          el.classList.remove('highlight');
          localStorage.removeItem('lastViewedBookId');
        }, 2000);
        this.scrollRetries = 0;
      } else if (this.scrollRetries < 3) {
        // Retry a few times in case DOM isn't ready yet
        this.scrollRetries++;
        setTimeout(() => this.scrollToLastViewedBook(), 200);
      } else {
        // Give up after 3 retries
        this.scrollRetries = 0;
        localStorage.removeItem('lastViewedBookId');
        localStorage.removeItem('lastViewedBookPage');
      }
    }, 300);
  }

  performSimpleSearch(): void {
    this.searchFilters = [{
      field: 'all',
      value: this.simpleSearchTerm
    }];
    this.currentPage = 1;

    // Update URL to remove advanced filters if switching to simple search
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: this.simpleSearchTerm,
        filters: null,
        page: null
      },
      queryParamsHandling: 'merge'
    });

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
    this.isLoadingBooks = false; // Reset flag when filters change
    this.searchSubject.next(); // Trigger debounced search
  }

  // Method to handle advanced search button click
  performAdvancedSearch(): void {
    this.currentPage = 1; // Reset to first page for new search
    this.isLoadingBooks = false; // Reset flag
    this.loadBooks();
  }

  resetSearch(): void {
    // Reset all search-related state
    this.searchFilters = [{ field: 'all', value: '' }];
    this.simpleSearchTerm = '';
    this.currentPage = 1;
    this.isLoadingBooks = false;
    this.showAdvancedSearch = false;
    this.sortField = '';
    this.sortDirection = 'asc';

    // Clear localStorage
    localStorage.removeItem('bookSearchFilters');
    localStorage.removeItem('lastViewedBookId');
    localStorage.removeItem('lastViewedBookPage');

    // Clear all query parameters and navigate
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    }).then(() => {
      // Load books after navigation completes to avoid conflicts
      this.loadBooks();
    });
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

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;

      // Update route query parameters
      const queryParams: any = {};

      // Get current filters
      const filters = this.searchFilters
        .map(f => ({ ...f, value: (f.value ?? '').toString().trim() }))
        .filter(f => f.value !== '');

      const isAdvanced = filters.length > 1 ||
        (filters.length === 1 && filters[0].field !== 'all' && filters[0].value !== '');

      // If advanced search, preserve filters in URL
      if (isAdvanced && filters.length > 0) {
        const encodedFilters = this.encodeBase64(JSON.stringify(filters));
        queryParams['filters'] = encodedFilters;
      } else {
        // Preserve simple search parameters
        if (this.simpleSearchTerm) {
          queryParams['search'] = this.simpleSearchTerm;
        }
        if (filters.some(f => f.field === 'category' && f.value)) {
          const categoryFilter = filters.find(f => f.field === 'category');
          if (categoryFilter) {
            queryParams['category'] = categoryFilter.value;
          }
        }
        if (filters.some(f => f.field === 'subject' && f.value)) {
          const subjectFilter = filters.find(f => f.field === 'subject');
          if (subjectFilter) {
            queryParams['subjectTitle'] = subjectFilter.value;
          }
        }
      }

      // Add page parameter
      queryParams['page'] = page.toString();

      // Navigate with updated query parameters
      // The route change will trigger loadQueryParams subscription which will load books
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: queryParams,
        queryParamsHandling: 'merge'
      });

      this.scrollToTop();
    }
  }

  viewBook(id: string): void {
    localStorage.setItem('lastViewedBookId', id);
    localStorage.setItem('lastViewedBookPage', this.currentPage.toString());
    this.router.navigate(['/books', id]);
  }

  // Add this method for right-click to open view in new window
  viewBookInNewWindow(id: string, event?: MouseEvent): void {
    if (event) {
      event.preventDefault(); // Prevent default context menu
    }
    localStorage.setItem('lastViewedBookId', id);
    const url = this.router.createUrlTree(['/books', id]).toString();
    window.open(url, '_blank');
  }

  editBook(id: string): void {
    this.router.navigate(['/edit-book', id]);
  }

  // Add this method for right-click to open edit in new window
  editBookInNewWindow(id: string, event?: MouseEvent): void {
    if (event) {
      event.preventDefault(); // Prevent default context menu
    }
    const url = this.router.createUrlTree(['/edit-book', id]).toString();
    window.open(url, '_blank');
  }

  deleteBook(id: string): void {
    if (confirm('هل أنت متأكد من حذف هذا الكتاب؟')) {
      this.bookService.deleteBook(id).subscribe(
        () => {
          // Remove the book from the local array instead of reloading
          this.books = this.books.filter(book => book._id !== id);

          // Update statistics
          this.filteredCount = Math.max(0, this.filteredCount - 1);
          this.totalBooks = Math.max(0, this.totalBooks - 1);

          // Recalculate total pages
          this.totalPages = Math.ceil(this.filteredCount / this.itemsPerPage) || 1;

          // If current page is empty and not the first page, go to previous page
          if (this.books.length === 0 && this.currentPage > 1) {
            this.currentPage--;
            this.loadBooks(); // Only reload if we need to go to previous page
          }
        },
        (error) => {
          console.error('Error deleting book', error);
          alert('فشل حذف الكتاب. يرجى المحاولة مرة أخرى.');
        }
      );
    }
  }

  loadAvailableRooms(): void {
    this.bookService.getUniqueRoomNumbers().subscribe(
      (rooms: string[]) => {
        this.availableRooms = rooms;
      },
      (error) => {
        console.error('Error loading room numbers', error);
      }
    );
  }

  exportData(): void {
    // Show loading state
    this.loading = true;

    // Extract current search filters (same logic as loadBooks)
    const filters = this.searchFilters
      .map(f => ({ ...f, value: (f.value ?? '').toString().trim() }))
      .filter(f => f.value !== '');

    // Determine if this is advanced search
    const isAdvanced = filters.length > 1 ||
      (filters.length === 1 && filters[0].field !== 'all' && filters[0].value !== '');

    const query = isAdvanced ? 'advanced' : '';
    const searchTerm = isAdvanced ? JSON.stringify(filters) : this.simpleSearchTerm;

    // Call export service
    this.bookService.exportBooksToExcel(query, searchTerm, this.sortDirection).subscribe(
      (blob: Blob) => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const filename = `books_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this.loading = false;
      },
      (error) => {
        console.error('Error exporting books', error);
        alert('حدث خطأ أثناء تصدير البيانات. يرجى المحاولة مرة أخرى.');
        this.loading = false;
      }
    );
  }

  exportLocationsData(): void {
    // Validate room number is selected
    if (!this.selectedRoomNumber) {
      alert('يرجى اختيار رقم الغرفة أولاً');
      return;
    }

    // Show loading state
    this.loading = true;

    // Extract current search filters (same logic as loadBooks and exportData)
    const filters = this.searchFilters
      .map(f => ({ ...f, value: (f.value ?? '').toString().trim() }))
      .filter(f => f.value !== '' && f.field !== 'roomNumber'); // Exclude roomNumber from filters since we're using selectedRoomNumber

    // Determine if this is advanced search
    const isAdvanced = filters.length > 1 ||
      (filters.length === 1 && filters[0].field !== 'all' && filters[0].value !== '');

    const query = isAdvanced ? 'advanced' : '';
    const searchTerm = isAdvanced ? JSON.stringify(filters) : this.simpleSearchTerm;

    // Call export locations service
    this.bookService.exportBookLocationsToExcel(this.selectedRoomNumber, query, searchTerm, this.sortDirection).subscribe(
      (blob: Blob) => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const filename = `books_locations_room_${this.selectedRoomNumber}_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this.loading = false;
      },
      (error) => {
        console.error('Error exporting book locations', error);
        alert('حدث خطأ أثناء تصدير المواقع. يرجى المحاولة مرة أخرى.');
        this.loading = false;
      }
    );
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