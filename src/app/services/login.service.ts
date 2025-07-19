import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private baseUrl = environment.apiUrl;

  constructor(private http:HttpClient) { }
  login(username:string,password:string):Observable<any>{
    return this.http.post(`${this.baseUrl}/auth/login`,{username,password})
  }
}
