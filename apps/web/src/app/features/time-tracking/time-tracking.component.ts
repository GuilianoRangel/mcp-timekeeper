import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Clock, Calendar, Plus, Filter, Search, Edit2, Trash2, X, Save } from 'lucide-angular';
import { TimeService } from '../../core/services/time.service';
import { TimeEntryService } from '../../core/services/time-entry.service';
import { ProjectService } from '../../core/services/project.service';
import { ToastService } from '../../core/services/toast.service';
import { Project, Task, TimeEntry } from '../../core/models';
import { DurationPipe } from '../../shared/pipes/duration.pipe';

@Component({
  selector: 'app-time-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, DurationPipe],
  template: `
    <div class="space-y-6 animate-fade-in">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-slate-900">Apontamentos</h2>
          <p class="text-slate-500">Gerencie seu histórico de tempo e lançamentos manuais.</p>
        </div>
        <button 
          (click)="openManualEntry()"
          class="btn-primary flex items-center gap-2"
        >
          <lucide-icon [name]="PlusIcon" size="20"></lucide-icon>
          <span>Lançamento Manual</span>
        </button>
      </div>

      <!-- Filters -->
      <div class="card p-4 flex flex-wrap items-center gap-4">
        <!-- Search -->
        <div class="relative flex-1 min-w-[220px]">
          <lucide-icon [name]="SearchIcon" size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></lucide-icon>
          <input 
            type="text" 
            [ngModel]="searchText()" 
            (ngModelChange)="searchText.set($event)"
            class="input pl-10" 
            placeholder="Buscar por tarefa, projeto ou observação..."
          >
        </div>
        <!-- Date range -->
        <div class="flex items-center gap-2">
          <input type="date" [(ngModel)]="filterFrom" (change)="loadEntries()" class="input w-auto">
          <span class="text-slate-400">até</span>
          <input type="date" [(ngModel)]="filterTo" (change)="loadEntries()" class="input w-auto">
        </div>
        <!-- Project filter -->
        <select 
          [ngModel]="filterProjectId()" 
          (ngModelChange)="filterProjectId.set($event)"
          class="input w-auto min-w-[160px]"
        >
          <option value="">Todos os projetos</option>
          <option *ngFor="let p of projects()" [value]="p.id">{{ p.name }}</option>
        </select>
      </div>

      <!-- Summary Bar -->
      <div *ngIf="filteredEntries().length > 0" class="flex items-center justify-between px-4 py-2 bg-primary-50 rounded-xl border border-primary-100 text-sm">
        <span class="text-slate-600 font-medium">
          <strong class="text-slate-800">{{ filteredEntries().length }}</strong> apontamentos encontrados
        </span>
        <span class="font-mono font-bold text-primary-700">
          Total: {{ totalFilteredSeconds() | duration }}
        </span>
      </div>

      <!-- Table -->
      <div class="card overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200">
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Data</th>
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Projeto / Tarefa</th>
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Observação</th>
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Origem</th>
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Duração</th>
              <th class="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr *ngFor="let entry of filteredEntries()" class="hover:bg-slate-50 transition-colors group">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-slate-900">{{ entry.startedAt | date:'dd/MM/yyyy' }}</div>
                <div class="text-xs text-slate-500">{{ entry.startedAt | date:'HH:mm' }} - {{ entry.endedAt | date:'HH:mm' }}</div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm font-bold text-slate-800">{{ entry.task?.name || entry.taskId }}</div>
                <div class="text-xs text-slate-500 flex items-center gap-1">
                  <lucide-icon [name]="ClockIcon" size="12"></lucide-icon>
                  {{ entry.project?.name || entry.projectId }}
                </div>
              </td>
              <td class="px-6 py-4 max-w-[200px] truncate text-sm text-slate-600">
                {{ entry.note || '-' }}
              </td>
              <td class="px-6 py-4">
                <span class="text-[10px] px-2 py-0.5 bg-slate-100 rounded-full text-slate-500 uppercase font-bold">
                  {{ entry.source }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                  {{ entry.durationSeconds | duration }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    (click)="openEdit(entry)" 
                    class="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                    title="Editar"
                    *ngIf="canEdit(entry)"
                  >
                    <lucide-icon [name]="EditIcon" size="16"></lucide-icon>
                  </button>
                  <button 
                    (click)="confirmDelete(entry)" 
                    class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Excluir"
                    *ngIf="canEdit(entry)"
                  >
                    <lucide-icon [name]="TrashIcon" size="16"></lucide-icon>
                  </button>
                </div>
                <span *ngIf="!canEdit(entry)" class="text-[10px] text-slate-300 italic">bloqueado</span>
              </td>
            </tr>
            <tr *ngIf="filteredEntries().length === 0">
              <td colspan="6" class="px-6 py-12 text-center text-slate-400">
                Nenhum apontamento encontrado para este período.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Manual Entry Modal -->
    <div *ngIf="showManualEntry()" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-in">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-xl font-bold text-slate-900">Novo Lançamento Manual</h3>
          <button (click)="showManualEntry.set(false)" class="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
            <lucide-icon [name]="XIcon" size="20"></lucide-icon>
          </button>
        </div>
        <div class="p-6 space-y-4">
          <!-- Mode toggle -->
          <div class="flex bg-slate-100 p-1 rounded-lg">
            <button 
              (click)="manualMode.set('duration')" 
              [class.bg-white]="manualMode() === 'duration'"
              [class.shadow-sm]="manualMode() === 'duration'"
              class="flex-1 py-1.5 text-sm font-semibold rounded-md transition-all"
            >Duração (HH:MM)</button>
            <button 
              (click)="manualMode.set('range')" 
              [class.bg-white]="manualMode() === 'range'"
              [class.shadow-sm]="manualMode() === 'range'"
              class="flex-1 py-1.5 text-sm font-semibold rounded-md transition-all"
            >Início / Fim</button>
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Projeto</label>
            <select [(ngModel)]="newProjectId" (change)="loadTasksForModal()" class="input">
              <option value="">Selecione um projeto</option>
              <option *ngFor="let p of projects()" [value]="p.id">{{ p.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Tarefa</label>
            <select [(ngModel)]="newTaskId" [disabled]="!newProjectId" class="input">
              <option value="">Selecione uma tarefa</option>
              <option *ngFor="let t of modalTasks()" [value]="t.id">{{ t.name }}</option>
            </select>
          </div>

          <!-- Duration Mode -->
          <div *ngIf="manualMode() === 'duration'" class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">Data</label>
              <input type="date" [(ngModel)]="manualDate" class="input">
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">Duração (HH:MM)</label>
              <input type="text" [(ngModel)]="manualDuration" placeholder="01:30" class="input font-mono">
            </div>
          </div>

          <!-- Range Mode -->
          <div *ngIf="manualMode() === 'range'" class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">Início</label>
              <input type="datetime-local" [(ngModel)]="manualStart" class="input text-sm">
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">Fim</label>
              <input type="datetime-local" [(ngModel)]="manualEnd" class="input text-sm">
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Observação (opcional)</label>
            <textarea [(ngModel)]="manualNote" class="input" rows="2" placeholder="O que foi feito?"></textarea>
          </div>
        </div>
        <div class="p-6 border-t border-slate-100 flex justify-end gap-3">
          <button (click)="showManualEntry.set(false)" class="btn-secondary">Cancelar</button>
          <button (click)="saveManual()" class="btn-primary flex items-center gap-2">
            <lucide-icon [name]="SaveIcon" size="18"></lucide-icon>
            Salvar Lançamento
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Entry Modal -->
    <div *ngIf="editingEntry()" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-in">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-xl font-bold text-slate-900">Editar Apontamento</h3>
          <button (click)="editingEntry.set(null)" class="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
            <lucide-icon [name]="XIcon" size="20"></lucide-icon>
          </button>
        </div>
        <div class="p-6 space-y-4" *ngIf="editingEntry() as entry">
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Projeto</label>
            <select [(ngModel)]="editProjectId" (change)="loadTasksForEdit()" class="input">
              <option *ngFor="let p of projects()" [value]="p.id">{{ p.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Tarefa</label>
            <select [(ngModel)]="editTaskId" class="input">
              <option *ngFor="let t of editTasks()" [value]="t.id">{{ t.name }}</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">Início</label>
              <input type="datetime-local" [(ngModel)]="editStart" class="input text-sm">
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">Fim</label>
              <input type="datetime-local" [(ngModel)]="editEnd" class="input text-sm">
            </div>
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Observação</label>
            <textarea [(ngModel)]="editNote" class="input" rows="2"></textarea>
          </div>
          <p class="text-xs text-slate-400 flex items-center gap-1">
            <lucide-icon [name]="ClockIcon" size="12"></lucide-icon>
            Edição disponível por 30 dias após o lançamento.
          </p>
        </div>
        <div class="p-6 border-t border-slate-100 flex justify-end gap-3">
          <button (click)="editingEntry.set(null)" class="btn-secondary">Cancelar</button>
          <button (click)="saveEdit()" class="btn-primary flex items-center gap-2">
            <lucide-icon [name]="SaveIcon" size="18"></lucide-icon>
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div *ngIf="deletingEntry()" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slide-in p-6 text-center">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <lucide-icon [name]="TrashIcon" size="32" class="text-red-500"></lucide-icon>
        </div>
        <h3 class="text-lg font-bold text-slate-900 mb-2">Excluir Apontamento?</h3>
        <p class="text-slate-500 text-sm mb-6">Esta ação não pode ser desfeita. O registro será removido permanentemente.</p>
        <div class="flex gap-3">
          <button (click)="deletingEntry.set(null)" class="btn-secondary flex-1">Cancelar</button>
          <button (click)="executeDelete()" class="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors">
            Sim, Excluir
          </button>
        </div>
      </div>
    </div>
  `
})
export class TimeTrackingComponent implements OnInit {
  private timeService = inject(TimeService);
  private timeEntryService = inject(TimeEntryService);
  private projectService = inject(ProjectService);
  private toastService = inject(ToastService);

