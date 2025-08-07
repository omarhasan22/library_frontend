import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookService } from '../../services/book.service';
import { Book } from '../../models/book.model';
import { Category } from '../../models/category.model';
import { SubjectCategory } from '../../models/subject.model';
import { Publisher } from 'src/app/models/publisher.model';

@Component({
  selector: 'app-book-detail',
  templateUrl: './book-detail.component.html',
  styleUrls: ['./book-detail.component.css']
})
export class BookDetailComponent implements OnInit {
  book!: Book;
  editBook!: Book & { address: { roomNumber: string; shelfNumber: string; wallNumber: string; bookNumber: string } };
  originalBook!: Book;

  isEditMode = false;
  borrowDuration: number = 1;
  showBorrowForm = false;

  // For dropdowns
  categories: Category[] = [];
  subjects: SubjectCategory[] = [];
  publishers: Publisher[] = [];
  people: any[] = [];
  authors: any[] = [];
  commentators: any[] = [];
  editors: any[] = [];
  caretakers: any[] = [];
  muhashis: any[] = [];

  // Search terms for dropdowns
  authorSearchTerm: string = '';
  commentatorSearchTerm: string = '';
  editorSearchTerm: string = '';
  caretakerSearchTerm: string = '';
  muhashiSearchTerm: string = '';
  publisherSearchTerm: string = '';
  categorySearchTerm: string = '';
  subjectSearchTerm: string = '';

  // Filtered arrays for dropdowns
  filteredAuthors: any[] = [];
  filteredCommentators: any[] = [];
  filteredEditors: any[] = [];
  filteredCaretakers: any[] = [];
  filteredMuhashis: any[] = [];
  filteredPublishers: any[] = [];
  filteredCategories: any[] = [];
  filteredSubjects: any[] = [];

  // Dropdown visibility flags
  showAuthorDropdown: boolean = false;
  showCommentatorDropdown: boolean = false;
  showEditorDropdown: boolean = false;
  showCaretakerDropdown: boolean = false;
  showMuhashiDropdown: boolean = false;
  showPublisherDropdown: boolean = false;
  showCategoryDropdown: boolean = false;
  showSubjectDropdown: boolean = false;

