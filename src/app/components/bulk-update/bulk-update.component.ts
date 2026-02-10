import { Component, OnInit } from '@angular/core';
import { BookService } from '../../services/book.service';
import { SubjectCategory } from '../../models/subject.model';
import { Category } from '../../models/category.model';

@Component({
  selector: 'app-bulk-update',
  templateUrl: './bulk-update.component.html',
  styleUrls: ['./bulk-update.component.css']
})
export class BulkUpdateComponent implements OnInit {
  // Update type selection
  updateType: 'subject' | 'category' = 'subject';

  // Form data
  roomNumber: string = '';
  wallNumber: string = '';
  shelfNumber: string = '';
  bookNumberFrom: number | null = null;
  bookNumberTo: number | null = null;
  selectedSubject: SubjectCategory | null = null;
  selectedCategory: Category | null = null;

  // Dropdowns data
  availableRooms: string[] = [];
  availableWalls: string[] = [];
  subjects: SubjectCategory[] = [];
  filteredSubjects: SubjectCategory[] = [];
  categories: Category[] = [];
  filteredCategories: Category[] = [];

  // Search and dropdown state
  subjectSearchTerm: string = '';
  showSubjectDropdown: boolean = false;
  categorySearchTerm: string = '';
  showCategoryDropdown: boolean = false;

  // Confirmation dialog
  showConfirmationDialog: boolean = false;
  previewData: {
    roomNumber: string;
    wallNumber: string;
    shelfNumber: string;
    bookRange: string;
    subjectTitle: string;
    estimatedCount?: number;
  } | null = null;

  // Loading and messages
  loading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  // Undo functionality
  undoData: {
    updateId: string;
    books: Array<{ bookId: string; previousSubjectId: string | null }>;
    timestamp: Date;
  } | null = null;
  showUndoConfirmation: boolean = false;
  currentHistoryId: string | null = null;

  // History and edited books
  historyList: any[] = [];
  editedBooksList: Array<{
    bookId: string;
    bookTitle: string;
    oldSubject?: string | null;
    newSubject?: string;
    oldCategory?: string | null;
    newCategory?: string;
  }> = [];

  constructor(private bookService: BookService) { }

