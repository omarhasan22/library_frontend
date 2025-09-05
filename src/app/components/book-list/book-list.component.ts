import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BookService } from '../../services/book.service';
import { Book } from '../../models/book.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-book-list',
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.css']
})
export class BookListComponent implements OnInit {
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
  itemsPerPage: number = 20;
  totalPages: number = 1;

  // Sorting
  sortField: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Auth
  isAdmin: boolean = false;

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
    { key: 'bookNumber', value: 'الكتاب', sortable: false }
  ];



  visibleColumns = this.categories;

  constructor(
    private bookService: BookService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // this.checkAuth();
    this.loadQueryParams();
    this.loadBooks();
  }

  // checkAuth(): void {
  //   this.authService.currentUser$.subscribe(user => {
  //     this.isAdmin = user?.role === 'admin';
  //   });
  // }

  loadQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      console.log("params ", params);

      if (params['search']) {
        this.simpleSearchTerm = params['search'];
        this.performSimpleSearch();
      }
      // if (params['category']) {
      //   this.searchFilters = [{
      //     field: 'category',
      //     value: params['category']
      //   }];
      //   this.loadBooks();
      // }
      if (params['subjectTitle']) {
        this.searchFilters = [{
          field: 'subject',
          value: params['subjectTitle']
        }];
        this.loadBooks();
      }
    });
  }

  loadBooks(): void {
    this.loading = true;

    const filters = this.searchFilters.filter(f => f.value?.trim());
    const isAdvanced = filters.length > 1 ||
      (filters.length === 1 && filters[0].field !== 'all' && filters[0].value.trim() !== '');

    const query = isAdvanced ? 'advanced' : '';
    const searchTerm = isAdvanced ? JSON.stringify(filters) : this.simpleSearchTerm;

    // Save filters to localStorage
    if (filters.length > 0) {
      localStorage.setItem('bookSearchFilters', JSON.stringify(this.searchFilters));
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
    }
  }

  resetSearch(): void {
    this.searchFilters = [{ field: 'all', value: '' }];
    this.simpleSearchTerm = '';
    this.currentPage = 1;
    localStorage.removeItem('bookSearchFilters');
    this.loadBooks();
  }

  sort(field: string): void {
    if (!this.categories.find(c => c.key === field)?.sortable) return;

    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.loadBooks();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadBooks();
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