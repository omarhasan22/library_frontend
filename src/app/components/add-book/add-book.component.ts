// add-book.component.ts
import { Component, OnInit } from '@angular/core';
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
  muhashis: any[] = [];
  editors: any[] = [];
  caretakers: any[] = [];

  newAuthorName = '';
  newMuhashiName = '';
  newEditorName = '';
  newCaretakerName = '';
  newPublisherName = '';
  newCategoryName = '';
  newSubjectName = '';

  selectedImageFile: File | null = null;

  newBook: Book & { address: { roomNumber: string; shelfNumber: string; wallNumber: string; bookNumber: string } } = {
    title: '',
    author: { name: '' },
    muhashi: { name: '' },
    category: { title: '' },
    subject: { title: '' },
    numberOfVolumes: 1,
    publisher: { title: '' },
    editor: { name: '' },
    caretaker: { name: '' },
    editionNumber: 1,
    publicationYear: new Date().getFullYear(),
    pageCount: 1,
    address: {
      roomNumber: '',
      shelfNumber: '',
      wallNumber: '',
      bookNumber: '1',  // start at 1
    },
    imageUrl: ''
  };

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    this.loadPeople();
    this.loadCategories();
    this.loadPublishers();
  }

   loadPeople() {
    this.bookService.getPeople().subscribe((people) => {
      this.people = people;
      this.authors = people.filter((p) => p.type === 'author');
      this.muhashis = people.filter((p) => p.type === 'muhashi');
      this.editors = people.filter((p) => p.type === 'editor');
      this.caretakers = people.filter((p) => p.type === 'caretaker');
    });
  }

   loadCategories() {
    this.bookService.getCategories().subscribe((cats) => (this.categories = cats));
  }

   loadSubjects() {
    this.bookService.getSubjects().subscribe((sub) => (this.subjects = sub));
  }

   loadPublishers() {
    this.bookService.getPublishers().subscribe((pubs) => (this.publishers = pubs));
  }

  onAuthorInputChange(val: string)    { this.newBook.author.name = val; }
  onMuhashiInputChange(val: string)   { this.newBook.muhashi = { name: val }; }
  onEditorInputChange(val: string)    { this.newBook.editor.name = val; }
  onCaretakerInputChange(val: string) { this.newBook.caretaker.name = val; }
  onPublisherInputChange(val: string) { this.newBook.publisher.title = val; }
  onCategoryInputChange(val: string)  { this.newBook.category.title = val; }
  onSubjectInputChange(val: string)  { this.newBook.subject.title = val; }

  onImageSelected(evt: Event) {
    const inp = evt.target as HTMLInputElement;
    if (inp.files && inp.files.length) {
      this.selectedImageFile = inp.files[0];
    }
  }

  addBook(): void {
    const payload: any = { ...this.newBook };

    // override “add new” fields
    if (this.newAuthorName)    payload.author = { name: this.newAuthorName };
    if (this.newMuhashiName)   payload.muhashi = { name: this.newMuhashiName };
    if (this.newEditorName)    payload.editor = { name: this.newEditorName };
    if (this.newCaretakerName) payload.caretaker = { name: this.newCaretakerName };
    if (this.newPublisherName) payload.publisher = { title: this.newPublisherName };
    if (this.newCategoryName)  payload.category = { title: this.newCategoryName };
    if (this.newSubjectName)  payload.subject = { title: this.newSubjectName };

    // attach image file if any
    console.log('Selected image file:', this.selectedImageFile  );
    
    if (this.selectedImageFile) {
      console.log('Selected image file:', this.selectedImageFile);
      
      payload.image = this.selectedImageFile.name;
    }

    this.bookService.createBook(payload).subscribe(
      () => {
        alert('تم إضافة الكتاب بنجاح!');

        // increment bookNumber
        const curr = parseInt(this.newBook.address.bookNumber, 10) || 0;
        this.newBook.address.bookNumber = String(curr + 1);

        // reset only the specified fields
        this.newBook.title = '';
        this.newBook.author = { name: '' };
        this.newAuthorName = '';
        this.newBook.muhashi = { name: '' };
        this.newMuhashiName = '';
        this.newBook.numberOfVolumes = 1;
        this.newBook.publisher = { title: '' };
        this.newPublisherName = '';
        this.newBook.editor = { name: '' };
        this.newEditorName = '';
        this.newBook.caretaker = { name: '' };
        this.newCaretakerName = '';
        this.newBook.editionNumber = 1;
        this.newBook.publicationYear = new Date().getFullYear();
        this.newBook.pageCount = 1;
        this.selectedImageFile = null;
      },
      (err) => console.error('Error adding book:', err)
    );
  }
}
