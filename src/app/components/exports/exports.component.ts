import { Component, OnInit, OnDestroy } from '@angular/core';
import { BookService } from '../../services/book.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-exports',
  templateUrl: './exports.component.html',
  styleUrls: ['./exports.component.css']
})
export class ExportsComponent implements OnInit, OnDestroy {
  loading: boolean = false;
  selectedRoomNumber: string | null = null;
  availableRooms: string[] = [];
  
  // Search and filters
  simpleSearchTerm: string = '';
  showAdvancedSearch: boolean = false;
  searchFilters = [
    { field: 'all', value: '' }
  ];
  
  // Sorting
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Auth
  isAdmin: boolean = false;
  private authSubscription?: Subscription;

  // Filter options (same as book-list)
  filterOptions = [
    { key: 'title', value: 'العنوان' },
    { key: 'authors', value: 'المؤلف' },
    { key: 'category', value: 'التصنيف' },
    { key: 'subject', value: 'التصنيف الفرعي' },
    { key: 'publishers', value: 'الدار' },
    { key: 'roomNumber', value: 'الغرفة' },
    { key: 'wallNumber', value: 'الاستاند' },
    { key: 'shelfNumber', value: 'الرف' },
    { key: 'bookNumber', value: 'الكتاب' },
    { key: 'numberOfVolumes', value: 'عدد الأجزاء' },
    { key: 'numberOfFolders', value: 'عدد المجلدات' },
    { key: 'editionNumber', value: 'رقم الطبعة' },
    { key: 'publicationYear', value: 'سنة الطباعة' },
    { key: 'pageCount', value: 'عدد الصفحات' },
    { key: 'notes', value: 'الملاحظات' }
  ];

  constructor(
    private bookService: BookService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Subscribe to user changes to check admin status
    this.authSubscription = this.authService.currentUser$.subscribe((user: any) => {
      this.isAdmin = user?.role == 'admin';
    });

    // Load available room numbers
    this.loadAvailableRooms();
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
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
    this.selectedRoomNumber = null;
  }

  exportData(): void {
    // Show loading state
    this.loading = true;

    // Extract current search filters
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

    // Extract current search filters (exclude roomNumber since we're using selectedRoomNumber)
    const filters = this.searchFilters
      .map(f => ({ ...f, value: (f.value ?? '').toString().trim() }))
      .filter(f => f.value !== '' && f.field !== 'roomNumber');

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
}
