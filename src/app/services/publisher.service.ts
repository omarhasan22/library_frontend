import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Publisher {
   _id?: string;
   title: string;
   normalizedTitle?: string;
}

export interface PublisherResponse {
   publishers: Publisher[];
   totalPages: number;
   currentPage: number;
   total: number;
}

export interface PublisherStats {
   totalPublishers: number;
}

@Injectable({
   providedIn: 'root'
})
export class PublisherService {
   private baseUrl = environment.apiUrl;

   constructor(private http: HttpClient) { }

   // Get all publishers with pagination and search
   getAllPublishers(page: number = 1, limit: number = 10, search: string = ''): Observable<PublisherResponse> {
      let params = new HttpParams()
         .set('page', page.toString())
         .set('limit', limit.toString());

      if (search) {
         params = params.set('search', search);
      }

      return this.http.get<PublisherResponse>(`${this.baseUrl}/publishers`, { params });
   }

   // Get single publisher
   getPublisherById(id: string): Observable<Publisher> {
      return this.http.get<Publisher>(`${this.baseUrl}/publishers/${id}`);
   }

   // Create new publisher
   createPublisher(publisher: Partial<Publisher>): Observable<Publisher> {
      return this.http.post<Publisher>(`${this.baseUrl}/publishers`, publisher);
   }

   // Update publisher
   updatePublisher(id: string, publisher: Partial<Publisher>): Observable<Publisher> {
      return this.http.put<Publisher>(`${this.baseUrl}/publishers/${id}`, publisher);
   }

   // Delete publisher
   deletePublisher(id: string): Observable<{ message: string }> {
      return this.http.delete<{ message: string }>(`${this.baseUrl}/publishers/${id}`);
   }

   // Get publisher statistics
   getPublisherStats(): Observable<PublisherStats> {
      return this.http.get<PublisherStats>(`${this.baseUrl}/publishers/stats`);
   }
}
