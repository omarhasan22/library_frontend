import { Injectable } from '@angular/core';
import { HttpClient, HttpParams  } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Book } from '../models/book.model';
import { Category } from '../models/category.model';
import { Subject } from '../models/subject.model';

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private apiUrl = 'http://localhost:8000/books';  
  private api = 'http://localhost:8000';  

  constructor(private http: HttpClient) {}

  getAllBooks(query: string = ''): Observable<Book[]> {
    const params = query ? new HttpParams().set('q', query) : new HttpParams();
    return this.http.get<Book[]>(this.apiUrl, { params });
  }

  getBookById(id: string): Observable<Book> {
    return this.http.get<Book>(`${this.apiUrl}/${id}`);
  }

  createBook(book: Book): Observable<Book> {        
    return this.http.post<Book>(this.apiUrl, book);
  }

  getCategories(): Observable<Category[]> {    
     const d= this.http.get<Category[]>(`${this.api}/categories`);
    return d;
  }

  getSubjects(): Observable<Category[]> {    
     const d= this.http.get<Subject[]>(`${this.api}/subjects`);
    return d;
  }

  getPublishers(): Observable<Category[]> {    
     const d= this.http.get<Category[]>(`${this.api}/publishers`);
    return d;
  }

  updateBook(id: string, book: Partial<Book>): Observable<Book> {
    return this.http.put<Book>(`${this.apiUrl}/${id}`, book);
  }

  deleteBook(id: any): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getPeople(): Observable<any[]> {
  return this.http.get<any[]>(`${this.api}/people`); 
}
}
