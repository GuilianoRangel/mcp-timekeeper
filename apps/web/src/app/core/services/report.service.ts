import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';

// Shape returned by the API
interface ApiProjectTotals {
  projectId: string;
  totalSeconds: number;
}
interface ApiTaskTotals {
  taskId: string;
  projectId: string;
  totalSeconds: number;
}
interface ApiProjectReport {
  filter: any;
  weekly: any[];
  totals: ApiProjectTotals[];
  grandTotalSeconds: number;
}
interface ApiTaskReport {
  filter: any;
  weekly: any[];
  totals: ApiTaskTotals[];
  grandTotalSeconds: number;
}

// Shape expected by the Reports component
export interface ProjectReport {
  projectId: string;
  projectName: string;
  totalDurationSeconds: number;
}
export interface TaskReport {
  taskId: string;
  taskName: string;
  projectId: string;
  projectName: string;
  totalDurationSeconds: number;
}
export interface WeeklyBreakdown {
  week: string;
  totalSeconds: number;
  label?: string;
}
export interface FullProjectReport {
  totals: ProjectReport[];
  weekly: (ApiProjectTotals & { week: string })[];
  grandTotalSeconds: number;
}
export interface FullTaskReport {
  totals: TaskReport[];
  weekly: (ApiTaskTotals & { week: string })[];
  grandTotalSeconds: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);
  
  // We need projects/tasks to resolve names — pass them in or load separately
  getProjectReport(from: string, to: string, projectNames: Map<string, string> = new Map()) {
    return this.http.get<ApiProjectReport>('/api/reports/projects', { params: { from, to } }).pipe(
      map(res => ({
        totals: res.totals.map(t => ({
          projectId: t.projectId,
          projectName: projectNames.get(t.projectId) || t.projectId,
          totalDurationSeconds: t.totalSeconds ?? 0
        })),
        weekly: res.weekly,
        grandTotalSeconds: res.grandTotalSeconds
      } as FullProjectReport))
    );
  }

  getTaskReport(from: string, to: string, taskNames: Map<string, string> = new Map(), projectNames: Map<string, string> = new Map()) {
    return this.http.get<ApiTaskReport>('/api/reports/tasks', { params: { from, to } }).pipe(
      map(res => ({
        totals: res.totals.map(t => ({
          taskId: t.taskId,
          taskName: taskNames.get(t.taskId) || t.taskId,
          projectId: t.projectId,
          projectName: projectNames.get(t.projectId) || t.projectId,
          totalDurationSeconds: t.totalSeconds ?? 0
        })),
        weekly: res.weekly,
        grandTotalSeconds: res.grandTotalSeconds
      } as FullTaskReport))
    );
  }
}
