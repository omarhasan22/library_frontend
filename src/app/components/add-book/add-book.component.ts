import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { BookService } from '../../services/book.service';
import { Book } from '../../models/book.model';
import { Category } from '../../models/category.model';
import { Subject } from '../../models/subject.model';
import { Publisher } from 'src/app/models/publisher.model';

@Component({
  selector: 'app-add-book',
  templateUrl: './add-book.component.html',
  styleUrls: ['./add-book.component.css'],
})
export class AddBookComponent implements OnInit {
  categories: Category[] = [];
  subjects: Subject[] = [];
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

  @Output() newBookAdded = new EventEmitter<Book>();

  constructor(private bookService: BookService) { }

  ngOnInit(): void {
    this.loadPeople();
    this.loadCategories();
    this.loadSubjects();
    this.loadPublishers();
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

  // Search functionality
  onAuthorSearch(term: string) {
    this.authorSearchTerm = term;
    this.filteredAuthors = this.authors.filter(author =>
      author.name.toLowerCase().includes(term.toLowerCase())
    );
    console.log('Filtered Authors:', this.filteredAuthors);

    this.showAuthorDropdown = term.length > 0;
  }

  onCommentatorSearch(term: string) {
    this.commentatorSearchTerm = term;
    this.filteredCommentators = this.commentators.filter(commentator =>
      commentator.name.toLowerCase().includes(term.toLowerCase())
    );
    this.showCommentatorDropdown = term.length > 0;
  }

  onEditorSearch(term: string) {
    this.editorSearchTerm = term;
    this.filteredEditors = this.editors.filter(editor =>
      editor.name.toLowerCase().includes(term.toLowerCase())
    );
    this.showEditorDropdown = term.length > 0;
  }

  onCaretakerSearch(term: string) {
    this.caretakerSearchTerm = term;
    this.filteredCaretakers = this.caretakers.filter(caretaker =>
      caretaker.name.toLowerCase().includes(term.toLowerCase())
    );
    this.showCaretakerDropdown = term.length > 0;
  }

  onPublisherSearch(term: string) {
    this.publisherSearchTerm = term;
    this.filteredPublishers = this.publishers.filter(publisher =>
      publisher.title.toLowerCase().includes(term.toLowerCase())
    );
    this.showPublisherDropdown = term.length > 0;
  }

  onCategorySearch(term: string) {
    this.categorySearchTerm = term;
    this.filteredCategories = this.categories.filter(category =>
      category.title.toLowerCase().includes(term.toLowerCase())
    );
    this.showCategoryDropdown = term.length > 0;
  }

  onSubjectSearch(term: string) {
    this.subjectSearchTerm = term;
    this.filteredSubjects = this.subjects.filter(subject =>
      subject.title.toLowerCase().includes(term.toLowerCase())
    );
    this.showSubjectDropdown = term.length > 0;
  }

  // Add existing items
  selectAuthor(author: any) {
    if (!this.newBook.authors.find(a => a._id === author._id)) {
      this.newBook.authors.push({ _id: author._id, name: author.name });
    }
    this.authorSearchTerm = '';
    this.showAuthorDropdown = false;
  }

  selectCommentator(commentator: any) {
    this.newBook.commentators = this.newBook.commentators || [];
    if (!this.newBook.commentators.find(c => c._id === commentator._id)) {
      this.newBook.commentators.push({ _id: commentator._id, name: commentator.name });
    }
    this.commentatorSearchTerm = '';
    this.showCommentatorDropdown = false;
  }

  selectEditor(editor: any) {
    this.newBook.editors = this.newBook.editors || [];
    if (!this.newBook.editors.find(e => e._id === editor._id)) {
      this.newBook.editors.push({ _id: editor._id, name: editor.name });
    }
    this.editorSearchTerm = '';
    this.showEditorDropdown = false;
  }

  selectCaretaker(caretaker: any) {
    if (!this.newBook.caretakers.find(c => c._id === caretaker._id)) {
      this.newBook.caretakers.push({ _id: caretaker._id, name: caretaker.name });
    }
    this.caretakerSearchTerm = '';
    this.showCaretakerDropdown = false;
  }

  selectPublisher(publisher: any) {
    this.newBook.publishers = this.newBook.publishers || [];
    if (!this.newBook.publishers.find(p => p._id === publisher._id)) {
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

  // Add new items
  addNewAuthor() {
    if (this.authorSearchTerm.trim()) {
      this.newBook.authors.push({ name: this.authorSearchTerm.trim() });
      this.authorSearchTerm = '';
      this.showAuthorDropdown = false;
    }
  }

  addNewCommentator() {
    if (this.commentatorSearchTerm.trim()) {
      this.newBook.commentators = this.newBook.commentators || [];
      this.newBook.commentators.push({ name: this.commentatorSearchTerm.trim() });
      this.commentatorSearchTerm = '';
      this.showCommentatorDropdown = false;
    }
  }

  addNewEditor() {
    if (this.editorSearchTerm.trim()) {
      this.newBook.editors = this.newBook.editors || [];
      this.newBook.editors.push({ name: this.editorSearchTerm.trim() });
      this.editorSearchTerm = '';
      this.showEditorDropdown = false;
    }
  }

  addNewCaretaker() {
    if (this.caretakerSearchTerm.trim()) {
      this.newBook.caretakers.push({ name: this.caretakerSearchTerm.trim() });
      this.caretakerSearchTerm = '';
      this.showCaretakerDropdown = false;
    }
  }

  addNewPublisher() {
    if (this.publisherSearchTerm.trim()) {
      this.newBook.publishers = this.newBook.publishers || [];
      this.newBook.publishers.push({ title: this.publisherSearchTerm.trim() });
      this.publisherSearchTerm = '';
      this.showPublisherDropdown = false;
    }
  }

  addNewCategory() {
    if (this.categorySearchTerm.trim()) {
      this.newBook.category = { title: this.categorySearchTerm.trim() };
      this.categorySearchTerm = '';
      this.showCategoryDropdown = false;
    }
  }

  addNewSubject() {
    if (this.subjectSearchTerm.trim()) {
      this.newBook.subject = { title: this.subjectSearchTerm.trim() };
      this.subjectSearchTerm = '';
      this.showSubjectDropdown = false;
    }
  }

  addNewMuhashi() {
    if (this.muhashiSearchTerm.trim()) {
      this.newBook.muhashis = this.newBook.muhashis || [];
      this.newBook.muhashis.push({ name: this.muhashiSearchTerm.trim() });
      this.muhashiSearchTerm = '';
      this.showMuhashiDropdown = false;
    }
  }

  selectMuhashi(muhashi: any) {
    this.newBook.muhashis = this.newBook.muhashis || [];
    if (!this.newBook.muhashis.find(m => m._id === muhashi._id)) {
      this.newBook.muhashis.push({ _id: muhashi._id, name: muhashi.name });
    }
    this.muhashiSearchTerm = '';
    this.showMuhashiDropdown = false;
  }

  removeMuhashi(index: number) {
    this.newBook.muhashis.splice(index, 1);
  }

  onMuhashiSearch(term: string) {
    this.muhashiSearchTerm = term;
    this.filteredMuhashis = this.muhashis.filter(m =>
      m.name.toLowerCase().includes(term.toLowerCase())
    );
    this.showMuhashiDropdown = term.length > 0;
  }

  // Remove items
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

  onImageSelected(evt: Event) {
    const inp = evt.target as HTMLInputElement;
    if (inp.files && inp.files.length) {
      this.selectedImageFile = inp.files[0];
    }
  }

  addBook(): void {
    const payload: any = { ...this.newBook };

    if (this.selectedImageFile) {
      payload.image = this.selectedImageFile.name;
    }

    this.bookService.createBook(payload).subscribe(
      createdBook => {
        alert('تم إضافة الكتاب بنجاح!');

        const curr = parseInt(this.newBook.address.bookNumber, 10) || 0;
        this.newBook.address.bookNumber = String(curr + 1);

        // Reset fields
        this.newBook.title = '';
        this.newBook.authors = [];
        this.newBook.commentators = [];
        this.newBook.editors = [];
        this.newBook.caretakers = [];
        this.newBook.numberOfVolumes = 1;
        this.newBook.publishers = [];
        this.newBook.editionNumber = 1;
        this.newBook.publicationYear = new Date().getFullYear();
        this.newBook.pageCount = 1;
        this.newBook.category = { title: '', _id: '' };
        this.newBook.subject = { title: '', _id: '' };
        this.selectedImageFile = null;
        this.newBook.notes = '';
        this.newBook.muhashis = [];

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
      err => console.error('Error adding book:', err)
    );
  }
}