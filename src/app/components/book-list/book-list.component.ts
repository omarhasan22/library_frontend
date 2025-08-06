import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { BookService } from '../../services/book.service';
import { Book } from '../../models/book.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-book-list',
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.css']
})
export class BookListComponent implements OnInit {
  books: Book[] = [];
  searchQuery: string = '';
  @Input() addedBook: Book | null = null;

  totalBooks: number = 0;
  uniqueAuthors: number = 0;
  uniquePublishers: number = 0;

  searchOption: string = 'all';
  searchTerm: string = '';
  categories = [
    { key: 'title', value: 'العنوان' },
    { key: 'authors', value: 'المؤلف' },
    { key: 'commentators', value: 'الشارحون' },
    { key: 'editors', value: 'المحقق' },
    { key: 'caretakers', value: 'من اعتنى بهم' },
    { key: 'numberOfVolumes', value: 'عدد الأجزاء' },
    { key: 'publishers', value: 'الدار' },
    { key: 'editionNumber', value: 'رقم الطبعة' },
    { key: 'publicationYear', value: 'سنة الطباعة' },
    { key: 'category', value: 'التصنيف' },
    { key: 'subcategory', value: 'التصنيف الفرعي' },
    { key: 'roomNumber', value: 'رقم الغرفة' },
    { key: 'shelfNumber', value: 'رقم الرف' },
    { key: 'wallNumber', value: 'رقم الجدار' },
    { key: 'bookNumber', value: 'الكتاب رقم' }
  ];
  private refreshSub!: Subscription;

  constructor(private bookService: BookService, private router: Router) { }

  ngOnInit(): void {
    this.loadBooks();
  }
  getNames(list?: { name?: string }[]): string {
    return list && list.length ? list.map(i => i.name).filter(Boolean).join(', ') : '—';
  }

  getTitles(list?: { title?: string }[]): string {
    return list && list.length ? list.map(i => i.title).filter(Boolean).join(', ') : '—';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['addedBook'] && this.addedBook) {
      const exists = this.books.some(book => book._id === this.addedBook!._id);
      if (!exists) {
        this.books.unshift(this.addedBook);
        this.totalBooks++;
        this.uniqueAuthors += this.addedBook.authors?.length || 0;
        this.uniquePublishers += this.addedBook.publishers?.length || 0;
      }
    }
  }

  loadBooks(): void {
    this.bookService.getAllBooks(this.searchOption, this.searchQuery).subscribe(
      (res) => {
        this.books = res.books;
        this.totalBooks = res.totalBooks;
        this.uniqueAuthors = res.uniqueAuthors;
        this.uniquePublishers = res.uniquePublishers;
      },
      (error) => console.error('Error fetching books:', error)
    );
  }


  viewBook(id: string): void {
    this.router.navigate(['/books', id]);
  }

  renderValue(book: any, key: string): string {
    const value = book[key];

    if (['authors', 'editors', 'commentators', 'caretakers', 'muhashis'].includes(key)) {
      return this.getNames(value);
    }

    if (key === 'publishers') {
      return this.getTitles(value);
    }

    if (key === 'category' || key === 'subcategory') {
      return book[key]?.title || '—';
    }

    if (['roomNumber', 'shelfNumber', 'wallNumber', 'bookNumber'].includes(key)) {
      return book.address?.[key] ?? '—';
    }

    return value !== undefined && value !== null ? value : '—';
  }

}
