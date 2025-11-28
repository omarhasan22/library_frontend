import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookService } from '../../services/book.service';
import { Book } from '../../models/book.model';
import { Category } from '../../models/category.model';
import { SubjectCategory } from '../../models/subject.model';
import { Publisher } from 'src/app/models/publisher.model';
import { forkJoin } from 'rxjs'; // Import forkJoin for parallel API calls

@Component({
  selector: 'app-add-book',
  templateUrl: './add-book.component.html',
  styleUrls: ['./add-book.component.css'],
})
export class AddBookComponent implements OnInit {
  categories: Category[] = [];
  subjects: SubjectCategory[] = [];
  publishers: Publisher[] = [];

  people: any[] = [];
  authors: any[] = [];
  commentators: any[] = [];
  editors: any[] = [];
  caretakers: any[] = [];
  muhashis: any[] = [];

  // Filtered arrays for search functionality
  filteredAuthors: any[] = [];
  filteredCommentators: any[] = [];
  filteredEditors: any[] = [];
  filteredCaretakers: any[] = [];
  filteredPublishers: any[] = [];
  filteredCategories: any[] = [];
  filteredSubjects: any[] = [];
  filteredMuhashis: any[] = [];

  // Search input values
  authorSearchTerm = '';
  commentatorSearchTerm = '';
  editorSearchTerm = '';
  caretakerSearchTerm = '';
  publisherSearchTerm = '';
  categorySearchTerm = '';
  subjectSearchTerm = '';
  muhashiSearchTerm = '';

  // Show dropdown flags
  showAuthorDropdown = false;
  showCommentatorDropdown = false;
  showEditorDropdown = false;
  showCaretakerDropdown = false;
  showPublisherDropdown = false;
  showCategoryDropdown = false;
  showSubjectDropdown = false;
  showMuhashiDropdown = false;

  selectedImageFile: File | null = null;
  loading: boolean = false; // Added loading indicator

  // Edit mode properties
  isEditMode: boolean = false;
  bookId: string | null = null;

  newBook: Book & {
    address: {
      roomNumber: string;
      shelfNumber: string;
      wallNumber: string;
      bookNumber: string;
    };
    notes?: string;
  } = {
      title: '',
      authors: [],
      commentators: [],
      editors: [],
      caretakers: [],
      muhashis: [],
      category: { title: '', _id: '' },
      subject: { title: '', _id: '' },
      numberOfVolumes: 1,
      numberOfFolders: 1,
      publishers: [],
      editionNumber: 1,
      // publicationYear: 1,
      pageCount: 1,
      address: {
        roomNumber: '',
        shelfNumber: '',
        wallNumber: '',
        bookNumber: '1',
      },
      imageUrl: '',
      notes: ''
    };

  // for the input’s raw text
  pageCountInput = '';

  // computed total, or null if invalid
  pageCountTotal: number | null = null;

  @Output() newBookAdded = new EventEmitter<Book>();

