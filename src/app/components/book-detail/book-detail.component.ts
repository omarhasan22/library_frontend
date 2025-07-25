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
  commentators: any[] = [];
  editors: any[] = [];
  caretakers: any[] = [];

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
    this.editBook.publishers.push({ name: '' });
  }

  removePublisher(index: number): void {
    this.editBook.publishers.splice(index, 1);
  }

  initializeEditBook(): void {
    this.editBook = {
      ...this.book,
      authors: this.book.authors?.length ? [...this.book.authors] : [],
      commentators: this.book.commentators?.length ? [...this.book.commentators] : [],
      editors: this.book.editors?.length ? [...this.book.editors] : [],
      caretakers: this.book.caretakers?.length ? [...this.book.caretakers] : [],
      publishers: this.book.publishers?.length ? [...this.book.publishers] : [],
      category: { title: this.book.category?.title || '' },
      subject: { title: this.book.subject?.title || '' },
      address: {
        roomNumber: this.book.address?.roomNumber || '',
        shelfNumber: this.book.address?.shelfNumber || '',
        wallNumber: this.book.address?.wallNumber || '',
        bookNumber: this.book.address?.bookNumber || ''
      }
    };

    // Ensure arrays have at least one empty entry for the form
    if (this.editBook.authors.length === 0) {
      this.editBook.authors.push({ name: '' });
    }
    if (this.editBook.commentators.length === 0) {
      this.editBook.commentators.push({ name: '' });
    }
    if (this.editBook.editors.length === 0) {
      this.editBook.editors.push({ name: '' });
    }
    if (this.editBook.caretakers.length === 0) {
      this.editBook.caretakers.push({ name: '' });
    }
    if (this.editBook.publishers.length === 0) {
      this.editBook.publishers.push({ name: '' });
    }
  }

  toggleEditMode(): void {
    this.isEditMode = true;
    this.initializeEditBook();
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.selectedImageFile = null;
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
        return field === 'publishers' ? { title: item.title.trim() } : { name: item.name.trim() };
      });
  }

  private prepareEntityPayload(field: string): any {
    const entity = this.editBook[field];
    if (entity?.title && entity.title.trim()) {
      const found = this[field + 's'].find((c: any) => c.title === entity.title.trim());
      return found ? found._id : { title: entity.title.trim() };
    }
    return null;
  }

  saveBook(): void {
    const payload: any = {
      title: this.editBook.title,
      numberOfVolumes: this.editBook.numberOfVolumes,
      editionNumber: this.editBook.editionNumber,
      publicationYear: this.editBook.publicationYear,
      pageCount: this.editBook.pageCount,
      address: this.editBook.address,
      // Array fields
      authors: this.prepareArrayPayload('authors'),
      commentators: this.prepareArrayPayload('commentators'),
      editors: this.prepareArrayPayload('editors'),
      caretakers: this.prepareArrayPayload('caretakers'),
      publishers: this.prepareArrayPayload('publishers'),
      // Category and subject
      category: this.prepareEntityPayload('category'),
      subject: this.prepareEntityPayload('subject')
    };

    // Attach image file if any
    if (this.selectedImageFile) {
      payload.image = this.selectedImageFile.name;
    }

    this.bookService.updateBook(this.book._id!, payload).subscribe(
      (updatedBook) => {
        this.book = updatedBook;
        this.originalBook = JSON.parse(JSON.stringify(updatedBook));
        this.isEditMode = false;
        this.selectedImageFile = null;
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
      this.authors = people.filter((p) => p.type === 'author');
      this.commentators = people.filter((p) => p.type === 'muhashi');
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
    return this.book.publishers?.map(p => p.name).join('، ') || '';
  }
}