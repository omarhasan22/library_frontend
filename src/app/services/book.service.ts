import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Book } from '../models/book.model';
import { Category } from '../models/category.model';
import { SubjectCategory } from '../models/subject.model';
import { Publisher } from '../models/publisher.model'; // Assuming you have this model
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // GET all books (with optional search)
  getAllBooks(query: string = '', searchTerm: string = ''): Observable<any> {
    let params = new HttpParams();

    if (query) {
      params = params.set('q', query);
    }

    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }
    return this.http.get<Book[]>(`${this.baseUrl}/books`, { params });
  }

  getBookById(id: string): Observable<Book> {
    return this.http.get<Book>(`${this.baseUrl}/books/${id}`);
  }

  // Modified to accept FormData for image upload
  createBook(bookData: FormData): Observable<Book> {
    return this.http.post<Book>(`${this.baseUrl}/books`, bookData);
  }

  updateBook(id: string, book: Partial<Book>): Observable<Book> {
    return this.http.put<Book>(`${this.baseUrl}/books/${id}`, book);
  }

  deleteBook(id: any): Observable<any> {
    return this.http.delete(`${this.baseUrl}/books/${id}`);
  }

  // --- People Endpoints (Authors, Commentators, Editors, Caretakers, Muhashis) ---
  getPeople(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/people`);
  }

  /**
   * Creates a new person (author, commentator, editor, caretaker, muhashi).
   * @param personData Object containing 'name' and 'type' (e.g., { name: 'New Author', type: 'author' })
   */
  createPerson(personData: { name: string; type: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/people`, personData);
  }

  // --- Category Endpoints ---
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`);
  }

  /**
   * Creates a new category.
   * @param categoryData Object containing 'title' (e.g., { title: 'New Category' })
   */
  createCategory(categoryData: { title: string }): Observable<Category> {
    return this.http.post<Category>(`${this.baseUrl}/categories`, categoryData);
  }

  // --- Subject Endpoints ---
  getSubjects(): Observable<SubjectCategory[]> { // Corrected return type to Subject[]
    return this.http.get<SubjectCategory[]>(`${this.baseUrl}/subjects`);
  }

  /**
   * Creates a new subject.
   * @param subjectData Object containing 'title' (e.g., { title: 'New Subject' })
   */
  createSubject(subjectData: { title: string }): Observable<SubjectCategory> {
    return this.http.post<SubjectCategory>(`${this.baseUrl}/subjects`, subjectData);
  }

  // --- Publisher Endpoints ---
  getPublishers(): Observable<Publisher[]> { // Corrected return type to Publisher[]
    return this.http.get<Publisher[]>(`${this.baseUrl}/publishers`);
  }

  /**
   * Creates a new publisher.
   * @param publisherData Object containing 'title' (e.g., { title: 'New Publisher' })
   */
  createPublisher(publisherData: { title: string }): Observable<Publisher> {
    return this.http.post<Publisher>(`${this.baseUrl}/publishers`, publisherData);
  }
}