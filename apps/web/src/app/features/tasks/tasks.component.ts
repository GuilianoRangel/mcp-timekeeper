import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, Pencil, Trash2, Check, X, List, Eye, EyeOff } from 'lucide-angular';
import { ProjectService } from '../../core/services/project.service';
import { ToastService } from '../../core/services/toast.service';
import { Project, Task } from '../../core/models';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">Tarefas</h2>
          <p class="text-slate-500">Gerencie as tarefas dos projetos</p>
        </div>
        <div class="flex gap-2">
          <select [(ngModel)]="filterProjectId" (change)="loadTasks()" class="input min-w-[200px]">
            <option value="">Todos os Projetos</option>
            <option *ngFor="let p of projects()" [value]="p.id">{{ p.name }}</option>
          </select>
          <button (click)="showForm = true" class="btn-primary px-6 py-2 flex items-center gap-2">
            <lucide-icon [name]="PlusIcon" size="20"></lucide-icon>
          Nova Tarefa
          </button>
        </div>
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
          {{ showInactive() ? 'Ocultar Inativas' : 'Ver Inativas' }}
        </button>
      </div>

      <!-- Form Card -->
      <div *ngIf="showForm" class="card p-6 border-primary-100 bg-primary-50/10 animate-slide-in">
        <h3 class="text-lg font-bold text-slate-800 mb-4">
          {{ editingId ? 'Editar Tarefa' : 'Nova Tarefa' }}
        </h3>
        <form (ngSubmit)="saveTask()" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Projeto</label>
            <select [(ngModel)]="model.projectId" name="projectId" required class="input" [disabled]="!!editingId">
              <option value="">Selecione um projeto</option>
              <option *ngFor="let p of projects()" [value]="p.id">{{ p.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Nome da Tarefa</label>
            <input type="text" [(ngModel)]="model.name" name="name" required class="input" placeholder="Ex: Desenvolvimento Frontend">
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-semibold text-slate-700 mb-1">Descrição</label>
            <textarea [(ngModel)]="model.description" name="description" rows="2" class="input" placeholder="Opcional"></textarea>
          </div>
          <div *ngIf="editingId" class="flex items-center gap-2">
            <input type="checkbox" [(ngModel)]="model.isActive" name="isActive" id="isActiveTask" class="w-4 h-4 text-primary-600 rounded">
            <label for="isActiveTask" class="text-sm font-medium text-slate-700">Ativo</label>
          </div>
          <div class="md:col-span-2 flex justify-end gap-3 mt-2">
            <button type="button" (click)="cancel()" class="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" class="btn-primary px-6 py-2">
              Salvar Tarefa
            </button>
          </div>
        </form>
      </div>

      <!-- Tasks List -->
      <div class="card overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 text-slate-600 text-sm uppercase tracking-wider font-bold">
              <th class="px-6 py-4">Tarefa</th>
              <th class="px-6 py-4">Projeto</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr *ngFor="let t of tasks()" class="hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4">
                <div class="font-bold text-slate-800">{{ t.name }}</div>
                <div class="text-xs text-slate-500 truncate max-w-xs">{{ t.description }}</div>
              </td>
              <td class="px-6 py-4 text-sm text-slate-600">
                {{ getProjectName(t.projectId) }}
              </td>
              <td class="px-6 py-4">
                <span [class]="'px-2 py-1 rounded-full text-[10px] font-bold uppercase ' + (t.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')">
                  {{ t.isActive ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <button (click)="edit(t)" class="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all">
                    <lucide-icon [name]="PencilIcon" size="16"></lucide-icon>
                  </button>
                  <button (click)="toggleActive(t)" class="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all">
                    <lucide-icon [name]="t.isActive ? Trash2Icon : CheckIcon" size="16"></lucide-icon>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="tasks().length === 0">
              <td colspan="4" class="px-6 py-12 text-center text-slate-400">
                Nenhuma tarefa encontrada.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class TasksComponent implements OnInit {
  private projectService = inject(ProjectService);
  private toastService = inject(ToastService);
  
  projects = signal<Project[]>([]);
  tasks = signal<Task[]>([]);
  showForm = false;
  editingId: string | null = null;
  filterProjectId = '';
  
  model: Partial<Task> = {
    projectId: '',
    name: '',
    description: '',
    isActive: true
  };

  readonly PlusIcon = Plus;
  readonly PencilIcon = Pencil;
  readonly Trash2Icon = Trash2;
  readonly CheckIcon = Check;
  readonly XIcon = X;
  readonly ListIcon = List;
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;
  
  showInactive = signal(false);

  ngOnInit() {
    this.loadProjects();
    this.loadTasks();
  }

  loadProjects() {
    this.projectService.getProjects().subscribe(res => this.projects.set(res));
  }

  loadTasks() {
    this.projectService.getTasks(this.filterProjectId || undefined, this.showInactive()).subscribe(res => this.tasks.set(res));
  }

  toggleShowInactive() {
    this.showInactive.set(!this.showInactive());
    this.loadTasks();
  }

  getProjectName(id: string) {
    return this.projects().find(p => p.id === id)?.name || id;
  }

  saveTask() {
    if (!this.model.name || !this.model.projectId) return;

    if (this.editingId) {
      this.projectService.updateTask(this.editingId, this.model).subscribe({
        next: () => { this.toastService.success('Tarefa atualizada com sucesso!'); this.cancel(); this.loadTasks(); },
        error: (e) => this.toastService.error(e?.error?.message || 'Erro ao atualizar tarefa.')
      });
    } else {
      this.projectService.createTask(this.model.projectId!, this.model.name!).subscribe({
        next: () => { this.toastService.success('Tarefa criada com sucesso!'); this.cancel(); this.loadTasks(); },
        error: (e) => this.toastService.error(e?.error?.message || 'Erro ao criar tarefa.')
      });
    }
  }

  edit(t: Task) {
    this.editingId = t.id;
    this.model = { ...t };
    this.showForm = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleActive(t: Task) {
    this.projectService.updateTask(t.id, { isActive: !t.isActive }).subscribe({
      next: () => { this.toastService.success(t.isActive ? 'Tarefa inativada.' : 'Tarefa ativada.'); this.loadTasks(); },
      error: (e) => this.toastService.error(e?.error?.message || 'Erro ao atualizar tarefa.')
    });
  }

  cancel() {
    this.showForm = false;
    this.editingId = null;
    this.model = { projectId: this.filterProjectId, name: '', description: '', isActive: true };
  }
}