  constructor(
    private bookService: BookService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Check if we're in edit mode (has id in route)
    this.bookId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.bookId;

    this.loadAllInitialData();

    // If editing, load the book data
    if (this.isEditMode && this.bookId) {
      this.loadBookForEdit(this.bookId);
    }

    // Add click listener to close dropdowns when clicking outside
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-dropdown-container')) {
        this.closeAllDropdowns();
      }
    });
  }

  loadBookForEdit(bookId: string): void {
    this.loading = true;
    this.bookService.getBookById(bookId).subscribe({
      next: (book) => {
        this.newBook = {
          ...book,
          authors: book.authors || [],
          commentators: book.commentators || [],
          editors: book.editors || [],
          caretakers: book.caretakers || [],
          muhashis: book.muhashis || [],
          publishers: book.publishers || [],
          category: book.category || { title: '', _id: '' },
          subject: book.subject || { title: '', _id: '' },
          address: {
            roomNumber: book.address?.roomNumber || '',
            shelfNumber: book.address?.shelfNumber || '',
            wallNumber: book.address?.wallNumber || '',
            bookNumber: book.address?.bookNumber || ''
          },
          notes: book.notes || ''
        };
        // Set page count input for display
        this.pageCountInput = book.pageCount?.toString() || '';
        this.pageCountTotal = book.pageCount || null;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading book for edit:', err);
        alert('فشل في تحميل بيانات الكتاب');
        this.loading = false;
        this.router.navigate(['/books']);
      }
    });
  }

  private normalizeArabicText(text: string): string {
    if (!text) return '';

    return text
      // Remove all diacritics (tashkeel)
      .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
      // Normalize different forms of alef
      .replace(/[\u0622\u0623\u0625\u0627]/g, 'ا')
      // Normalize alef maksura to ya
      .replace(/\u0649/g, 'ي')
      // Normalize taa marbouta to haa
      .replace(/\u0629/g, 'ه')
      // Remove hamza above and below
      .replace(/[\u0654\u0655]/g, '')
      // Normalize waw with hamza
      .replace(/\u0624/g, 'و')
      // Normalize ya with hamza
      .replace(/\u0626/g, 'ي')
      // Remove standalone hamza
      .replace(/\u0621/g, '')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  // --- Initial Data Loading ---
  loadAllInitialData(): void {
    this.loading = true; // Set loading to true while fetching initial data
    forkJoin([
      this.bookService.getPeople(),
      this.bookService.getCategories(),
      this.bookService.getSubjects(),
      this.bookService.getPublishers()
    ]).subscribe({
      next: ([people, categories, subjects, publishers]) => {
        this.people = people;
        this.authors = people.filter(p => p.type === 'author');
        this.commentators = people.filter(p => p.type === 'commentator');
        this.editors = people.filter(p => p.type === 'editor');
        this.caretakers = people.filter(p => p.type === 'caretaker');
        this.muhashis = people.filter(p => p.type === 'muhashi');

        this.filteredAuthors = [...this.authors];
        this.filteredCommentators = [...this.commentators];
        this.filteredEditors = [...this.editors];
        this.filteredCaretakers = [...this.caretakers];
        this.filteredMuhashis = [...this.muhashis];

        this.categories = categories;
        this.filteredCategories = [...categories];

        this.subjects = subjects;
        this.filteredSubjects = [...subjects];

        this.publishers = publishers;
        this.filteredPublishers = [...publishers];

        this.loading = false; // Set loading to false after all data is fetched
      },
      error: (err) => {
        console.error('Error loading initial data:', err);
        this.loading = false; // Ensure loading is set to false even on error
      }
    });
  }

  // --- Dropdown Management ---
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

  loadPeople() {
    this.bookService.getPeople().subscribe(people => {
      this.people = people;
      this.authors = people.filter(p => p.type === 'author');
      this.commentators = people.filter(p => p.type === 'commentator');
      this.editors = people.filter(p => p.type === 'editor');
      this.caretakers = people.filter(p => p.type === 'caretaker');
      this.muhashis = people.filter(p => p.type === 'muhashi');
      this.filteredAuthors = [...this.authors];
      this.filteredCommentators = [...this.commentators];
      this.filteredEditors = [...this.editors];
      this.filteredCaretakers = [...this.caretakers];
      this.filteredMuhashis = [...this.muhashis];
    });
  }

  loadCategories() {
    this.bookService.getCategories().subscribe(cats => {
      this.categories = cats;
      this.filteredCategories = [...cats];
    });
  }

  loadSubjects() {
    this.bookService.getSubjects().subscribe(sub => {
      this.subjects = sub;
      this.filteredSubjects = [...sub];
    });
  }

  loadPublishers() {
    this.bookService.getPublishers().subscribe(pubs => {
      this.publishers = pubs;
      this.filteredPublishers = [...pubs];
    });
  }

  // --- Search Functionality ---
  onAuthorSearch(term: string) {
    this.authorSearchTerm = term;
    const normalizedSearchTerm = this.normalizeArabicText(term);

    this.filteredAuthors = this.authors.filter(author => {
      // If the author object has normalizedName from backend, use it
      // Otherwise, normalize the name on the fly
      const normalizedAuthorName = author.normalizedName || this.normalizeArabicText(author.name);
      return normalizedAuthorName.includes(normalizedSearchTerm);
    });
    this.showAuthorDropdown = true;
  }

  onCommentatorSearch(term: string) {
    this.commentatorSearchTerm = term;
    const normalizedSearchTerm = this.normalizeArabicText(term);

    this.filteredCommentators = this.commentators.filter(commentator => {
      const normalizedCommentatorName = commentator.normalizedName || this.normalizeArabicText(commentator.name);
      return normalizedCommentatorName.includes(normalizedSearchTerm);
    });
    this.showCommentatorDropdown = true;
  }

  onEditorSearch(term: string) {
    this.editorSearchTerm = term;
    const normalizedSearchTerm = this.normalizeArabicText(term);

    this.filteredEditors = this.editors.filter(editor => {
      const normalizedEditorName = editor.normalizedName || this.normalizeArabicText(editor.name);
      return normalizedEditorName.includes(normalizedSearchTerm);
    });
    this.showEditorDropdown = true;
  }

  onCaretakerSearch(term: string) {
    this.caretakerSearchTerm = term;
    const normalizedSearchTerm = this.normalizeArabicText(term);

    this.filteredCaretakers = this.caretakers.filter(caretaker => {
      const normalizedCaretakerName = caretaker.normalizedName || this.normalizeArabicText(caretaker.name);
      return normalizedCaretakerName.includes(normalizedSearchTerm);
    });
    this.showCaretakerDropdown = true;
  }

  onPublisherSearch(term: string) {
    this.publisherSearchTerm = term;
    const normalizedSearchTerm = this.normalizeArabicText(term);

    this.filteredPublishers = this.publishers.filter(publisher => {
      const normalizedPublisherTitle = publisher.normalizedTitle || this.normalizeArabicText(publisher.title);
      return normalizedPublisherTitle.includes(normalizedSearchTerm);
    });
    this.showPublisherDropdown = true;
  }

  onCategorySearch(term: string) {
    this.categorySearchTerm = term;
    const normalizedSearchTerm = this.normalizeArabicText(term);

    this.filteredCategories = this.categories.filter(category => {
      const normalizedCategoryTitle = category.normalizedTitle || this.normalizeArabicText(category.title);
      return normalizedCategoryTitle.includes(normalizedSearchTerm);
    });
    this.showCategoryDropdown = true;
  }

  onSubjectSearch(term: string) {
    this.subjectSearchTerm = term;
    const normalizedSearchTerm = this.normalizeArabicText(term);

    this.filteredSubjects = this.subjects.filter(subject => {
      const normalizedSubjectTitle = subject.normalizedTitle || this.normalizeArabicText(subject.title);
      return normalizedSubjectTitle.includes(normalizedSearchTerm);
    });
    this.showSubjectDropdown = true;
  }

  onMuhashiSearch(term: string) {
    this.muhashiSearchTerm = term;
    const normalizedSearchTerm = this.normalizeArabicText(term);

    this.filteredMuhashis = this.muhashis.filter(m => {
      const normalizedMuhashiName = m.normalizedName || this.normalizeArabicText(m.name);
      return normalizedMuhashiName.includes(normalizedSearchTerm);
    });
    this.showMuhashiDropdown = true;
  }
  // --- Selection from Dropdowns ---
  selectAuthor(author: any) {
    if (!this.newBook.authors.some(a => a._id === author._id)) {
      this.newBook.authors.push({ _id: author._id, name: author.name });
    }
    this.authorSearchTerm = '';
    this.showAuthorDropdown = false;
  }

  selectCommentator(commentator: any) {
    this.newBook.commentators = this.newBook.commentators || [];
    if (!this.newBook.commentators.some(c => c._id === commentator._id)) {
      this.newBook.commentators.push({ _id: commentator._id, name: commentator.name });
    }
    this.commentatorSearchTerm = '';
    this.showCommentatorDropdown = false;
  }

  selectEditor(editor: any) {
    this.newBook.editors = this.newBook.editors || [];
    if (!this.newBook.editors.some(e => e._id === editor._id)) {
      this.newBook.editors.push({ _id: editor._id, name: editor.name });
    }
    this.editorSearchTerm = '';
    this.showEditorDropdown = false;
  }

  selectCaretaker(caretaker: any) {
    if (!this.newBook.caretakers.some(c => c._id === caretaker._id)) {
      this.newBook.caretakers.push({ _id: caretaker._id, name: caretaker.name });
    }
    this.caretakerSearchTerm = '';
    this.showCaretakerDropdown = false;
  }

  selectPublisher(publisher: any) {
    this.newBook.publishers = this.newBook.publishers || [];
    if (!this.newBook.publishers.some(p => p._id === publisher._id)) {
      this.newBook.publishers.push({ _id: publisher._id, title: publisher.title });
    }
    this.publisherSearchTerm = '';
    this.showPublisherDropdown = false;
  }

  selectCategory(category: any) {
    this.newBook.category = { _id: category._id, title: category.title };
    this.categorySearchTerm = '';
    this.showCategoryDropdown = false;
  }

  selectSubject(subject: any) {
    this.newBook.subject = { _id: subject._id, title: subject.title };
    this.subjectSearchTerm = '';
    this.showSubjectDropdown = false;
  }

  selectMuhashi(muhashi: any) {
    this.newBook.muhashis = this.newBook.muhashis || [];
    if (!this.newBook.muhashis.some(m => m._id === muhashi._id)) {
      this.newBook.muhashis.push({ _id: muhashi._id, name: muhashi.name });
    }
    this.muhashiSearchTerm = '';
    this.showMuhashiDropdown = false;
  }

  // --- Adding New Items (and refreshing data) ---
  addNewAuthor() {
    if (this.authorSearchTerm.trim()) {
      this.bookService.createPerson({ name: this.authorSearchTerm.trim(), type: 'author' }).subscribe(
        (newPerson) => {
          this.authors.push(newPerson); // Add to the main authors list
          this.newBook.authors.push({ _id: newPerson._id, name: newPerson.name }); // Add to new book's authors
          this.authorSearchTerm = '';
          this.showAuthorDropdown = false;
          this.loadPeople(); // Recall to update all people lists
        },
        (error) => {
          console.error('Error adding new author:', error);
          alert('Failed to add new author.');
        }
      );
    }
  }

  addNewCommentator() {
    if (this.commentatorSearchTerm.trim()) {
      this.bookService.createPerson({ name: this.commentatorSearchTerm.trim(), type: 'commentator' }).subscribe(
        (newPerson) => {
          this.commentators.push(newPerson);
          this.newBook.commentators = this.newBook.commentators || [];
          this.newBook.commentators.push({ _id: newPerson._id, name: newPerson.name });
          this.commentatorSearchTerm = '';
          this.showCommentatorDropdown = false;
          // this.loadPeople();
        },
        (error) => {
          console.error('Error adding new commentator:', error);
          alert('Failed to add new commentator.');
        }
      );
    }
  }

  addNewEditor() {
    if (this.editorSearchTerm.trim()) {
      this.bookService.createPerson({ name: this.editorSearchTerm.trim(), type: 'editor' }).subscribe(
        (newPerson) => {
          this.editors.push(newPerson);
          this.newBook.editors = this.newBook.editors || [];
          this.newBook.editors.push({ _id: newPerson._id, name: newPerson.name });
          this.editorSearchTerm = '';
          this.showEditorDropdown = false;
          this.loadPeople();
        },
        (error) => {
          console.error('Error adding new editor:', error);
          alert('Failed to add new editor.');
        }
      );
    }
  }

  addNewCaretaker() {
    if (this.caretakerSearchTerm.trim()) {
      this.bookService.createPerson({ name: this.caretakerSearchTerm.trim(), type: 'caretaker' }).subscribe(
        (newPerson) => {
          this.caretakers.push(newPerson);
          this.newBook.caretakers.push({ _id: newPerson._id, name: newPerson.name });
          this.caretakerSearchTerm = '';
          this.showCaretakerDropdown = false;
          this.loadPeople();
        },
        (error) => {
          console.error('Error adding new caretaker:', error);
          alert('Failed to add new caretaker.');
        }
      );
    }
  }

  addNewPublisher() {
    if (this.publisherSearchTerm.trim()) {
      this.bookService.createPublisher({ title: this.publisherSearchTerm.trim() }).subscribe(
        (newPublisher) => {
          this.publishers.push(newPublisher); // Add to the main publishers list
          this.newBook.publishers = this.newBook.publishers || [];
          this.newBook.publishers.push({ _id: newPublisher._id, title: newPublisher.title });
          this.publisherSearchTerm = '';
          this.showPublisherDropdown = false;
          this.loadPublishers(); // Recall to update publishers list
        },
        (error) => {
          console.error('Error adding new publisher:', error);
          alert('Failed to add new publisher.');
        }
      );
    }
  }

  addNewCategory() {
    if (this.categorySearchTerm.trim()) {
      this.bookService.createCategory({ title: this.categorySearchTerm.trim() }).subscribe(
        (newCategory) => {
          this.categories.push(newCategory); // Add to the main categories list
          this.newBook.category = { _id: newCategory._id, title: newCategory.title };
          this.categorySearchTerm = '';
          this.showCategoryDropdown = false;
          this.loadCategories(); // Recall to update categories list
        },
        (error) => {
          console.error('Error adding new category:', error);
          alert('Failed to add new category.');
        }
      );
    }
  }

  addNewSubject() {
    if (this.subjectSearchTerm.trim()) {
      this.bookService.createSubject({ title: this.subjectSearchTerm.trim() }).subscribe(
        (newSubject) => {
          this.subjects.push(newSubject); // Add to the main subjects list
          this.newBook.subject = { _id: newSubject._id, title: newSubject.title };
          this.subjectSearchTerm = '';
          this.showSubjectDropdown = false;
          this.loadSubjects(); // Recall to update subjects list
        },
        (error) => {
          console.error('Error adding new subject:', error);
          alert('Failed to add new subject.');
        }
      );
    }
  }

  addNewMuhashi() {
    if (this.muhashiSearchTerm.trim()) {
      this.bookService.createPerson({ name: this.muhashiSearchTerm.trim(), type: 'muhashi' }).subscribe(
        (newPerson) => {
          this.muhashis.push(newPerson);
          this.newBook.muhashis = this.newBook.muhashis || [];
          this.newBook.muhashis.push({ _id: newPerson._id, name: newPerson.name });
          this.muhashiSearchTerm = '';
          this.showMuhashiDropdown = false;
          this.loadPeople();
        },
        (error) => {
          console.error('Error adding new muhashi:', error);
          alert('Failed to add new muhashi.');
        }
      );
    }
  }

  // --- Removal of Selected Items ---
  removeAuthor(index: number) {
    this.newBook.authors.splice(index, 1);
  }

  removeCommentator(index: number) {
    this.newBook.commentators.splice(index, 1);
  }

  removeEditor(index: number) {
    this.newBook.editors.splice(index, 1);
  }

  removeCaretaker(index: number) {
    this.newBook.caretakers.splice(index, 1);
  }

  removePublisher(index: number) {
    this.newBook.publishers.splice(index, 1);
  }

  removeMuhashi(index: number) {
    this.newBook.muhashis.splice(index, 1);
  }

  // --- Image Handling ---
  onImageSelected(evt: Event) {
    const inp = evt.target as HTMLInputElement;
    if (inp.files && inp.files.length) {
      this.selectedImageFile = inp.files[0];
    }
  }

  /** Called whenever the input string changes */
  onPageCountChange(expr: string): void {
    this.pageCountInput = expr.trim();

    // try to calculate it
    const total = this.calculateExpression(this.pageCountInput);

    if (total !== null) {
      this.pageCountTotal = total;
      this.newBook.pageCount = total;    // ← store only the numeric result
    } else {
      this.pageCountTotal = null;
      // optionally: leave newBook.pageCount unchanged or reset to 0
    }
  }

  /** exactly as before: only digits/operators allowed */
  private calculateExpression(expr: string): number | null {
    if (!expr || !/^[0-9+\-*/().\s]+$/.test(expr)) {
      return null;
    }
    try {
      // tslint:disable-next-line:no-function-constructor-with-string-args
      const fn = new Function(`return ${expr}`);
      const result = fn();
      return typeof result === 'number' && isFinite(result) ? result : null;
    } catch {
      return null;
    }
  }


  // --- Prepare Payload (shared between add and update) ---
  private preparePayload(): any {
    const payload: any = { ...this.newBook };
    console.log('Payload before processing:', payload);

    // Clean up temporary _id if new items were added without an _id from the backend
    payload.authors = payload.authors.map((p: any) => p._id ? p._id : { name: p.name });
    payload.commentators = payload.commentators.map((p: any) => p._id ? p._id : { name: p.name });
    payload.editors = payload.editors.map((p: any) => p._id ? p._id : { name: p.name });
    payload.caretakers = payload.caretakers.map((p: any) => p._id ? p._id : { name: p.name });
    payload.muhashis = payload.muhashis.map((p: any) => p._id ? p._id : { name: p.name });
    payload.publishers = payload.publishers.map((p: any) => p._id ? p._id : { title: p.title });

    // Only send _id if it exists, otherwise send the title/name for new creation
    if (payload.category && payload.category._id) {
      payload.category = payload.category._id;
    } else if (payload.category && payload.category.title) {
      payload.category = { title: payload.category.title };
    } else {
      delete payload.category;
    }

    if (payload.subject && payload.subject._id) {
      payload.subject = payload.subject._id;
    } else if (payload.subject && payload.subject.title) {
      payload.subject = { title: payload.subject.title };
    } else {
      delete payload.subject;
    }

    return payload;
  }

  // --- Add or Update Book Submission ---
  addBook(): void {
    this.loading = true;
    const payload = this.preparePayload();

    if (this.isEditMode && this.bookId) {
      // Update existing book
      this.bookService.updateBook(this.bookId, payload).subscribe({
        next: (updatedBook) => {
          alert('تم تحديث الكتاب بنجاح!');
          this.loading = false;
          this.router.navigate(['/books', this.bookId]);
        },
        error: (err) => {
          console.error('Error updating book:', err);
          alert('فشل في تحديث الكتاب. يرجى التحقق من المدخلات والمحاولة مرة أخرى.');
          this.loading = false;
        }
      });
    } else {
      // Create new book
      this.bookService.createBook(payload).subscribe({
        next: (createdBook) => {
          alert('تم إضافة الكتاب بنجاح!');
          this.loading = false;
          window.scrollTo({ top: 0, behavior: 'smooth' });

          const curr = parseInt(this.newBook.address.bookNumber, 10) || 0;
          this.newBook.address.bookNumber = String(curr + 1);
          const addedBook = this.newBook;

          // Reset fields after successful submission
          this.newBook = {
            title: '',
            authors: [],
            commentators: [],
            editors: [],
            caretakers: [],
            muhashis: [],
            category: addedBook.category,
            subject: addedBook.subject,
            numberOfVolumes: 1,
            numberOfFolders: 1,
            publishers: [],
            editionNumber: 1,
            publicationYear: 1,
            pageCount: 1,
            address: {
              roomNumber: addedBook.address.roomNumber,
              shelfNumber: addedBook.address.shelfNumber,
              wallNumber: addedBook.address.wallNumber,
              bookNumber: String(curr + 1),
            },
            imageUrl: '',
            notes: ''
          };
          this.selectedImageFile = null;

          // Reset search terms
          this.authorSearchTerm = '';
          this.commentatorSearchTerm = '';
          this.editorSearchTerm = '';
          this.caretakerSearchTerm = '';
          this.publisherSearchTerm = '';
          this.categorySearchTerm = '';
          this.subjectSearchTerm = '';
          this.muhashiSearchTerm = '';
          this.pageCountInput = '';
          this.pageCountTotal = 0;
          this.newBookAdded.emit(createdBook);
        },
        error: (err) => {
          console.error('Error adding book:', err);
          alert('فشل في إضافة الكتاب. يرجى التحقق من المدخلات والمحاولة مرة أخرى.');
          this.loading = false;
        }
      });
    }
  }
}