import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, map } from 'rxjs';
import { ActiveTask, TimeEntry } from '../models';

@Injectable({
  providedIn: 'root'
})
export class TimeService {
  activeTask = signal<ActiveTask | null>(null);

  constructor(private http: HttpClient) {}

  getActiveTask() {
    return this.http.get<{ active: ActiveTask | null }>('/api/time/active').pipe(
      map(res => res.active),
      tap(task => this.activeTask.set(task))
    );
  }

  startTask(projectId: string, taskId: string, note?: string) {
    return this.http.post<TimeEntry>('/api/time/start', { projectId, taskId, note }).pipe(
      tap(() => this.getActiveTask().subscribe())
    );
  }

  stopTask(note?: string) {
    return this.http.post<{ success: boolean }>('/api/time/stop', { note }).pipe(
      tap(() => this.activeTask.set(null))
    );
  }

  logManualDuration(projectId: string, taskId: string, durationSeconds: number, note?: string) {
    return this.http.post<TimeEntry>('/api/time/manual-duration', { projectId, taskId, durationSeconds, note });
  }

  logManualRange(projectId: string, taskId: string, startedAt: string, endedAt: string, note?: string) {
    return this.http.post<TimeEntry>('/api/time/manual-range', { projectId, taskId, startedAt, endedAt, note });
  }

  getRecentEntries(from?: string, to?: string) {
    const params: any = {};
    if (from) params.from = from;
    if (to) params.to = to;
    return this.http.get<TimeEntry[]>('/api/time/entries', { params });
  }
}
