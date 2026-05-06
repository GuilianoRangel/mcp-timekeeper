import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { 
  LucideAngularModule, 
  LayoutDashboard, 
  Clock, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  User,
  ShieldCheck,
  Folder,
  List,
  Users,
  Key
} from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { ToastContainerComponent } from '../toast/toast-container.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterLink, 
    RouterLinkActive,
    LucideAngularModule,
    ToastContainerComponent
  ],
  template: `
    <div class="flex h-screen bg-slate-50 overflow-hidden">
      <!-- Global Toast Notifications -->
      <app-toast-container></app-toast-container>
      <!-- Mobile Sidebar Overlay -->
      <div 
        *ngIf="isMobileMenuOpen()" 
        class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
        (click)="toggleMobileMenu()"
      ></div>

      <!-- Sidebar -->
      <aside 
        class="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0"
        [class.-translate-x-full]="!isMobileMenuOpen()"
      >
        <div class="flex flex-col h-full">
          <!-- Logo -->
          <div class="p-6 flex items-center gap-3">
            <div class="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-200">
              <lucide-icon [name]="ClockIcon" size="24"></lucide-icon>
            </div>
            <span class="text-xl font-bold tracking-tight text-slate-800">TimeKeeper</span>
          </div>

          <!-- Navigation -->
          <nav class="flex-1 px-4 space-y-1 overflow-y-auto">
            <a 
              routerLink="/dashboard" 
              routerLinkActive="bg-primary-50 text-primary-600" 
              [routerLinkActiveOptions]="{exact: true}"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors group"
            >
              <lucide-icon [name]="DashboardIcon" size="20" class="group-hover:text-primary-500"></lucide-icon>
              <span class="font-medium">Dashboard</span>
            </a>
            <a 
              routerLink="/tracking" 
              routerLinkActive="bg-primary-50 text-primary-600"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors group"
            >
              <lucide-icon [name]="TimeIcon" size="20" class="group-hover:text-primary-500"></lucide-icon>
              <span class="font-medium">Apontamentos</span>
            </a>
            <a 
              routerLink="/reports" 
              routerLinkActive="bg-primary-50 text-primary-600"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors group"
            >
              <lucide-icon [name]="ReportIcon" size="20" class="group-hover:text-primary-500"></lucide-icon>
              <span class="font-medium">Relatórios</span>
            </a>

            <div class="pt-4 pb-2">
              <p class="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Gestão</p>
            </div>

            <a 
              routerLink="/projects" 
              routerLinkActive="bg-primary-50 text-primary-600"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors group"
            >
              <lucide-icon [name]="FolderIcon" size="20" class="group-hover:text-primary-500"></lucide-icon>
              <span class="font-medium">Projetos</span>
            </a>
            <a 
              routerLink="/tasks" 
              routerLinkActive="bg-primary-50 text-primary-600"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors group"
            >
              <lucide-icon [name]="TasksIcon" size="20" class="group-hover:text-primary-500"></lucide-icon>
              <span class="font-medium">Tarefas</span>
            </a>

            <div class="pt-4 pb-2">
              <p class="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Acesso</p>
            </div>

            <a 
              routerLink="/settings/api-keys" 
              routerLinkActive="bg-primary-50 text-primary-600"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors group"
            >
              <lucide-icon [name]="KeyIcon" size="20" class="group-hover:text-primary-500"></lucide-icon>
              <span class="font-medium">Chaves de API</span>
            </a>
            
            <div *ngIf="isAdmin()" class="pt-4 pb-2">
              <p class="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin</p>
            </div>
            
            <a 
              *ngIf="isAdmin()"
              routerLink="/admin/users" 
              routerLinkActive="bg-primary-50 text-primary-600"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors group"
            >
              <lucide-icon [name]="UsersIcon" size="20" class="group-hover:text-primary-500"></lucide-icon>
              <span class="font-medium">Usuários</span>
            </a>
            <a 
              *ngIf="isAdmin()"
              routerLink="/admin/audit" 
              routerLinkActive="bg-primary-50 text-primary-600"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors group"
            >
              <lucide-icon [name]="AuditIcon" size="20" class="group-hover:text-primary-500"></lucide-icon>
              <span class="font-medium">Auditoria</span>
            </a>
          </nav>

          <!-- User Profile & Logout -->
          <div class="p-4 border-t border-slate-100">
            <div class="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-50 mb-3">
              <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                {{ firstName().substring(0, 1) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-slate-800 truncate">{{ userName() }}</p>
                <p class="text-xs text-slate-500 truncate">{{ userEmail() }}</p>
              </div>
            </div>
            <button 
              (click)="logout()"
              class="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <lucide-icon [name]="LogoutIcon" size="20"></lucide-icon>
              <span class="font-medium">Sair</span>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <!-- Topbar -->
        <header class="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 lg:px-8 shadow-sm z-30">
          <button 
            (click)="toggleMobileMenu()" 
            class="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-lg lg:hidden"
          >
            <lucide-icon [name]="MenuIcon" size="24"></lucide-icon>
          </button>
          
          <div class="flex-1 px-4 lg:px-0">
            <h1 class="text-lg font-semibold text-slate-800 hidden sm:block">
              {{ isAdmin() ? '🛡️ Administrador' : '👋 Bem-vindo' }}, {{ firstName() }}!
            </h1>
          </div>
        </header>

        <!-- Page Content -->
        <div class="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50/50">
          <div class="max-w-7xl mx-auto animate-fade-in">
            <router-outlet></router-outlet>
          </div>
        </div>
      </main>
    </div>
  `
})
export class LayoutComponent {
  private authService = inject(AuthService);
  
  isMobileMenuOpen = signal(false);

  readonly ClockIcon = Clock;
  readonly DashboardIcon = LayoutDashboard;
  readonly TimeIcon = Clock;
  readonly ReportIcon = FileText;
  readonly SettingsIcon = Settings;
  readonly LogoutIcon = LogOut;
  readonly MenuIcon = Menu;
  readonly XIcon = X;
  readonly UserIcon = User;
  readonly AuditIcon = ShieldCheck;
  readonly FolderIcon = Folder;
  readonly TasksIcon = List;
  readonly UsersIcon = Users;
  readonly KeyIcon = Key;

  userName = () => this.authService.user()?.name || 'Usuário';
  userEmail = () => this.authService.user()?.email || '';
  firstName = () => this.userName().split(' ')[0];
  isAdmin = () => this.authService.isAdmin();

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }

  logout() {
    this.authService.logout();
  }
}
