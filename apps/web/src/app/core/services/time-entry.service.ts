import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TimeEntry } from '../models';

@Injectable({
  providedIn: 'root'
})
export class TimeEntryService {
  private http = inject(HttpClient);

  updateEntry(id: string, data: {
    projectId: string;
    taskId: string;
    startedAt?: string;
    endedAt?: string;
    durationSeconds?: number;
    note?: string;
  }) {
    return this.http.put<{ success: boolean; entry: TimeEntry }>(`/api/time/entries/${id}`, data);
  }

  deleteEntry(id: string) {
    return this.http.delete<{ success: boolean }>(`/api/time/entries/${id}`);
  }
}
