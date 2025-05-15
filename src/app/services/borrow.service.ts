import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Borrow } from '../models/borrow.model';

@Injectable({
  providedIn: 'root'
})
export class BorrowService {
  private apiUrl = 'http://localhost:8000/borrows';

  constructor(private http: HttpClient) {}

borrowBook(book: string, startDate: string, endDate: string): Observable<any> {
  const payload = { book, startDate, endDate };
  return this.http.post(`${this.apiUrl}/borrow`, payload);
}

  returnBook(borrowId: string): Observable<Borrow> {
    return this.http.put<Borrow>(`${this.apiUrl}/return/${borrowId}`, {});
  }

  getBorrowedBooks(): Observable<Borrow[]> {
    return this.http.get<Borrow[]>(`${this.apiUrl}/borrowed`);
  }
}
