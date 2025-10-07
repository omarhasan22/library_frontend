import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Borrow } from '../models/borrow.model';
import { environment } from 'src/environments/environment';

export interface BorrowResponse {
  borrows: Borrow[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export interface BorrowStatistics {
  totalBorrows: number;
  activeBorrows: number;
  returnedBooks: number;
  overdueBooks: number;
}

@Injectable({
  providedIn: 'root'
})
export class BorrowService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

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

  // User methods
  getMyBorrows(status: string = 'all'): Observable<Borrow[]> {
    const params = new HttpParams().set('status', status);
    return this.http.get<Borrow[]>(`${this.baseUrl}/borrows/my-borrows`, { params });
  }

  // Admin methods
  getAllBorrows(page: number = 1, limit: number = 20, status: string = 'all'): Observable<BorrowResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('status', status);
    return this.http.get<BorrowResponse>(`${this.baseUrl}/borrows/all`, { params });
  }

  getUserBorrows(userId: string, status: string = 'all'): Observable<Borrow[]> {
    const params = new HttpParams().set('status', status);
    return this.http.get<Borrow[]>(`${this.baseUrl}/borrows/user/${userId}`, { params });
  }

  getOverdueBooks(): Observable<Borrow[]> {
    return this.http.get<Borrow[]>(`${this.baseUrl}/borrows/overdue`);
  }

  getBorrowStatistics(): Observable<BorrowStatistics> {
    return this.http.get<BorrowStatistics>(`${this.baseUrl}/borrows/statistics`);
  }

  sendDueDateReminders(): Observable<any> {
    return this.http.post(`${this.baseUrl}/borrows/send-reminders`, {});
  }

  sendOverdueNotifications(): Observable<any> {
    return this.http.post(`${this.baseUrl}/borrows/send-overdue-notifications`, {});
  }
}
