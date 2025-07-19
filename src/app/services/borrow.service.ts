import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Borrow } from '../models/borrow.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BorrowService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

borrowBook(book: string, startDate: string, endDate: string): Observable<any> {
  const payload = { book, startDate, endDate };
  return this.http.post(`${this.baseUrl}/borrows/borrow`, payload);
}

  returnBook(borrowId: string): Observable<Borrow> {
    return this.http.put<Borrow>(`${this.baseUrl}/borrows/return/${borrowId}`, {});
  }

  getBorrowedBooks(): Observable<Borrow[]> {
    return this.http.get<Borrow[]>(`${this.baseUrl}/borrows/borrowed`);
  }
}