  entries = signal<TimeEntry[]>([]);
  projects = signal<Project[]>([]);
  allTasks = signal<Task[]>([]);
  modalTasks = signal<Task[]>([]);
  editTasks = signal<Task[]>([]);

  private projectMap = new Map<string, string>(); // id -> name
  private taskMap = new Map<string, string>(); // id -> name

  // Filters
  searchText = signal('');
  filterProjectId = signal('');
  filterFrom = new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0];
  filterTo = new Date().toISOString().split('T')[0];

  filteredEntries = computed(() => {
    let list = this.entries();
    const search = this.searchText().toLowerCase();
    if (search) {
      list = list.filter(e =>
        (e.task?.name ?? this.taskMap.get(e.taskId) ?? '').toLowerCase().includes(search) ||
        (e.project?.name ?? this.projectMap.get(e.projectId) ?? '').toLowerCase().includes(search) ||
        (e.note ?? '').toLowerCase().includes(search)
      );
    }
    const projFilter = this.filterProjectId();
    if (projFilter) {
      list = list.filter(e => e.projectId === projFilter);
    }
    return list;
  });

  totalFilteredSeconds = computed(() =>
    this.filteredEntries().reduce((acc, e) => acc + (e.durationSeconds || 0), 0)
  );

  // Manual entry
  showManualEntry = signal(false);
  manualMode = signal<'duration' | 'range'>('duration');
  newProjectId = '';
  newTaskId = '';
  manualDate = new Date().toISOString().split('T')[0];
  manualDuration = '01:00';
  manualStart = '';
  manualEnd = '';
  manualNote = '';

  // Edit
  editingEntry = signal<TimeEntry | null>(null);
  editProjectId = '';
  editTaskId = '';
  editStart = '';
  editEnd = '';
  editNote = '';

  // Delete
  deletingEntry = signal<TimeEntry | null>(null);

  readonly ClockIcon = Clock;
  readonly CalendarIcon = Calendar;
  readonly PlusIcon = Plus;
  readonly FilterIcon = Filter;
  readonly SearchIcon = Search;
  readonly EditIcon = Edit2;
  readonly TrashIcon = Trash2;
  readonly XIcon = X;
  readonly SaveIcon = Save;

  ngOnInit() {
    // Load projects first, then tasks, then entries
    this.projectService.getProjects().subscribe(projects => {
      this.projects.set(projects);
      this.projectMap = new Map(projects.map(p => [p.id, p.name]));
      this.projectService.getTasks().subscribe(tasks => {
        this.allTasks.set(tasks);
        this.taskMap = new Map(tasks.map(t => [t.id, t.name]));
        this.loadEntries();
      });
    });
  }

  loadEntries() {
    this.timeService.getRecentEntries(this.filterFrom, this.filterTo).subscribe(res => {
      // Enrich entries with project and task name objects
      const enriched = res.map(e => ({
        ...e,
        project: { id: e.projectId, name: this.projectMap.get(e.projectId) || e.projectId, createdAt: '' },
        task: { id: e.taskId, name: this.taskMap.get(e.taskId) || e.taskId, projectId: e.projectId, createdAt: '' }
      } as TimeEntry));
      this.entries.set(enriched.sort((a, b) => b.startedAt.localeCompare(a.startedAt)));
    });
  }

  // Can edit if entry is within 30 days
  canEdit(entry: TimeEntry): boolean {
    if (!entry.startedAt) return false;
    const created = new Date(entry.startedAt).getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    return (Date.now() - created) <= thirtyDaysMs;
  }

  toLocalDatetimeInput(isoStr: string): string {
    if (!isoStr) return '';
    // Convert ISO to "YYYY-MM-DDTHH:MM" for datetime-local input
    return isoStr.substring(0, 16);
  }

  openManualEntry() {
    this.newProjectId = '';
    this.newTaskId = '';
    this.manualNote = '';
    this.manualDuration = '01:00';
    this.manualDate = new Date().toISOString().split('T')[0];
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    this.manualEnd = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const h1ago = new Date(now.getTime() - 3600000);
    this.manualStart = `${h1ago.getFullYear()}-${pad(h1ago.getMonth()+1)}-${pad(h1ago.getDate())}T${pad(h1ago.getHours())}:${pad(h1ago.getMinutes())}`;
    this.showManualEntry.set(true);
  }

  loadTasksForModal() {
    if (this.newProjectId) {
      this.projectService.getTasks(this.newProjectId).subscribe(res => this.modalTasks.set(res));
      this.newTaskId = '';
    } else {
      this.modalTasks.set([]);
    }
  }

  loadTasksForEdit() {
    if (this.editProjectId) {
      this.projectService.getTasks(this.editProjectId).subscribe(res => {
        this.editTasks.set(res);
        if (!res.find(t => t.id === this.editTaskId)) {
          this.editTaskId = res[0]?.id || '';
        }
      });
    }
  }

  saveManual() {
    if (!this.newProjectId || !this.newTaskId) {
      this.toastService.warning('Selecione o projeto e a tarefa.');
      return;
    }

    if (this.manualMode() === 'duration') {
      const parts = this.manualDuration.split(':').map(Number);
      if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
        this.toastService.error('Duração inválida. Use o formato HH:MM.');
        return;
      }
      const durationSeconds = parts[0] * 3600 + parts[1] * 60;
      this.timeService.logManualDuration(this.newProjectId, this.newTaskId, durationSeconds, this.manualNote)
        .subscribe({
          next: () => {
            this.toastService.success('Lançamento registrado com sucesso!');
            this.showManualEntry.set(false);
            this.loadEntries();
          },
          error: (e) => this.toastService.error(e?.error?.message || 'Erro ao registrar lançamento.')
        });
    } else {
      if (!this.manualStart || !this.manualEnd) {
        this.toastService.warning('Informe o início e o fim do intervalo.');
        return;
      }
      const startIso = new Date(this.manualStart).toISOString();
      const endIso = new Date(this.manualEnd).toISOString();
      if (new Date(endIso) <= new Date(startIso)) {
        this.toastService.error('O fim deve ser posterior ao início.');
        return;
      }
      this.timeService.logManualRange(this.newProjectId, this.newTaskId, startIso, endIso, this.manualNote)
        .subscribe({
          next: () => {
            this.toastService.success('Lançamento registrado com sucesso!');
            this.showManualEntry.set(false);
            this.loadEntries();
          },
          error: (e) => this.toastService.error(e?.error?.message || 'Erro ao registrar lançamento.')
        });
    }
  }

  openEdit(entry: TimeEntry) {
    this.editingEntry.set(entry);
    this.editProjectId = entry.projectId;
    this.editTaskId = entry.taskId;
    this.editNote = entry.note || '';
    this.editStart = this.toLocalDatetimeInput(entry.startedAt);
    this.editEnd = entry.endedAt ? this.toLocalDatetimeInput(entry.endedAt) : '';

    this.projectService.getTasks(entry.projectId).subscribe(res => {
      this.editTasks.set(res);
    });
  }

  saveEdit() {
    const entry = this.editingEntry();
    if (!entry) return;

    const startIso = this.editStart ? new Date(this.editStart).toISOString() : undefined;
    const endIso = this.editEnd ? new Date(this.editEnd).toISOString() : undefined;

    this.timeEntryService.updateEntry(entry.id, {
      projectId: this.editProjectId,
      taskId: this.editTaskId,
      startedAt: startIso,
      endedAt: endIso,
      note: this.editNote
    }).subscribe({
      next: () => {
        this.toastService.success('Apontamento atualizado com sucesso!');
        this.editingEntry.set(null);
        this.loadEntries();
      },
      error: (e) => this.toastService.error(e?.error?.message || 'Erro ao atualizar. Verifique a janela de edição (30 dias).')
    });
  }

  confirmDelete(entry: TimeEntry) {
    this.deletingEntry.set(entry);
  }

  executeDelete() {
    const entry = this.deletingEntry();
    if (!entry) return;
    
    this.timeEntryService.deleteEntry(entry.id).subscribe({
      next: () => {
        this.toastService.success('Apontamento excluído.');
        this.deletingEntry.set(null);
        this.loadEntries();
      },
      error: (e) => this.toastService.error(e?.error?.message || 'Erro ao excluir.')
    });
  }
}
