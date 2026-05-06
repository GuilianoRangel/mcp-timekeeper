import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);

  getUsers(includeInactive = false) {
    return this.http.get<User[]>(`/api/users?includeInactive=${includeInactive}`);
  }

  createUser(userData: Partial<User>) {
    return this.http.post<User>('/api/users', userData);
  }

  deleteUser(id: string) {
    return this.http.delete<{ success: boolean }>(`/api/users/${id}`);
  }
}
