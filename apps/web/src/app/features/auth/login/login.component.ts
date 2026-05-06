import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Clock, Lock, Mail, Eye, EyeOff, Loader2 } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div class="w-full max-w-md">
        <!-- Logo & Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl text-white shadow-xl shadow-primary-200 mb-4 animate-bounce">
            <lucide-icon [name]="ClockIcon" size="32"></lucide-icon>
          </div>
          <h1 class="text-3xl font-bold text-slate-900 tracking-tight">TimeKeeper</h1>
          <p class="text-slate-500 mt-2">MCP-First Time Tracking</p>
        </div>

        <!-- Login Card -->
        <div class="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
          <form (ngSubmit)="login()" #loginForm="ngForm" class="space-y-6">
            <div>
              <label for="email" class="block text-sm font-semibold text-slate-700 mb-2">E-mail</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <lucide-icon [name]="MailIcon" size="18"></lucide-icon>
                </div>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  [(ngModel)]="email" 
                  required
                  email
                  autocomplete="email"
                  spellcheck="false"
                  class="input !pl-12" 
                  placeholder="admin@timekeeper.local"
                >
              </div>
            </div>

            <div>
              <label for="password" class="block text-sm font-semibold text-slate-700 mb-2">Senha</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <lucide-icon [name]="LockIcon" size="18"></lucide-icon>
                </div>
                <input 
                  [type]="showPassword() ? 'text' : 'password'" 
                  id="password" 
                  name="password" 
                  [(ngModel)]="password" 
                  required
                  autocomplete="current-password"
                  spellcheck="false"
                  class="input !pl-12 !pr-12" 
                  placeholder="••••••••"
                >
                <button 
                  type="button"
                  (click)="togglePassword()"
                  class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <lucide-icon [name]="showPassword() ? EyeOffIcon : EyeIcon" size="18"></lucide-icon>
                </button>
              </div>
            </div>

            <div *ngIf="error()" class="p-3 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 text-sm animate-shake">
              {{ error() }}
            </div>

            <button 
              type="submit" 
              [disabled]="loginForm.invalid || isLoading()"
              class="w-full btn-primary py-3 flex items-center justify-center gap-2"
            >
              <lucide-icon *ngIf="isLoading()" [name]="LoaderIcon" size="20" class="animate-spin"></lucide-icon>
              <span>{{ isLoading() ? 'Entrando...' : 'Entrar' }}</span>
            </button>
          </form>

          <div class="mt-8 pt-6 border-t border-slate-100 text-center text-sm text-slate-500">
            <p>Utilize as credenciais do seed para o primeiro acesso.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }
    .animate-shake {
      animation: shake 0.2s ease-in-out 0s 2;
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = 'admin@timekeeper.local';
  password = 'Admin@123456';
  
  isLoading = signal(false);
  error = signal<string | null>(null);
  showPassword = signal(false);

  readonly ClockIcon = Clock;
  readonly MailIcon = Mail;
  readonly LockIcon = Lock;
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;
  readonly LoaderIcon = Loader2;

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  async login() {
    this.isLoading.set(true);
    this.error.set(null);

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error(err);
        this.error.set('E-mail ou senha inválidos.');
        this.isLoading.set(false);
      }
    });
  }
}
