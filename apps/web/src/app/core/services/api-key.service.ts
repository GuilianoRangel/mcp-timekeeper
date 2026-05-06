import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApiKey {
  id: string;
  userId: string;
  label: string | null;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface CreatedApiKey extends ApiKey {
  rawKey: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiKeyService {
  private http = inject(HttpClient);
  private apiUrl = '/api/auth/api-keys';

  list(includeInactive = false): Observable<ApiKey[]> {
    return this.http.get<ApiKey[]>(`${this.apiUrl}?includeInactive=${includeInactive}`);
  }

  create(label?: string): Observable<CreatedApiKey> {
    return this.http.post<CreatedApiKey>(this.apiUrl, { label });
  }

  revoke(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${id}`);
  }
}
