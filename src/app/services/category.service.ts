import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Subject {
   title: string;
   normalizedTitle?: string;
}

export interface Category {
   _id?: string;
   title: string;
   normalizedTitle?: string;
   subjects?: Subject[];
}

export interface CategoryResponse {
   categories: Category[];
   totalPages: number;
   currentPage: number;
   total: number;
}

export interface CategoryStats {
   totalCategories: number;
}

@Injectable({
   providedIn: 'root'
})
export class CategoryService {
   private baseUrl = environment.apiUrl;

   constructor(private http: HttpClient) { }

   // Get all categories with pagination and search
   getAllCategories(page: number = 1, limit: number = 10, search: string = ''): Observable<CategoryResponse> {
      let params = new HttpParams()
         .set('page', page.toString())
         .set('limit', limit.toString());

      if (search) {
         params = params.set('search', search);
      }

      return this.http.get<CategoryResponse>(`${this.baseUrl}/categories`, { params });
   }

   // Get single category
   getCategoryById(id: string): Observable<Category> {
      return this.http.get<Category>(`${this.baseUrl}/categories/${id}`);
   }

   // Create new category
   createCategory(category: Partial<Category>): Observable<Category> {
      return this.http.post<Category>(`${this.baseUrl}/categories`, category);
   }

   // Update category
   updateCategory(id: string, category: Partial<Category>): Observable<Category> {
      return this.http.put<Category>(`${this.baseUrl}/categories/${id}`, category);
   }

   // Delete category
   deleteCategory(id: string): Observable<{ message: string }> {
      return this.http.delete<{ message: string }>(`${this.baseUrl}/categories/${id}`);
   }

   // Get category statistics
   getCategoryStats(): Observable<CategoryStats> {
      return this.http.get<CategoryStats>(`${this.baseUrl}/categories/stats`);
   }
}