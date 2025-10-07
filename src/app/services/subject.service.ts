import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Subject {
   _id?: string;
   title: string;
   normalizedTitle?: string;
}

export interface SubjectResponse {
   subjects: Subject[];
   totalPages: number;
   currentPage: number;
   total: number;
}

export interface SubjectStats {
   totalSubjects: number;
}

@Injectable({
   providedIn: 'root'
})
export class SubjectService {
   private baseUrl = environment.apiUrl;

   constructor(private http: HttpClient) { }

   // Get all subjects with pagination and search
   getAllSubjects(page: number = 1, limit: number = 10, search: string = ''): Observable<SubjectResponse> {
      let params = new HttpParams()
         .set('page', page.toString())
         .set('limit', limit.toString());

      if (search) {
         params = params.set('search', search);
      }

      return this.http.get<SubjectResponse>(`${this.baseUrl}/subjects`, { params });
   }

   // Get single subject
   getSubjectById(id: string): Observable<Subject> {
      return this.http.get<Subject>(`${this.baseUrl}/subjects/${id}`);
   }

   // Create new subject
   createSubject(subject: Partial<Subject>): Observable<Subject> {
      return this.http.post<Subject>(`${this.baseUrl}/subjects`, subject);
   }

   // Update subject
   updateSubject(id: string, subject: Partial<Subject>): Observable<Subject> {
      return this.http.put<Subject>(`${this.baseUrl}/subjects/${id}`, subject);
   }

   // Delete subject
   deleteSubject(id: string): Observable<{ message: string }> {
      return this.http.delete<{ message: string }>(`${this.baseUrl}/subjects/${id}`);
   }

   // Get subject statistics
   getSubjectStats(): Observable<SubjectStats> {
      return this.http.get<SubjectStats>(`${this.baseUrl}/subjects/stats`);
   }
}
