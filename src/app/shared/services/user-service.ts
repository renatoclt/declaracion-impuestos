import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../Interfaces/user.interface';
import { environment } from '@/app/pages/environment/environment';
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;
  constructor(private http: HttpClient){}
  getUser():Observable<User[]>{
    return this.http.get<User[]>(this.apiUrl);
  }

   getUserById(id:number):Observable<User>{
      return this.http.get<User>(`${this.apiUrl}/${id}`);
    }

    addUser(user: User):Observable<User>{
        return this.http.post<User>(this.apiUrl,user)
    }

    updateUser(user: User):Observable<User>{
      return this.http.put<User>(`${this.apiUrl}/${user.id}`, user);
    }

    deleteUser(id:number):Observable<any>{
      return  this.http.delete(`${this.apiUrl}/${id}`);
    }
  
}