  ngOnInit(): void {
    this.loadInitialData();
    this.loadHistory();
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-dropdown-container')) {
        this.closeAllDropdowns();
      }
    });
  }

  onUpdateTypeChange(): void {
    // Reset selections when switching update type
    this.selectedSubject = null;
    this.selectedCategory = null;
    this.subjectSearchTerm = '';
    this.categorySearchTerm = '';
    this.closeAllDropdowns();
  }

  loadInitialData(): void {
    this.loading = true;
    this.bookService.getUniqueRoomNumbers().subscribe({
      next: (rooms) => {
        this.availableRooms = rooms;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading rooms:', err);
        this.errorMessage = 'حدث خطأ في تحميل البيانات';
        this.loading = false;
      }
    });

    this.bookService.getSubjects().subscribe({
      next: (subjects) => {
        this.subjects = subjects;
        this.filteredSubjects = [...subjects];
      },
      error: (err) => {
        console.error('Error loading subjects:', err);
      }
    });

    this.bookService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.filteredCategories = [...categories];
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  onRoomChange(): void {
    this.wallNumber = '';
    this.availableWalls = [];
    
    if (this.roomNumber) {
      this.loading = true;
      this.bookService.getUniqueWallNumbers(this.roomNumber).subscribe({
        next: (walls) => {
          this.availableWalls = walls;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading walls:', err);
          this.errorMessage = 'حدث خطأ في تحميل الحوائط';
          this.loading = false;
        }
      });
    }
  }

  onSubjectSearch(term: string): void {
    this.subjectSearchTerm = term;
    
    if (!term || term.trim() === '') {
      // Show all subjects when search is empty
      this.filteredSubjects = [...this.subjects];
      this.showSubjectDropdown = true;
      return;
    }
    
    const normalizedSearchTerm = this.normalizeArabicText(term);

    this.filteredSubjects = this.subjects.filter(subject => {
      if (!subject.title) return false;
      const normalizedSubjectTitle = subject.normalizedTitle || this.normalizeArabicText(subject.title);
      return normalizedSubjectTitle.includes(normalizedSearchTerm);
    });
    this.showSubjectDropdown = true;
  }

  selectSubject(subject: SubjectCategory): void {
    this.selectedSubject = { _id: subject._id, title: subject.title };
    this.subjectSearchTerm = '';
    this.showSubjectDropdown = false;
    // Reset filtered subjects to show all
    this.filteredSubjects = [...this.subjects];
  }

  addNewSubject(): void {
    if (this.subjectSearchTerm.trim()) {
      this.loading = true;
      this.bookService.createSubject({ title: this.subjectSearchTerm.trim() }).subscribe({
        next: (newSubject) => {
          this.subjects.push(newSubject);
          // Update filtered subjects to include the new one
          this.filteredSubjects = [...this.subjects];
          this.selectedSubject = { _id: newSubject._id, title: newSubject.title };
          this.subjectSearchTerm = '';
          this.showSubjectDropdown = false;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error creating subject:', err);
          this.errorMessage = 'حدث خطأ في إضافة التصنيف الفرعي';
          this.loading = false;
        }
      });
    }
  }

  onCategorySearch(term: string): void {
    this.categorySearchTerm = term;
    
    if (!term || term.trim() === '') {
      // Show all categories when search is empty
      this.filteredCategories = [...this.categories];
      this.showCategoryDropdown = true;
      return;
    }
    
    const normalizedSearchTerm = this.normalizeArabicText(term);

    this.filteredCategories = this.categories.filter(category => {
      if (!category.title) return false;
      const normalizedCategoryTitle = category.normalizedTitle || this.normalizeArabicText(category.title);
      return normalizedCategoryTitle.includes(normalizedSearchTerm);
    });
    this.showCategoryDropdown = true;
  }

  selectCategory(category: Category): void {
    this.selectedCategory = { _id: category._id, title: category.title };
    this.categorySearchTerm = '';
    this.showCategoryDropdown = false;
    // Reset filtered categories to show all
    this.filteredCategories = [...this.categories];
  }

  addNewCategory(): void {
    if (this.categorySearchTerm.trim()) {
      this.loading = true;
      this.bookService.createCategory({ title: this.categorySearchTerm.trim() }).subscribe({
        next: (newCategory) => {
          this.categories.push(newCategory);
          // Update filtered categories to include the new one
          this.filteredCategories = [...this.categories];
          this.selectedCategory = { _id: newCategory._id, title: newCategory.title };
          this.categorySearchTerm = '';
          this.showCategoryDropdown = false;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error creating category:', err);
          this.errorMessage = 'حدث خطأ في إضافة التصنيف الرئيسي';
          this.loading = false;
        }
      });
    }
  }

  closeAllDropdowns(): void {
    this.showSubjectDropdown = false;
    this.showCategoryDropdown = false;
  }

  normalizeArabicText(text: string): string {
    if (!text) return '';
    return text
      .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
      .replace(/[\u0622\u0623\u0625\u0627]/g, 'ا')
      .replace(/\u0649/g, 'ي')
      .replace(/\u0629/g, 'ه')
      .replace(/[\u0654\u0655]/g, '')
      .replace(/\u0624/g, 'و')
      .replace(/\u0626/g, 'ي')
      .replace(/\u0621/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  validateForm(): boolean {
    if (!this.shelfNumber) {
      this.errorMessage = 'الرجاء إدخال رقم الرف';
      return false;
    }
    if (this.bookNumberFrom === null || this.bookNumberTo === null) {
      this.errorMessage = 'الرجاء إدخال نطاق أرقام الكتب';
      return false;
    }
    if (this.bookNumberFrom > this.bookNumberTo) {
      this.errorMessage = 'رقم البداية يجب أن يكون أقل من أو يساوي رقم النهاية';
      return false;
    }
    if (this.updateType === 'subject') {
      if (!this.selectedSubject || !this.selectedSubject._id) {
        this.errorMessage = 'الرجاء اختيار التصنيف الفرعي';
        return false;
      }
    } else if (this.updateType === 'category') {
      if (!this.selectedCategory || !this.selectedCategory._id) {
        this.errorMessage = 'الرجاء اختيار التصنيف الرئيسي';
        return false;
      }
    }
    return true;
  }

  showPreview(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.validateForm()) {
      return;
    }

    // Prepare preview data
    const title = this.updateType === 'subject' 
      ? this.selectedSubject!.title 
      : this.selectedCategory!.title;
    
    this.previewData = {
      roomNumber: this.roomNumber || 'غير محدد',
      wallNumber: this.wallNumber || 'غير محدد',
      shelfNumber: this.shelfNumber,
      bookRange: `من ${this.bookNumberFrom} إلى ${this.bookNumberTo}`,
      subjectTitle: title
    };

    this.showConfirmationDialog = true;
  }

  cancelUpdate(): void {
    this.showConfirmationDialog = false;
    this.previewData = null;
  }

  confirmUpdate(): void {
    if (!this.validateForm()) {
      return;
    }

    if (this.updateType === 'subject' && !this.selectedSubject) {
      return;
    }
    if (this.updateType === 'category' && !this.selectedCategory) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const criteria = {
      roomNumber: this.roomNumber || undefined,
      wallNumber: this.wallNumber || undefined,
      shelfNumber: this.shelfNumber,
      bookNumberFrom: this.bookNumberFrom!,
      bookNumberTo: this.bookNumberTo!
    };

    let updateObservable;
    if (this.updateType === 'subject') {
      updateObservable = this.bookService.bulkUpdateSubjects({
        ...criteria,
        subjectId: this.selectedSubject!._id!
      });
    } else {
      updateObservable = this.bookService.bulkUpdateCategories({
        ...criteria,
        categoryId: this.selectedCategory!._id!
      });
    }

    updateObservable.subscribe({
      next: (result) => {
        this.loading = false;
        this.showConfirmationDialog = false;
        this.successMessage = `تم تحديث ${result.modifiedCount} كتاب بنجاح!`;
        
        // Store history ID and undo data
        if (result.historyId) {
          this.currentHistoryId = result.historyId;
          // Fetch full history record to get affected books list
          this.loadHistoryById(result.historyId);
        }
        
        if (result.undoData) {
          this.undoData = result.undoData;
        }
        
        // Reset form
        this.resetForm();
      },
      error: (err) => {
        this.loading = false;
        this.showConfirmationDialog = false;
        const errorMsg = err.error?.error || 'حدث خطأ في تحديث الكتب';
        
        // Check if error message indicates automatic rollback
        if (errorMsg.includes('rollback')) {
          this.errorMessage = `${errorMsg} - تم استعادة الحالة السابقة تلقائياً`;
        } else {
          this.errorMessage = errorMsg;
        }
        
        // Clear undo data on error (since rollback was automatic)
        this.undoData = null;
        console.error('Error updating books:', err);
      }
    });
  }

  resetForm(): void {
    this.roomNumber = '';
    this.wallNumber = '';
    this.shelfNumber = '';
    this.bookNumberFrom = null;
    this.bookNumberTo = null;
    this.selectedSubject = null;
    this.selectedCategory = null;
    this.subjectSearchTerm = '';
    this.categorySearchTerm = '';
    this.availableWalls = [];
  }

  showUndoDialog(): void {
    if (!this.undoData) {
      this.errorMessage = 'لا توجد بيانات للتراجع';
      return;
    }
    this.showUndoConfirmation = true;
  }

  cancelUndo(): void {
    this.showUndoConfirmation = false;
  }

  confirmUndo(): void {
    if (!this.currentHistoryId) {
      this.errorMessage = 'لا توجد بيانات للتراجع';
      this.showUndoConfirmation = false;
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.bookService.undoBulkUpdateSubjects(this.currentHistoryId).subscribe({
      next: (result) => {
        this.loading = false;
        this.showUndoConfirmation = false;
        this.successMessage = `تم التراجع بنجاح! تم استعادة ${result.restoredCount} كتاب إلى حالتها السابقة.`;
        this.undoData = null;
        this.currentHistoryId = null;
        this.editedBooksList = [];
        // Reload history to reflect the undo
        this.loadHistory();
      },
      error: (err) => {
        this.loading = false;
        this.showUndoConfirmation = false;
        this.errorMessage = err.error?.error || 'حدث خطأ في التراجع';
        console.error('Error undoing update:', err);
      }
    });
  }

  loadHistory(): void {
    this.bookService.getBulkUpdateHistory(1, 10).subscribe({
      next: (result) => {
        this.historyList = result.history;
      },
      error: (err) => {
        console.error('Error loading history:', err);
      }
    });
  }

  loadHistoryById(historyId: string): void {
    this.bookService.getHistoryById(historyId).subscribe({
      next: (history) => {
        // Build edited books list for display based on update type
        if (history.updateType === 'subject') {
          this.editedBooksList = history.affectedBooks.map(book => ({
            bookId: book.bookId,
            bookTitle: book.bookTitle,
            oldSubject: history.oldSubject?.title || 'لا يوجد',
            newSubject: history.newSubject?.title || ''
          }));
        } else if (history.updateType === 'category') {
          this.editedBooksList = history.affectedBooks.map(book => ({
            bookId: book.bookId,
            bookTitle: book.bookTitle,
            oldCategory: history.oldCategory?.title || 'لا يوجد',
            newCategory: history.newCategory?.title || ''
          }));
        }
      },
      error: (err) => {
        console.error('Error loading history by ID:', err);
      }
    });
  }

  undoHistoryItem(historyId: string): void {
    this.currentHistoryId = historyId;
    this.showUndoDialog();
  }
}
