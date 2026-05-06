import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface AuditLog {
  id: string;
  actorId: string;
  actorType: string;
  action: string;
  entity: string;
  entityId: string;
  before: any;
  after: any;
  source: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  constructor(private http: HttpClient) {}

  getLogs(params: any = {}) {
    return this.http.get<AuditLog[]>('/api/audit', { params });
  }
}
