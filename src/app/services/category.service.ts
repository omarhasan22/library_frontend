import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
   providedIn: 'root'
})
export class CategoryService {
   private apiUrl = `${environment.apiUrl}/categories`;

   constructor(private http: HttpClient) { }

   // Get all categories
   getCategories(): Observable<any[]> {
      return this.http.get<any[]>(this.apiUrl);
   }

   // Get categories with book count
   getCategoriesWithCount(): Observable<any[]> {
      return this.http.get<any[]>(`${this.apiUrl}`);
   }

   // Get category by ID
   getCategoryById(id: string): Observable<any> {
      return this.http.get<any>(`${this.apiUrl}/${id}`);
   }

   // Create new category
   createCategory(category: any): Observable<any> {
      return this.http.post<any>(this.apiUrl, category);
   }

   // Update category
   updateCategory(id: string, category: any): Observable<any> {
      return this.http.put<any>(`${this.apiUrl}/${id}`, category);
   }

   // Delete category
   deleteCategory(id: string): Observable<any> {
      return this.http.delete(`${this.apiUrl}/${id}`);
   }
}