  selectedImageFile: File | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookService: BookService
  ) { }

  ngOnInit(): void {
    const bookId = this.route.snapshot.paramMap.get('id');
    if (bookId) {
      this.bookService.getBookById(bookId).subscribe(
        (b) => {
          this.book = b;
          this.originalBook = JSON.parse(JSON.stringify(b)); // Deep copy
          this.initializeEditBook();
        },
        (err) => console.error('Failed to load book', err)
      );
    }

    // Load data for dropdowns
    this.loadPeople();
    this.loadCategories();
    this.loadPublishers();
    this.loadSubjects();

    // Add click listener to close dropdowns when clicking outside
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-dropdown-container')) {
        this.closeAllDropdowns();
      }
    });
  }

  closeAllDropdowns(): void {
    this.showAuthorDropdown = false;
    this.showCommentatorDropdown = false;
    this.showEditorDropdown = false;
    this.showCaretakerDropdown = false;
    this.showMuhashiDropdown = false;
    this.showPublisherDropdown = false;
    this.showCategoryDropdown = false;
    this.showSubjectDropdown = false;
  }

  // Search methods for dropdowns
  onAuthorSearch(term: string): void {
    if (term.trim() === '') {
      this.filteredAuthors = [...this.authors];
    } else {
      this.filteredAuthors = this.authors.filter(author =>
        author.name && author.name.toLowerCase().includes(term.toLowerCase())
      );
    }
    this.showAuthorDropdown = true;
  }

  onCommentatorSearch(term: string): void {
    if (term.trim() === '') {
      this.filteredCommentators = [...this.commentators];
    } else {
      this.filteredCommentators = this.commentators.filter(commentator =>
        commentator.name && commentator.name.toLowerCase().includes(term.toLowerCase())
      );
    }
    this.showCommentatorDropdown = true;
  }

  onEditorSearch(term: string): void {
    if (term.trim() === '') {
      this.filteredEditors = [...this.editors];
    } else {
      this.filteredEditors = this.editors.filter(editor =>
        editor.name && editor.name.toLowerCase().includes(term.toLowerCase())
      );
    }
    this.showEditorDropdown = true;
  }

  onCaretakerSearch(term: string): void {
    if (term.trim() === '') {
      this.filteredCaretakers = [...this.caretakers];
    } else {
      this.filteredCaretakers = this.caretakers.filter(caretaker =>
        caretaker.name && caretaker.name.toLowerCase().includes(term.toLowerCase())
      );
    }
    this.showCaretakerDropdown = true;
  }

  onMuhashiSearch(term: string): void {
    if (term.trim() === '') {
      this.filteredMuhashis = [...this.muhashis];
    } else {
      this.filteredMuhashis = this.muhashis.filter(muhashi =>
        muhashi.name && muhashi.name.toLowerCase().includes(term.toLowerCase())
      );
    }
    this.showMuhashiDropdown = true;
  }

  onPublisherSearch(term: string): void {
    if (term.trim() === '') {
      this.filteredPublishers = [...this.publishers];
    } else {
      this.filteredPublishers = this.publishers.filter(publisher =>
        publisher.title && publisher.title.toLowerCase().includes(term.toLowerCase())
      );
    }
    this.showPublisherDropdown = true;
  }

  onCategorySearch(term: string): void {
    if (term.trim() === '') {
      this.filteredCategories = [...this.categories];
    } else {
      this.filteredCategories = this.categories.filter(category =>
        category.title && category.title.toLowerCase().includes(term.toLowerCase())
      );
    }
    this.showCategoryDropdown = true;
  }

  onSubjectSearch(term: string): void {
    if (term.trim() === '') {
      this.filteredSubjects = [...this.subjects];
    } else {
      this.filteredSubjects = this.subjects.filter(subject =>
        subject.title && subject.title.toLowerCase().includes(term.toLowerCase())
      );
    }
    this.showSubjectDropdown = true;
  }

  // Selection methods for dropdowns
  // Updated Edit Book Methods
  selectAuthor(author: any): void {
    this.editBook.authors = this.editBook.authors || [];
    this.editBook.authors.push({
      _id: author._id,
      name: author.name
    });
    this.authorSearchTerm = '';
    this.showAuthorDropdown = false;
  }

  selectCommentator(commentator: any): void {
    this.editBook.commentators = this.editBook.commentators || [];
    this.editBook.commentators.push({
      _id: commentator._id,
      name: commentator.name
    });
    this.commentatorSearchTerm = '';
    this.showCommentatorDropdown = false;
  }

  selectEditor(editor: any): void {
    this.editBook.editors = this.editBook.editors || [];
    this.editBook.editors.push({
      _id: editor._id,
      name: editor.name
    });
    this.editorSearchTerm = '';
    this.showEditorDropdown = false;
  }

  selectCaretaker(caretaker: any): void {
    this.editBook.caretakers = this.editBook.caretakers || [];
    this.editBook.caretakers.push({
      _id: caretaker._id,
      name: caretaker.name
    });
    this.caretakerSearchTerm = '';
    this.showCaretakerDropdown = false;
  }

  selectMuhashi(muhashi: any): void {
    this.editBook.muhashis = this.editBook.muhashis || [];
    this.editBook.muhashis.push({
      _id: muhashi._id,
      name: muhashi.name
    });
    this.muhashiSearchTerm = '';
    this.showMuhashiDropdown = false;
  }

  selectPublisher(publisher: any): void {
    this.editBook.publishers = this.editBook.publishers || [];
    this.editBook.publishers.push({
      _id: publisher._id,
      title: publisher.title
    });
    this.publisherSearchTerm = '';
    this.showPublisherDropdown = false;
  }

  selectCategory(category: any): void {
    this.editBook.category = {
      _id: category._id,
      title: category.title
    };
    this.categorySearchTerm = '';
    this.showCategoryDropdown = false;
  }

  selectSubject(subject: any): void {
    this.editBook.subject = {
      _id: subject._id,
      title: subject.title
    };
    this.subjectSearchTerm = '';
    this.showSubjectDropdown = false;
  }

  // Updated Add New Methods for Edit Book
  addNewAuthor(): void {
    if (this.authorSearchTerm.trim()) {
      this.editBook.authors = this.editBook.authors || [];
      this.editBook.authors.push({
        name: this.authorSearchTerm.trim()
      });
      this.authorSearchTerm = '';
      this.showAuthorDropdown = false;
    }
  }

  addNewCommentator(): void {
    if (this.commentatorSearchTerm.trim()) {
      this.editBook.commentators = this.editBook.commentators || [];
      this.editBook.commentators.push({
        name: this.commentatorSearchTerm.trim()
      });
      this.commentatorSearchTerm = '';
      this.showCommentatorDropdown = false;
    }
  }

  addNewEditor(): void {
    if (this.editorSearchTerm.trim()) {
      this.editBook.editors = this.editBook.editors || [];
      this.editBook.editors.push({
        name: this.editorSearchTerm.trim()
      });
      this.editorSearchTerm = '';
      this.showEditorDropdown = false;
    }
  }

  addNewCaretaker(): void {
    if (this.caretakerSearchTerm.trim()) {
      this.editBook.caretakers = this.editBook.caretakers || [];
      this.editBook.caretakers.push({
        name: this.caretakerSearchTerm.trim()
      });
      this.caretakerSearchTerm = '';
      this.showCaretakerDropdown = false;
    }
  }

  addNewMuhashi(): void {
    if (this.muhashiSearchTerm.trim()) {
      this.editBook.muhashis = this.editBook.muhashis || [];
      this.editBook.muhashis.push({
        name: this.muhashiSearchTerm.trim()
      });
      this.muhashiSearchTerm = '';
      this.showMuhashiDropdown = false;
    }
  }

  addNewPublisher(): void {
    if (this.publisherSearchTerm.trim()) {
      this.editBook.publishers = this.editBook.publishers || [];
      this.editBook.publishers.push({
        title: this.publisherSearchTerm.trim()
      });
      this.publisherSearchTerm = '';
      this.showPublisherDropdown = false;
    }
  }

  addNewCategory(): void {
    if (this.categorySearchTerm.trim()) {
      this.editBook.category = {
        title: this.categorySearchTerm.trim()
      };
      this.categorySearchTerm = '';
      this.showCategoryDropdown = false;
    }
  }

  addNewSubject(): void {
    if (this.subjectSearchTerm.trim()) {
      this.editBook.subject = {
        title: this.subjectSearchTerm.trim()
      };
      this.subjectSearchTerm = '';
      this.showSubjectDropdown = false;
    }
  }

  // Array management methods
  addAuthor(): void {
    if (!this.editBook.authors) {
      this.editBook.authors = [];
    }
    this.editBook.authors.push({ name: '' });
  }

  removeAuthor(index: number): void {
    this.editBook.authors.splice(index, 1);
  }

  addCommentator(): void {
    if (!this.editBook.commentators) {
      this.editBook.commentators = [];
    }
    this.editBook.commentators.push({ name: '' });
  }

  removeCommentator(index: number): void {
    this.editBook.commentators.splice(index, 1);
  }

  addEditor(): void {
    if (!this.editBook.editors) {
      this.editBook.editors = [];
    }
    this.editBook.editors.push({ name: '' });
  }

  removeEditor(index: number): void {
    this.editBook.editors.splice(index, 1);
  }

  addCaretaker(): void {
    if (!this.editBook.caretakers) {
      this.editBook.caretakers = [];
    }
    this.editBook.caretakers.push({ name: '' });
  }

  removeCaretaker(index: number): void {
    this.editBook.caretakers.splice(index, 1);
  }

  addPublisher(): void {
    if (!this.editBook.publishers) {
      this.editBook.publishers = [];
    }
    this.editBook.publishers.push({ title: '' });
  }

  removePublisher(index: number): void {
    this.editBook.publishers.splice(index, 1);
  }

  addMuhashi(): void {
    if (!this.editBook.muhashis) {
      this.editBook.muhashis = [];
    }
    this.editBook.muhashis.push({ name: '' });
  }

  removeMuhashi(index: number): void {
    this.editBook.muhashis.splice(index, 1);
  }

  initializeEditBook(): void {
    this.editBook = {
      ...this.book,
      authors: this.book.authors?.length ? [...this.book.authors] : [],
      commentators: this.book.commentators?.length ? [...this.book.commentators] : [],
      editors: this.book.editors?.length ? [...this.book.editors] : [],
      caretakers: this.book.caretakers?.length ? [...this.book.caretakers] : [],
      muhashis: this.book.muhashis?.length ? [...this.book.muhashis] : [],
      publishers: this.book.publishers?.length ? [...this.book.publishers] : [],
      category: { title: this.book.category?.title || '', _id: this.book.category?._id || '' },
      subject: { title: this.book.subject?.title || '', _id: this.book.subject?._id || '' },
      notes: this.book.notes || '',
      address: {
        roomNumber: this.book.address?.roomNumber || '',
        shelfNumber: this.book.address?.shelfNumber || '',
        wallNumber: this.book.address?.wallNumber || '',
        bookNumber: this.book.address?.bookNumber || ''
      }
    };
  }

  toggleEditMode(): void {
    this.isEditMode = true;
    this.initializeEditBook();
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.selectedImageFile = null;
    // Reset all search terms
    this.authorSearchTerm = '';
    this.commentatorSearchTerm = '';
    this.editorSearchTerm = '';
    this.caretakerSearchTerm = '';
    this.muhashiSearchTerm = '';
    this.publisherSearchTerm = '';
    this.categorySearchTerm = '';
    this.subjectSearchTerm = '';
    this.closeAllDropdowns();
    // Reset editBook to original values
    this.initializeEditBook();
  }

  private prepareArrayPayload(field: string): any[] {
    const items = this.editBook[field] || [];
    return items
      .filter((item: any) => (item.name && item.name.trim()) || (item.title && item.title.trim()))
      .map((item: any) => {
        if (item._id) {
          return item._id;
        }
        return field === 'publishers' ? { title: item.title?.trim() || item.name?.trim() } : { name: item.name.trim() };
      });
  }

  private prepareEntityPayload(field: string): any {
    const entity = this.editBook[field];
    if (entity?.title && entity.title.trim()) {
      if (entity._id) {
        return entity._id;
      }
      const found = this[field + 's'].find((c: any) => c.title === entity.title.trim());
      return found ? found._id : { title: entity.title.trim() };
    }
    return null;
  }

  saveBook(): void {
    // Helper function to prepare contributor arrays
    const prepareContributors = (items: any[]) => {
      return (items || [])
        .filter(item => item?.name?.trim())
        .map(item => ({
          ...(item._id ? { _id: item._id } : {}),
          name: item.name.trim()
        }));
    };

    // Helper function to prepare category/subject
    const prepareCategorySubject = (entity: any) => {
      if (entity?.title?.trim()) {
        return {
          ...(entity._id ? { _id: entity._id } : {}),
          title: entity.title.trim()
        };
      }
      return null;
    };

    // Prepare publishers separately since they use 'title' instead of 'name'
    const preparePublishers = (items: any[]) => {
      return (items || [])
        .filter(item => item?.title?.trim())
        .map(item => ({
          ...(item._id ? { _id: item._id } : {}),
          title: item.title.trim()  // Map 'name' to 'title'
        }));
    };

    const payload: any = {
      title: this.editBook.title,
      numberOfVolumes: this.editBook.numberOfVolumes,
      numberOfFolders: this.editBook.numberOfFolders,
      editionNumber: this.editBook.editionNumber,
      publicationYear: this.editBook.publicationYear,
      pageCount: this.editBook.pageCount,
      address: this.editBook.address,
      // Prepare all contributor arrays
      authors: prepareContributors(this.editBook.authors),
      commentators: prepareContributors(this.editBook.commentators),
      editors: prepareContributors(this.editBook.editors),
      caretakers: prepareContributors(this.editBook.caretakers),
      muhashis: prepareContributors(this.editBook.muhashis),
      // Publishers need special handling
      publishers: preparePublishers(this.editBook.publishers),
      notes: this.editBook.notes,
      // Prepare category and subject
      category: prepareCategorySubject(this.editBook.category),
      subject: prepareCategorySubject(this.editBook.subject)
    };

    // Attach image file if any
    if (this.selectedImageFile) {
      payload.image = this.selectedImageFile.name;
    }

    this.bookService.updateBook(this.book._id!, payload).subscribe(
      (updatedBook) => {
        // Success handling (same as before)
        this.book = updatedBook;
        this.originalBook = JSON.parse(JSON.stringify(updatedBook));
        this.isEditMode = false;
        this.selectedImageFile = null;

        // Reset all search terms
        this.authorSearchTerm = '';
        this.commentatorSearchTerm = '';
        this.editorSearchTerm = '';
        this.caretakerSearchTerm = '';
        this.muhashiSearchTerm = '';
        this.publisherSearchTerm = '';
        this.categorySearchTerm = '';
        this.subjectSearchTerm = '';

        this.closeAllDropdowns();
        alert('تم تحديث الكتاب بنجاح!');
      },
      (err) => {
        console.error('Error updating book:', err);
        alert('حدث خطأ في تحديث الكتاب');
      }
    );
  }

  loadPeople(): void {
    this.bookService.getPeople().subscribe((people) => {
      this.people = people;
      this.authors = people.filter((p) => p.type === 'author' || !p.type);
      this.commentators = people.filter((p) => p.type === 'commentator');
      this.editors = people.filter((p) => p.type === 'editor');
      this.caretakers = people.filter((p) => p.type === 'caretaker');
      this.muhashis = people.filter((p) => p.type === 'muhashi');

      // Initialize filtered arrays with all items
      this.filteredAuthors = [...this.authors];
      this.filteredCommentators = [...this.commentators];
      this.filteredEditors = [...this.editors];
      this.filteredCaretakers = [...this.caretakers];
      this.filteredMuhashis = [...this.muhashis];
    });
  }

  loadCategories(): void {
    this.bookService.getCategories().subscribe((cats) => {
      this.categories = cats;
      this.filteredCategories = [...cats];
    });
  }

  loadSubjects(): void {
    this.bookService.getSubjects().subscribe((sub) => {
      this.subjects = sub;
      this.filteredSubjects = [...sub];
    });
  }

  loadPublishers(): void {
    this.bookService.getPublishers().subscribe((pubs) => {
      this.publishers = pubs;
      this.filteredPublishers = [...pubs];
    });
  }

  onImageSelected(evt: Event): void {
    const inp = evt.target as HTMLInputElement;
    if (inp.files && inp.files.length) {
      this.selectedImageFile = inp.files[0];
    }
  }

  // Original methods
  editBookOld(): void {
    this.router.navigate(['/books/edit', this.book._id]);
  }

  deleteBook(): void {
    if (!confirm('هل أنت متأكد من حذف هذا الكتاب؟')) return;

    this.bookService.deleteBook(this.book._id!).subscribe(
      () => {
        alert('تم حذف الكتاب');
        this.router.navigate(['/']);
      },
      (err) => {
        alert('فشل حذف الكتاب');
        console.error(err);
      }
    );
  }

  // Helper methods for template display
  getAuthorsNames(): string {
    return this.book.authors?.map(a => a.name).join('، ') || '';
  }

  getEditorsNames(): string {
    return this.book.editors?.map(e => e.name).join('، ') || '';
  }

  getCommentatorsNames(): string {
    return this.book.commentators?.map(c => c.name).join('، ') || '';
  }

  getCaretakersNames(): string {
    return this.book.caretakers?.map(c => c.name).join('، ') || '';
  }

  getPublishersNames(): string {
    return this.book.publishers?.map(p => p.title).join('، ') || '';
  }

  getMuhashisNames(): string {
    return this.book.muhashis?.map(m => m.name).join('، ') || '';
  }
}