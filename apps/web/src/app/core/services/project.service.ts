import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Project, Task } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  constructor(private http: HttpClient) {}

  getProjects(includeInactive = false) {
    return this.http.get<Project[]>(`/api/projects?includeInactive=${includeInactive}`);
  }

  createProject(name: string, description?: string) {
    return this.http.post<Project>('/api/projects', { name, description });
  }

  updateProject(id: string, projectData: Partial<Project>) {
    return this.http.put<Project>(`/api/projects/${id}`, projectData);
  }

  getTasks(projectId?: string, includeInactive = false) {
    let url = projectId ? `/api/tasks?projectId=${projectId}` : '/api/tasks?';
    url += `&includeInactive=${includeInactive}`;
    return this.http.get<Task[]>(url);
  }

  createTask(projectId: string, name: string) {
    return this.http.post<Task>('/api/tasks', { projectId, name });
  }

  updateTask(id: string, taskData: Partial<Task>) {
    return this.http.put<Task>(`/api/tasks/${id}`, taskData);
  }
}
