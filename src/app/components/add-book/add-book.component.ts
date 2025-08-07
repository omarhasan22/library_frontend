import { Component, EventEmitter, OnInit, Output } from '@angular/core';
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
      publishers: [],
      editionNumber: 1,
      publicationYear: new Date().getFullYear(),
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

  constructor(private bookService: BookService) { }

  ngOnInit(): void {
    this.loadAllInitialData();
    // Add click listener to close dropdowns when clicking outside
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-dropdown-container')) {
        this.closeAllDropdowns();
      }
    });
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
    this.filteredAuthors = this.authors.filter(author =>
      author.name.toLowerCase().includes(term.toLowerCase())
    );
    this.showAuthorDropdown = true; // Always show when typing
  }

  onCommentatorSearch(term: string) {
    this.commentatorSearchTerm = term;
    this.filteredCommentators = this.commentators.filter(commentator =>
      commentator.name.toLowerCase().includes(term.toLowerCase())
    );
    this.showCommentatorDropdown = true;
  }

  onEditorSearch(term: string) {
    this.editorSearchTerm = term;
    this.filteredEditors = this.editors.filter(editor =>
      editor.name.toLowerCase().includes(term.toLowerCase())
    );
    this.showEditorDropdown = true;
  }

  onCaretakerSearch(term: string) {
    this.caretakerSearchTerm = term;
    this.filteredCaretakers = this.caretakers.filter(caretaker =>
      caretaker.name.toLowerCase().includes(term.toLowerCase())
    );
    this.showCaretakerDropdown = true;
  }

  onPublisherSearch(term: string) {
    this.publisherSearchTerm = term;
    this.filteredPublishers = this.publishers.filter(publisher =>
      publisher.title.toLowerCase().includes(term.toLowerCase())
    );
    this.showPublisherDropdown = true;
  }

  onCategorySearch(term: string) {
    this.categorySearchTerm = term;
    this.filteredCategories = this.categories.filter(category =>
      category.title.toLowerCase().includes(term.toLowerCase())
    );
    this.showCategoryDropdown = true;
  }

  onSubjectSearch(term: string) {
    this.subjectSearchTerm = term;
    this.filteredSubjects = this.subjects.filter(subject =>
      subject.title.toLowerCase().includes(term.toLowerCase())
    );
    this.showSubjectDropdown = true;
  }

  onMuhashiSearch(term: string) {
    this.muhashiSearchTerm = term;
    this.filteredMuhashis = this.muhashis.filter(m =>
      m.name.toLowerCase().includes(term.toLowerCase())
    );
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


  // --- Add Book Submission ---
  addBook(): void {
    this.loading = true; // Show loader
    const payload: any = { ...this.newBook };

    // Clean up temporary _id if new items were added without an _id from the backend (should be handled by backend, but good for safety)
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

    // Handle image upload (assuming your backend handles file uploads for 'image' field)
    const formData = new FormData();
    for (const key in payload) {
      if (payload.hasOwnProperty(key)) {
        if (Array.isArray(payload[key])) {
          payload[key].forEach((item: any) => {
            formData.append(`${key}[]`, JSON.stringify(item)); // Append each item as a string
          });
        } else if (typeof payload[key] === 'object' && payload[key] !== null && !(payload[key] instanceof File)) {
          formData.append(key, JSON.stringify(payload[key])); // Stringify nested objects
        } else if (key === 'image' && this.selectedImageFile) {
          formData.append('image', this.selectedImageFile, this.selectedImageFile.name);
        } else {
          formData.append(key, payload[key]);
        }
      }
    }


    this.bookService.createBook(formData).subscribe(
      createdBook => {
        alert('تم إضافة الكتاب بنجاح!');
        this.loading = false; // Hide loader

        const curr = parseInt(this.newBook.address.bookNumber, 10) || 0;
        this.newBook.address.bookNumber = String(curr + 1);

        // Reset fields after successful submission
        this.newBook = {
          title: '',
          authors: [],
          commentators: [],
          editors: [],
          caretakers: [],
          muhashis: [],
          category: { title: '', _id: '' },
          subject: { title: '', _id: '' },
          numberOfVolumes: 1,
          publishers: [],
          editionNumber: 1,
          publicationYear: new Date().getFullYear(),
          pageCount: 1,
          address: {
            roomNumber: '',
            shelfNumber: '',
            wallNumber: '',
            bookNumber: String(curr + 1), // Increment for the next book
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

        this.newBookAdded.emit(createdBook);
      },
      err => {
        console.error('Error adding book:', err);
        alert('فشل في إضافة الكتاب. يرجى التحقق من المدخلات والمحاولة مرة أخرى.');
        this.loading = false; // Hide loader even on error
      }
    );
  }
}