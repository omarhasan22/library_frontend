import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Book } from '../models/book.model';
import { ApiArgs } from '../books/book-query';
import { environment } from '../../environments/environment';

export interface LocationSummary {
  rooms: { room: string; count: number; walls: { wall: string; count: number }[] }[];
  unassigned: number;
}

export interface BookPage {
  books: Book[];
  totalBooks: number;
  filteredCount: number;
  uniqueAuthors: number;
  uniquePublishers: number;
}

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  // ============== BOOK ROUTES ==============

  // Get all books matching your backend implementation
  getAllBooks(
    query: string = '',
    searchTerm: string = '',
    page: number = 1,
    limit: number = 20,
    sortField: string = '',
    sortDirection: 'asc' | 'desc' = 'asc'
  ): Observable<{
    books: Book[];
    totalBooks: number;
    filteredCount: number;
    uniqueAuthors: number;
    uniquePublishers: number;
  }> {
    let params = new HttpParams();

    // Add all parameters that your backend expects
    params = params.set('query', query);
    params = params.set('searchTerm', searchTerm);
    params = params.set('page', page.toString());
    params = params.set('limit', limit.toString());

    // The API sorts by shelf location (direction only) or by recency; sortField is not used by it.
    params = params.set('sortDirection', sortDirection);
    if (sortField === 'recent') {
      params = params.set('sort', 'recent');
    }

    return this.http.get<any>(`${this.apiUrl}/books`, { params });
  }

  /** The book list: state from book-query.ts (toApiArgs) plus paging. */
  getBooks(args: ApiArgs, page: number, limit: number): Observable<BookPage> {
    return this.getAllBooks(args.query, args.searchTerm, page, limit, args.sort, args.sortDirection);
  }

  // Search books with simple query
  searchBooks(searchTerm: string, field: string = 'all'): Observable<any> {
    // For simple search, pass the field as query and the search term
    return this.getAllBooks(field, searchTerm, 1, 20);
  }

  // Advanced search with multiple filters
  advancedSearch(filters: Array<{ field: string, value: string }>, page: number = 1, limit: number = 20): Observable<any> {
    // Convert filters to JSON string as expected by backend
    const searchTerm = JSON.stringify(filters);
    return this.getAllBooks('advanced', searchTerm, page, limit);
  }

  // Get book by ID
  getBookById(id: string): Observable<Book> {
    return this.http.get<Book>(`${this.apiUrl}/books/${id}`);
  }

  // Create new book
  createBook(book: any): Observable<Book> {
    // const bookData = this.prepareBookData(book);
    return this.http.post<Book>(`${this.apiUrl}/books`, book);
  }

  // Update book
  updateBook(id: string, book: any): Observable<Book> {
    // const bookData = this.prepareBookData(book);
    return this.http.put<Book>(`${this.apiUrl}/books/${id}`, book);
  }

  // Delete book
  deleteBook(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/books/${id}`);
  }

  // // Helper method to prepare book data for API
  // private prepareBookData(book: any): any {
  //   const bookData: any = { ...book };

  //   // Process people arrays - send only IDs or objects for new creation
  //   ['authors', 'commentators', 'editors', 'caretakers', 'muhashis'].forEach(field => {
  //     if (bookData[field] && Array.isArray(bookData[field])) {
  //       bookData[field] = bookData[field].map((item: any) => {
  //         // If it has an _id, send just the ID
  //         if (item._id) return item._id;
  //         // If it's a string (new name), send as object
  //         if (typeof item === 'string') return { name: item };
  //         // Otherwise send as is
  //         return item;
  //       });
  //     }
  //   });

  //   // Process publishers - similar logic
  //   if (bookData.publishers && Array.isArray(bookData.publishers)) {
  //     bookData.publishers = bookData.publishers.map((item: any) => {
  //       if (item._id) return item._id;
  //       if (typeof item === 'string') return { title: item };
  //       return item;
  //     });
  //   }

  //   // Process category - send ID or object for new
  //   if (bookData.category) {
  //     if (bookData.category._id) {
  //       bookData.category = bookData.category._id;
  //     } else if (typeof bookData.category === 'string') {
  //       bookData.category = { title: bookData.category };
  //     }
  //   }

  //   // Process subject - same as category
  //   if (bookData.subject) {
  //     if (bookData.subject._id) {
  //       bookData.subject = bookData.subject._id;
  //     } else if (typeof bookData.subject === 'string') {
  //       bookData.subject = { title: bookData.subject };
  //     }
  //   }

  //   return bookData;
  // }

  // Newest additions first (GET /books?sort=recent)
  getRecentBooks(limit: number = 8): Observable<Book[]> {
    return this.getAllBooks('', '', 1, limit, 'recent', 'desc').pipe(
      map(response => response.books)
    );
  }

  // Get statistics from the dedicated statistics endpoint
  getStatistics(): Observable<{
    totalBooks: number;
    totalAuthors: number;
    totalPublishers: number;
  }> {
    return this.http.get<any>(`${this.apiUrl}/books/statistics`).pipe(
      map(response => ({
        totalBooks: response.totalBooks || 0,
        totalAuthors: response.totalAuthors || response.uniqueAuthors || 0,
        totalPublishers: response.totalPublishers || response.uniquePublishers || 0
      }))
    );
  }

  // ============== CATEGORY ROUTES ==============

  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/categories`);
  }

  getCategoryById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/categories/${id}`);
  }

  createCategory(category: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/categories`, category);
  }

  // ============== SUBJECT ROUTES ==============

  getSubjects(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/subjects`);
  }

  createSubject(subject: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/subjects`, subject);
  }

  // ============== PUBLISHER ROUTES ==============

  getPublishers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/publishers`);
  }

  createPublisher(publisher: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/publishers`, publisher);
  }

  // ============== PEOPLE ROUTES ==============

  getPeople(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/people`);
  }

  createPerson(person: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/people`, person);
  }

  // Get people by type (filter on frontend)
  getPeopleByType(type: string): Observable<any[]> {
    return this.getPeople().pipe(
      map(people => people.filter(p => p.type === type))
    );
  }

  // Export books to Excel
  exportBooksToExcel(
    query: string = '',
    searchTerm: string = '',
    sortDirection: 'asc' | 'desc' = 'asc'
  ): Observable<Blob> {
    const params = new HttpParams()
      .set('query', query)
      .set('searchTerm', searchTerm)
      .set('sortDirection', sortDirection);

    return this.http.post(`${this.apiUrl}/books/export`, null, {
      params,
      responseType: 'blob'
    });
  }

  // Get unique room numbers
  getUniqueRoomNumbers(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/books/rooms`);
  }

  // What a bulk update would change: { count, sample: first 20 books } (read-only)
  previewBulkUpdate(criteria: {
    roomNumber?: string; wallNumber?: string; shelfNumber: string; bookNumberFrom: number; bookNumberTo: number;
  }): Observable<{ count: number; sample: { _id: string; title: string; address: any; category?: string; subject?: string }[] }> {
    return this.http.post<any>(`${this.apiUrl}/books/bulk-update-preview`, criteria);
  }

  // Books per room and stand, for the home page library map (GET /books/locations)
  getLocationSummary(): Observable<LocationSummary> {
    return this.http.get<LocationSummary>(`${this.apiUrl}/books/locations`);
  }

  // Get unique wall numbers for a room
  getUniqueWallNumbers(roomNumber: string): Observable<string[]> {
    const params = new HttpParams().set('roomNumber', roomNumber);
    return this.http.get<string[]>(`${this.apiUrl}/books/walls`, { params });
  }

  // Export book locations to Excel
  exportBookLocationsToExcel(
    roomNumber: string,
    query: string = '',
    searchTerm: string = '',
    sortDirection: 'asc' | 'desc' = 'asc'
  ): Observable<Blob> {
    const params = new HttpParams()
      .set('roomNumber', roomNumber)
      .set('query', query)
      .set('searchTerm', searchTerm)
      .set('sortDirection', sortDirection);

    return this.http.post(`${this.apiUrl}/books/export-locations`, null, {
      params,
      responseType: 'blob'
    });
  }

  // Bulk update subjects
  bulkUpdateSubjects(criteria: {
    roomNumber?: string;
    wallNumber?: string;
    shelfNumber: string;
    bookNumberFrom: number;
    bookNumberTo: number;
    subjectId: string;
  }): Observable<{
    matchedCount: number;
    modifiedCount: number;
    subject: { _id: string; title: string };
    historyId: string;
    undoData: {
      updateId: string;
      books: Array<{ bookId: string; previousSubjectId: string | null }>;
      timestamp: Date;
    };
  }> {
    return this.http.post<{
      matchedCount: number;
      modifiedCount: number;
      subject: { _id: string; title: string };
      historyId: string;
      undoData: {
        updateId: string;
        books: Array<{ bookId: string; previousSubjectId: string | null }>;
        timestamp: Date;
      };
    }>(`${this.apiUrl}/books/bulk-update-subjects`, criteria);
  }

  bulkUpdateCategories(criteria: {
    roomNumber?: string;
    wallNumber?: string;
    shelfNumber: string;
    bookNumberFrom: number;
    bookNumberTo: number;
    categoryId: string;
  }): Observable<{
    matchedCount: number;
    modifiedCount: number;
    category: { _id: string; title: string };
    historyId: string;
    undoData: {
      updateId: string;
      books: Array<{ bookId: string; previousCategoryId: string | null }>;
      timestamp: Date;
    };
  }> {
    return this.http.post<{
      matchedCount: number;
      modifiedCount: number;
      category: { _id: string; title: string };
      historyId: string;
      undoData: {
        updateId: string;
        books: Array<{ bookId: string; previousCategoryId: string | null }>;
        timestamp: Date;
      };
    }>(`${this.apiUrl}/books/bulk-update-categories`, criteria);
  }

  // Undo bulk update subjects
  undoBulkUpdateSubjects(historyId: string): Observable<{
    success: boolean;
    restoredCount: number;
  }> {
    return this.http.post<{
      success: boolean;
      restoredCount: number;
    }>(`${this.apiUrl}/books/undo-bulk-update-subjects`, { historyId });
  }

  // Get bulk update history
  getBulkUpdateHistory(page: number = 1, limit: number = 10): Observable<{
    history: Array<{
      _id: string;
      updateId: string;
      updateType: 'subject' | 'category';
      userId: { username: string; email: string };
      criteria: {
        roomNumber?: string;
        wallNumber?: string;
        shelfNumber: string;
        bookNumberFrom: number;
        bookNumberTo: number;
      };
      oldSubject?: { _id: string | null; title: string | null };
      newSubject?: { _id: string; title: string };
      oldCategory?: { _id: string | null; title: string | null };
      newCategory?: { _id: string; title: string };
      affectedBooks: Array<{
        bookId: string;
        bookTitle: string;
        previousSubjectId?: string | null;
        previousCategoryId?: string | null;
      }>;
      status: 'active' | 'undone';
      createdAt: Date;
      undoneAt?: Date;
    }>;
    total: number;
    page: number;
    totalPages: number;
  }> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<{
      history: Array<{
        _id: string;
        updateId: string;
        updateType: 'subject' | 'category';
        userId: { username: string; email: string };
        criteria: {
          roomNumber?: string;
          wallNumber?: string;
          shelfNumber: string;
          bookNumberFrom: number;
          bookNumberTo: number;
        };
        oldSubject?: { _id: string | null; title: string | null };
        newSubject?: { _id: string; title: string };
        oldCategory?: { _id: string | null; title: string | null };
        newCategory?: { _id: string; title: string };
        affectedBooks: Array<{
          bookId: string;
          bookTitle: string;
          previousSubjectId?: string | null;
          previousCategoryId?: string | null;
        }>;
        status: 'active' | 'undone';
        createdAt: Date;
        undoneAt?: Date;
      }>;
      total: number;
      page: number;
      totalPages: number;
    }>(`${this.apiUrl}/books/bulk-update-history`, { params });
  }

  // Get history by ID
  getHistoryById(historyId: string): Observable<{
    _id: string;
    updateId: string;
    updateType: 'subject' | 'category';
    userId: { username: string; email: string };
    criteria: {
      roomNumber?: string;
      wallNumber?: string;
      shelfNumber: string;
      bookNumberFrom: number;
      bookNumberTo: number;
    };
    oldSubject?: { _id: string | null; title: string | null };
    newSubject?: { _id: string; title: string };
    oldCategory?: { _id: string | null; title: string | null };
    newCategory?: { _id: string; title: string };
    affectedBooks: Array<{
      bookId: string;
      bookTitle: string;
      previousSubjectId?: string | null;
      previousCategoryId?: string | null;
    }>;
    status: 'active' | 'undone';
    createdAt: Date;
    undoneAt?: Date;
  }> {
    return this.http.get<{
      _id: string;
      updateId: string;
      updateType: 'subject' | 'category';
      userId: { username: string; email: string };
      criteria: {
        roomNumber?: string;
        wallNumber?: string;
        shelfNumber: string;
        bookNumberFrom: number;
        bookNumberTo: number;
      };
      oldSubject?: { _id: string | null; title: string | null };
      newSubject?: { _id: string; title: string };
      oldCategory?: { _id: string | null; title: string | null };
      newCategory?: { _id: string; title: string };
      affectedBooks: Array<{
        bookId: string;
        bookTitle: string;
        previousSubjectId?: string | null;
        previousCategoryId?: string | null;
      }>;
      status: 'active' | 'undone';
      createdAt: Date;
      undoneAt?: Date;
    }>(`${this.apiUrl}/books/bulk-update-history/${historyId}`);
  }

}