import { Injectable } from '@angular/core';
import { HttpClient, HttpParams  } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Book } from '../models/book.model';
import { Category } from '../models/category.model';
import { Subject } from '../models/subject.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAllBooks(query: string = ''): Observable<Book[]> {
    const params = query ? new HttpParams().set('q', query) : new HttpParams();
    return this.http.get<Book[]>(`${this.baseUrl}/books`, { params });
  }

  getBookById(id: string): Observable<Book> {
    return this.http.get<Book>(`${this.baseUrl}/books/${id}`);
  }

  createBook(book: Book): Observable<Book> {        
    return this.http.post<Book>(`${this.baseUrl}/books`, book);
  }

  getCategories(): Observable<Category[]> {    
     const d= this.http.get<Category[]>(`${this.baseUrl}/categories`);
    return d;
  }

  getSubjects(): Observable<Category[]> {    
     const d= this.http.get<Subject[]>(`${this.baseUrl}/subjects`);
    return d;
  }

  getPublishers(): Observable<Category[]> {    
     const d= this.http.get<Category[]>(`${this.baseUrl}/publishers`);
    return d;
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
}
