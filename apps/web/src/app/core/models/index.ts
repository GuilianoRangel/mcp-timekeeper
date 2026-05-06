export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  password?: string;
  isActive?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  isActive?: boolean;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  userId: string;
  projectId: string;
  taskId: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  note?: string;
  source: 'web' | 'api' | 'mcp';
  project?: Project;
  task?: Task;
}

export interface ActiveTask extends TimeEntry {
  elapsedSeconds: number;
  projectName?: string;
  taskName?: string;
}
