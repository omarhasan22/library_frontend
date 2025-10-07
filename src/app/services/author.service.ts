import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Author {
   _id?: string;
   name: string;
   normalizedName?: string;
   dateOfBirth?: Date;
   dateOfDeath?: Date;
   type: 'author' | 'editor' | 'caretaker' | 'publisher' | 'commentator' | 'muhashi';
}

export interface AuthorResponse {
   authors: Author[];
   totalPages: number;
   currentPage: number;
   total: number;
}

export interface AuthorStats {
   totalAuthors: number;
   authorsByType: Array<{ _id: string; count: number }>;
}

@Injectable({
   providedIn: 'root'
})
export class AuthorService {
   private baseUrl = environment.apiUrl;

   constructor(private http: HttpClient) { }

   // Get all authors with pagination and search
   getAllAuthors(page: number = 1, limit: number = 10, search: string = '', type: string = ''): Observable<AuthorResponse> {
      let params = new HttpParams()
         .set('page', page.toString())
         .set('limit', limit.toString());

      if (search) {
         params = params.set('search', search);
      }

      if (type) {
         params = params.set('type', type);
      }

      return this.http.get<AuthorResponse>(`${this.baseUrl}/authors`, { params });
   }

   // Get single author
   getAuthorById(id: string): Observable<Author> {
      return this.http.get<Author>(`${this.baseUrl}/authors/${id}`);
   }

   // Create new author
   createAuthor(author: Partial<Author>): Observable<Author> {
      return this.http.post<Author>(`${this.baseUrl}/authors`, author);
   }

   // Update author
   updateAuthor(id: string, author: Partial<Author>): Observable<Author> {
      return this.http.put<Author>(`${this.baseUrl}/authors/${id}`, author);
   }

   // Delete author
   deleteAuthor(id: string): Observable<{ message: string }> {
      return this.http.delete<{ message: string }>(`${this.baseUrl}/authors/${id}`);
   }

   // Get author statistics
   getAuthorStats(): Observable<AuthorStats> {
      return this.http.get<AuthorStats>(`${this.baseUrl}/authors/stats`);
   }
}
