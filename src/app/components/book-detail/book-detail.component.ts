import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookService } from '../../services/book.service';
import { Book } from '../../models/book.model';
import { Category } from '../../models/category.model';
import { Subject } from '../../models/subject.model';
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
  subjects: Subject[] = [];
  publishers: Publisher[] = [];
  people: any[] = [];
  authors: any[] = [];
  muhashis: any[] = [];
  editors: any[] = [];
  caretakers: any[] = [];

  // For new entries
  newAuthorName = '';
  newMuhashiName = '';
  newEditorName = '';
  newCaretakerName = '';
  newPublisherName = '';
  newCategoryName = '';
  newSubjectName = '';

  // For dropdown selections
  selectedAuthorId = '';
  selectedMuhashiId = '';
  selectedEditorId = '';
  selectedCaretakerId = '';
  selectedPublisherId = '';
  selectedCategoryId = '';
  selectedSubjectId = '';

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
  }

  initializeEditBook(): void {
    this.editBook = {
      ...this.book,
      author: { name: this.book.author?.name || '' },
      muhashi: { name: this.book.muhashi?.name || '' },
      editor: { name: this.book.editor?.name || '' },
      caretaker: { name: this.book.caretaker?.name || '' },
      publisher: { title: this.book.publisher?.title || '' },
      category: { title: this.book.category?.title || '' },
      subject: { title: this.book.subject?.title || '' },
      address: {
        roomNumber: this.book.address?.roomNumber || '',
        shelfNumber: this.book.address?.shelfNumber || '',
        wallNumber: this.book.address?.wallNumber || '',
        bookNumber: this.book.address?.bookNumber || ''
      }
    };

    // Set selected IDs for dropdowns
    this.setSelectedIds();
  }

  setSelectedIds(): void {
    // Find and set the selected IDs based on current book data
    if (this.book.author && typeof this.book.author === 'object' && '_id' in this.book.author) {
      this.selectedAuthorId = (this.book.author as any)._id;
    } else {
      const author = this.authors.find(a => a.name === this.book.author?.name);
      this.selectedAuthorId = author ? author._id : '';
    }

    if (this.book.muhashi && typeof this.book.muhashi === 'object' && '_id' in this.book.muhashi) {
      this.selectedMuhashiId = (this.book.muhashi as any)._id;
    } else {
      const muhashi = this.muhashis.find(m => m.name === this.book.muhashi?.name);
      this.selectedMuhashiId = muhashi ? muhashi._id : '';
    }

    // Similar for other fields...
  }

  toggleEditMode(): void {
    this.isEditMode = true;
    this.initializeEditBook();
    this.clearNewFields();
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.clearNewFields();
    this.selectedImageFile = null;
    // Reset editBook to original values
    this.initializeEditBook();
  }

  clearNewFields(): void {
    this.newAuthorName = '';
    this.newMuhashiName = '';
    this.newEditorName = '';
    this.newCaretakerName = '';
    this.newPublisherName = '';
    this.newCategoryName = '';
    this.newSubjectName = '';
  }

  saveBook(): void {
    const payload: any = {
      title: this.editBook.title,
      numberOfVolumes: this.editBook.numberOfVolumes,
      editionNumber: this.editBook.editionNumber,
      publicationYear: this.editBook.publicationYear,
      pageCount: this.editBook.pageCount,
      address: this.editBook.address
    };

    // Handle author
    if (this.newAuthorName) {
      payload.author = { name: this.newAuthorName };
    } else if (this.editBook.author.name) {
      const foundAuthor = this.authors.find(a => a.name === this.editBook.author.name);
      payload.author = foundAuthor ? foundAuthor._id : { name: this.editBook.author.name };
    }

    // Handle muhashi
    if (this.newMuhashiName) {
      payload.muhashi = { name: this.newMuhashiName };
    } else if (this.editBook.muhashi.name) {
      const foundMuhashi = this.muhashis.find(m => m.name === this.editBook.muhashi.name);
      payload.muhashi = foundMuhashi ? foundMuhashi._id : { name: this.editBook.muhashi.name };
    }

    // Handle editor
    if (this.newEditorName) {
      payload.editor = { name: this.newEditorName };
    } else if (this.editBook.editor.name) {
      const foundEditor = this.editors.find(e => e.name === this.editBook.editor.name);
      payload.editor = foundEditor ? foundEditor._id : { name: this.editBook.editor.name };
    }

    // Handle caretaker
    if (this.newCaretakerName) {
      payload.caretaker = { name: this.newCaretakerName };
    } else if (this.editBook.caretaker.name) {
      const foundCaretaker = this.caretakers.find(c => c.name === this.editBook.caretaker.name);
      payload.caretaker = foundCaretaker ? foundCaretaker._id : { name: this.editBook.caretaker.name };
    }

    // Handle publisher
    if (this.newPublisherName) {
      payload.publisher = { title: this.newPublisherName };
    } else if (this.editBook.publisher.title) {
      const foundPublisher = this.publishers.find(p => p.title === this.editBook.publisher.title);
      payload.publisher = foundPublisher ? foundPublisher._id : { title: this.editBook.publisher.title };
    }

    // Handle category
    if (this.newCategoryName) {
      payload.category = { title: this.newCategoryName };
    } else if (this.editBook.category.title) {
      const foundCategory = this.categories.find(c => c.title === this.editBook.category.title);
      payload.category = foundCategory ? foundCategory._id : { title: this.editBook.category.title };
    }

    // Handle subject
    if (this.newSubjectName) {
      payload.subject = { title: this.newSubjectName };
    } else if (this.editBook.subject.title) {
      const foundSubject = this.subjects.find(s => s.title === this.editBook.subject.title);
      payload.subject = foundSubject ? foundSubject._id : { title: this.editBook.subject.title };
    }

    // Attach image file if any
    if (this.selectedImageFile) {
      payload.image = this.selectedImageFile.name;
    }

    this.bookService.updateBook(this.book._id!, payload).subscribe(
      (updatedBook) => {
        this.book = updatedBook;
        this.originalBook = JSON.parse(JSON.stringify(updatedBook));
        this.isEditMode = false;
        this.clearNewFields();
        this.selectedImageFile = null;
        alert('تم تحديث الكتاب بنجاح!');
      },
      (err) => {
        console.error('Error updating book:', err);
        alert('حدث خطأ في تحديث الكتاب');
      }
    );
  }

  // Load data methods (same as add-book component)
  loadPeople(): void {
    this.bookService.getPeople().subscribe((people) => {
      this.people = people;
      this.authors = people.filter((p) => p.type === 'author');
      this.muhashis = people.filter((p) => p.type === 'muhashi');
      this.editors = people.filter((p) => p.type === 'editor');
      this.caretakers = people.filter((p) => p.type === 'caretaker');
    });
  }

  loadCategories(): void {
    this.bookService.getCategories().subscribe((cats) => (this.categories = cats));
  }

  loadSubjects(): void {
    this.bookService.getSubjects().subscribe((sub) => (this.subjects = sub));
  }

  loadPublishers(): void {
    this.bookService.getPublishers().subscribe((pubs) => (this.publishers = pubs));
  }

  // Dropdown change handlers
  onAuthorSelectChange(authorId: string): void {
    const author = this.authors.find(a => a._id === authorId);
    if (author) {
      this.editBook.author.name = author.name;
      this.newAuthorName = ''; // Clear the "add new" field
    }
  }

  onMuhashiSelectChange(muhashiId: string): void {
    const muhashi = this.muhashis.find(m => m._id === muhashiId);
    if (muhashi) {
      this.editBook.muhashi.name = muhashi.name;
      this.newMuhashiName = '';
    }
  }

  // Input change handlers (same as add-book component)
  onAuthorInputChange(val: string): void {
    this.editBook.author.name = val;
    if (val) this.selectedAuthorId = ''; // Clear dropdown selection
  }

  onMuhashiInputChange(val: string): void {
    this.editBook.muhashi = { name: val };
  }

  onEditorInputChange(val: string): void {
    this.editBook.editor.name = val;
  }

  onCaretakerInputChange(val: string): void {
    this.editBook.caretaker.name = val;
  }

  onPublisherInputChange(val: string): void {
    this.editBook.publisher.title = val;
  }

  onCategoryInputChange(val: string): void {
    this.editBook.category.title = val;
  }

  onSubjectInputChange(val: string): void {
    this.editBook.subject.title = val;
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
        this.router.navigate(['/books']);
      },
      (err) => {
        alert('فشل حذف الكتاب');
        console.error(err);
      }
    );
  }
}