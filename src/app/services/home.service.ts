import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private baseUrl = environment.apiUrl;

  constructor(private http:HttpClient) { 
    
  }

  accessHome():Observable<any>{
    return this.http.get(`${this.baseUrl}/home`);
  }
}
