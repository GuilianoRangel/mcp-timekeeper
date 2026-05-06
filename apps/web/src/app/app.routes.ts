import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { 
    path: 'login', 
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: '', 
    loadComponent: () => import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'tracking', loadComponent: () => import('./features/time-tracking/time-tracking.component').then(m => m.TimeTrackingComponent) },
      { path: 'reports', loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent) },
      { path: 'projects', loadComponent: () => import('./features/projects/projects.component').then(m => m.ProjectsComponent) },
      { path: 'tasks', loadComponent: () => import('./features/tasks/tasks.component').then(m => m.TasksComponent) },
      { 
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          { path: 'audit', loadComponent: () => import('./features/admin/audit-log/audit-log.component').then(m => m.AuditLogComponent) },
          { path: 'users', loadComponent: () => import('./features/admin/users/users.component').then(m => m.UsersComponent) }
        ]
      },
      { 
        path: 'settings',
        children: [
          { path: 'api-keys', loadComponent: () => import('./features/settings/api-keys/api-keys.component').then(m => m.ApiKeysComponent) }
        ]
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
