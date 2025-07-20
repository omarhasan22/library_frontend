import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Book } from '../models/book.model';
import { Category } from '../models/category.model';
import { SubjectCategory } from '../models/subject.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private baseUrl = environment.apiUrl;

  private refreshBooks$ = new Subject<void>(); // 🔁 used to notify book-list

  constructor(private http: HttpClient) {}

  // GET all books (with optional search)
  getAllBooks(query: string = ''): Observable<Book[]> {
    const params = query ? new HttpParams().set('q', query) : new HttpParams();
    return this.http.get<Book[]>(`${this.baseUrl}/books`, { params });
  }

  getBookById(id: string): Observable<Book> {
    return this.http.get<Book>(`${this.baseUrl}/books/${id}`);
  }

  // Create Book (with FormData for image)
  createBook(book: any): Observable<Book> {
    const formData = new FormData();

    for (const key in book) {
      if (typeof book[key] === 'object' && book[key] !== null && !(book[key] instanceof File)) {
        for (const subKey in book[key]) {
          formData.append(`${key}[${subKey}]`, book[key][subKey]);
        }
      } else if (book[key] instanceof File) {
        formData.append(key, book[key]); // image
      } else {
        formData.append(key, book[key]);
      }
    }

    return this.http.post<Book>(`${this.baseUrl}/books`, formData);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`);
  }

  getSubjects(): Observable<SubjectCategory[]> {
    return this.http.get<SubjectCategory[]>(`${this.baseUrl}/subjects`);
  }

  getPublishers(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/publishers`);
  }

  updateBook(id: string, book: Partial<Book>): Observable<Book> {
    return this.http.put<Book>(`${this.baseUrl}/books/${id}`, book);
  }

  deleteBook(id: any): Observable<any> {
    return this.http.delete(`${this.baseUrl}/books/${id}`);
  }

  getPeople(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/people`);
  }

  // 🔁 Refresh Book List Mechanism
  triggerRefreshBooks() {
    this.refreshBooks$.next();
  }

  onRefreshBooks(): Observable<void> {
    return this.refreshBooks$.asObservable();
  }
}
