import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, UserPlus, Mail, Shield, Check, X, Trash2, Eye, EyeOff, AlertCircle, Edit2, Target } from 'lucide-angular';
import { ToastService } from '../../../core/services/toast.service';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">Usuários</h2>
          <p class="text-slate-500">Gestão de acesso ao sistema (Apenas Admin)</p>
        </div>
        <button (click)="openCreate()" class="btn-primary px-6 py-2 flex items-center gap-2">
          <lucide-icon [name]="UserPlusIcon" size="20"></lucide-icon>
          Novo Usuário
        </button>
      </div>

      <!-- Filter Toggle -->
      <div class="flex justify-end">
        <button 
          (click)="toggleShowInactive()" 
          class="text-sm font-medium flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-primary-200 hover:bg-primary-50/50 transition-all"
          [class.text-primary-600]="showInactive()"
          [class.bg-primary-50]="showInactive()"
        >
          <lucide-icon [name]="showInactive() ? EyeIcon : EyeOffIcon" size="16"></lucide-icon>
          {{ showInactive() ? 'Ocultar Inativos' : 'Ver Inativos' }}
        </button>
      </div>

      <!-- Form Card -->
      <div *ngIf="showForm" class="card p-6 border-primary-100 bg-primary-50/10 animate-slide-in shadow-lg">
        <h3 class="text-lg font-bold text-slate-800 mb-4">{{ editingId ? 'Editar Usuário' : 'Novo Usuário' }}</h3>
        <form (ngSubmit)="saveUser()" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Nome Completo</label>
            <input type="text" [(ngModel)]="model.name" name="name" required class="input" placeholder="João Silva">
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">E-mail</label>
            <input type="email" [(ngModel)]="model.email" name="email" required [disabled]="!!editingId" class="input disabled:bg-slate-50 disabled:text-slate-400" placeholder="joao@exemplo.com">
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Senha {{ editingId ? '(Deixe em branco para manter)' : '' }}</label>
            <input type="password" [(ngModel)]="model.password" name="password" [required]="!editingId" class="input" placeholder="••••••••">
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Perfil (Role)</label>
            <select [(ngModel)]="model.role" name="role" class="input">
              <option value="user">Usuário Comum</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Meta Semanal (Horas)</label>
            <div class="relative">
               <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <lucide-icon [name]="TargetIcon" size="16"></lucide-icon>
               </div>
               <input type="number" [(ngModel)]="weeklyGoalHours" name="goal" required min="1" class="input !pl-10" placeholder="10">
            </div>
          </div>
          
          <div class="md:col-span-2 lg:col-span-1 flex justify-end items-end gap-3 pb-1">
            <button type="button" (click)="cancel()" class="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" class="btn-primary px-6 py-2">
              {{ editingId ? 'Salvar Alterações' : 'Criar Usuário' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Users List -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let u of users()" class="card p-6 group hover:border-primary-200 transition-all flex flex-col justify-between">
          <div>
            <div class="flex items-start gap-4 mb-4">
              <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xl font-bold uppercase shrink-0">
                {{ u.name.substring(0, 1) }}
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-bold text-slate-800 truncate">{{ u.name }}</h4>
                <p class="text-sm text-slate-500 flex items-center gap-1">
                  <lucide-icon [name]="MailIcon" size="14"></lucide-icon>
                  {{ u.email }}
                </p>
              </div>
              <div class="flex gap-1 shrink-0">
                <button 
                  (click)="openEdit(u)" 
                  class="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                  title="Editar Usuário"
                >
                  <lucide-icon [name]="EditIcon" size="18"></lucide-icon>
                </button>
                <button 
                  *ngIf="u.isActive"
                  (click)="requestDelete(u)" 
                  class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                  title="Excluir Usuário"
                >
                  <lucide-icon [name]="Trash2Icon" size="18"></lucide-icon>
                </button>
              </div>
            </div>
            
            <div class="flex items-center gap-4 mb-4 p-3 bg-slate-50 rounded-xl">
               <div class="p-2 rounded-lg bg-white text-primary-600 shadow-sm">
                  <lucide-icon [name]="TargetIcon" size="18"></lucide-icon>
               </div>
               <div>
                  <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Meta Semanal</p>
                  <p class="text-sm font-bold text-slate-700">{{ (u.weeklyGoalSeconds || 36000) / 3600 }}h</p>
               </div>
            </div>
          </div>

          <div class="flex items-center justify-between pt-4 border-t border-slate-50">
            <span [class]="'inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase ' + (u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700')">
              <lucide-icon [name]="ShieldIcon" size="10"></lucide-icon>
              {{ u.role }}
            </span>
            <span class="text-[10px] text-slate-400">ID: {{ u.id.substring(0, 8) }}...</span>
            <span *ngIf="!u.isActive" class="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-bold uppercase">Inativo</span>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div *ngIf="userToDelete" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div class="card max-w-md w-full p-6 shadow-2xl animate-zoom-in">
          <div class="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4 mx-auto">
            <lucide-icon [name]="AlertCircleIcon" size="24"></lucide-icon>
          </div>
          <h3 class="text-xl font-bold text-slate-900 text-center mb-2">Excluir Usuário?</h3>
          <p class="text-slate-500 text-center mb-6">
            Tem certeza que deseja desativar o usuário <strong>"{{ userToDelete.name }}"</strong>? 
            Ele não poderá mais acessar o sistema.
          </p>
          <div class="flex flex-col gap-3">
            <button 
              (click)="confirmDelete()" 
              class="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-600/20"
            >
              Sim, Excluir Usuário
            </button>
            <button 
              (click)="userToDelete = null" 
              class="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);
  private toastService = inject(ToastService);
  
  users = signal<User[]>([]);
  showForm = false;
  editingId: string | null = null;
  weeklyGoalHours = 10;
  
  model: Partial<User> = {
    name: '',
    email: '',
    password: '',
    role: 'user'
  };

  readonly UserPlusIcon = UserPlus;
  readonly MailIcon = Mail;
  readonly ShieldIcon = Shield;
  readonly CheckIcon = Check;
  readonly XIcon = X;
  readonly Trash2Icon = Trash2;
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;
  readonly AlertCircleIcon = AlertCircle;
  readonly EditIcon = Edit2;
  readonly TargetIcon = Target;

  showInactive = signal(false);
  userToDelete: User | null = null;

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getUsers(this.showInactive()).subscribe(res => this.users.set(res));
  }

  toggleShowInactive() {
    this.showInactive.set(!this.showInactive());
    this.loadUsers();
  }

  openCreate() {
    this.cancel();
    this.showForm = true;
  }

  openEdit(user: User) {
    this.editingId = user.id;
    this.model = {
      name: user.name,
      email: user.email,
      role: user.role,
      password: ''
    };
    this.weeklyGoalHours = (user.weeklyGoalSeconds || 36000) / 3600;
    this.showForm = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  saveUser() {
    if (!this.model.name || !this.model.role) return;
    
    const payload = {
      ...this.model,
      weeklyGoalSeconds: this.weeklyGoalHours * 3600
    };

    if (this.editingId) {
      // Remover senha se estiver vazia no update
      if (!payload.password) delete payload.password;
      delete payload.email; // Não permite trocar e-mail

      this.userService.updateUser(this.editingId, payload).subscribe({
        next: () => {
          this.toastService.success('Usuário atualizado com sucesso!');
          this.cancel();
          this.loadUsers();
        },
        error: (err) => this.toastService.error(err?.error?.message || 'Erro ao atualizar usuário.')
      });
    } else {
      if (!this.model.email || !this.model.password) {
        this.toastService.warning('Preencha todos os campos obrigatórios.');
        return;
      }
      this.userService.createUser(payload).subscribe({
        next: () => {
          this.toastService.success('Usuário criado com sucesso!');
          this.cancel();
          this.loadUsers();
        },
        error: (err) => this.toastService.error(err?.error?.message || 'Erro ao criar usuário.')
      });
    }
  }

  requestDelete(user: User) {
    this.userToDelete = user;
  }

  confirmDelete() {
    if (!this.userToDelete) return;
    this.userService.deleteUser(this.userToDelete.id).subscribe({
      next: () => {
        this.toastService.success('Usuário excluído com sucesso.');
        this.userToDelete = null;
        this.loadUsers();
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Erro ao excluir usuário.');
        this.userToDelete = null;
      }
    });
  }

  cancel() {
    this.showForm = false;
    this.editingId = null;
    this.weeklyGoalHours = 10;
    this.model = { name: '', email: '', password: '', role: 'user' };
  }
}
