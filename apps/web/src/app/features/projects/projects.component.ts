import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, Pencil, Trash2, Check, X, Folder, Eye, EyeOff } from 'lucide-angular';
import { ProjectService } from '../../core/services/project.service';
import { ToastService } from '../../core/services/toast.service';
import { Project } from '../../core/models';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">Projetos</h2>
          <p class="text-slate-500">Gerencie os projetos da organização</p>
        </div>
        <button (click)="showForm = true" class="btn-primary px-6 py-2 flex items-center gap-2">
          <lucide-icon [name]="PlusIcon" size="20"></lucide-icon>
          Novo Projeto
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
      <div *ngIf="showForm" class="card p-6 border-primary-100 bg-primary-50/10 animate-slide-in">
        <h3 class="text-lg font-bold text-slate-800 mb-4">
          {{ editingId ? 'Editar Projeto' : 'Novo Projeto' }}
        </h3>
        <form (ngSubmit)="saveProject()" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="block text-sm font-semibold text-slate-700 mb-1">Nome</label>
            <input type="text" [(ngModel)]="model.name" name="name" required class="input" placeholder="Ex: Projeto Alpha">
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-semibold text-slate-700 mb-1">Descrição</label>
            <textarea [(ngModel)]="model.description" name="description" rows="2" class="input" placeholder="Opcional"></textarea>
          </div>
          <div *ngIf="editingId" class="flex items-center gap-2">
            <input type="checkbox" [(ngModel)]="model.isActive" name="isActive" id="isActive" class="w-4 h-4 text-primary-600 rounded">
            <label for="isActive" class="text-sm font-medium text-slate-700">Ativo</label>
          </div>
          <div class="md:col-span-2 flex justify-end gap-3 mt-2">
            <button type="button" (click)="cancel()" class="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" class="btn-primary px-6 py-2">
              Salvar Projeto
            </button>
          </div>
        </form>
      </div>

      <!-- Projects List -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let p of projects()" class="card group hover:border-primary-200 transition-all">
          <div class="p-6">
            <div class="flex items-start justify-between mb-4">
              <div class="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors shadow-sm">
                <lucide-icon [name]="FolderIcon" size="24"></lucide-icon>
              </div>
              <div class="flex gap-1">
                <button (click)="edit(p)" class="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all" title="Editar">
                  <lucide-icon [name]="PencilIcon" size="18"></lucide-icon>
                </button>
                <button (click)="toggleActive(p)" class="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" [title]="p.isActive ? 'Desativar' : 'Ativar'">
                  <lucide-icon [name]="p.isActive ? Trash2Icon : CheckIcon" size="18"></lucide-icon>
                </button>
              </div>
            </div>
            <h4 class="font-bold text-slate-800 text-lg mb-1">{{ p.name }}</h4>
            <p class="text-slate-500 text-sm line-clamp-2 mb-4">{{ p.description || 'Sem descrição' }}</p>
            <div class="flex items-center justify-between pt-4 border-t border-slate-50">
              <span [class]="'px-2 py-1 rounded-full text-xs font-bold uppercase ' + (p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')">
                {{ p.isActive ? 'Ativo' : 'Inativo' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="projects().length === 0" class="card p-12 text-center text-slate-400">
        Nenhum projeto cadastrado.
      </div>
    </div>
  `
})
export class ProjectsComponent implements OnInit {
  private projectService = inject(ProjectService);
  private toastService = inject(ToastService);
  
  projects = signal<Project[]>([]);
  showForm = false;
  editingId: string | null = null;
  showInactive = signal(false);
  
  model: Partial<Project> = {
    name: '',
    description: '',
    isActive: true
  };

  readonly PlusIcon = Plus;
  readonly PencilIcon = Pencil;
  readonly Trash2Icon = Trash2;
  readonly CheckIcon = Check;
  readonly XIcon = X;
  readonly FolderIcon = Folder;
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.projectService.getProjects(this.showInactive()).subscribe(res => this.projects.set(res));
  }

  toggleShowInactive() {
    this.showInactive.set(!this.showInactive());
    this.loadProjects();
  }

  saveProject() {
    if (!this.model.name) return;

    if (this.editingId) {
      this.projectService.updateProject(this.editingId, this.model).subscribe({
        next: () => { this.toastService.success('Projeto atualizado com sucesso!'); this.cancel(); this.loadProjects(); },
        error: (e) => this.toastService.error(e?.error?.message || 'Erro ao atualizar projeto.')
      });
    } else {
      this.projectService.createProject(this.model.name!, this.model.description).subscribe({
        next: () => { this.toastService.success('Projeto criado com sucesso!'); this.cancel(); this.loadProjects(); },
        error: (e) => this.toastService.error(e?.error?.message || 'Erro ao criar projeto.')
      });
    }
  }

  edit(p: Project) {
    this.editingId = p.id;
    this.model = { ...p };
    this.showForm = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleActive(p: Project) {
    this.projectService.updateProject(p.id, { isActive: !p.isActive }).subscribe({
      next: () => { this.toastService.success(p.isActive ? 'Projeto inativado.' : 'Projeto ativado.'); this.loadProjects(); },
      error: (e) => this.toastService.error(e?.error?.message || 'Erro ao atualizar projeto.')
    });
  }

  cancel() {
    this.showForm = false;
    this.editingId = null;
    this.model = { name: '', description: '', isActive: true };
  }
}
