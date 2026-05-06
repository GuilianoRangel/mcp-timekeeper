import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Play, Square, List, Folder, FileText, ChevronRight, History, Target } from 'lucide-angular';
import { TimeService } from '../../core/services/time.service';
import { ProjectService } from '../../core/services/project.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { Project, Task, TimeEntry } from '../../core/models';
import { DurationPipe } from '../../shared/pipes/duration.pipe';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, DurationPipe],
  template: `
    <div class="space-y-8 animate-fade-in">
      
      <!-- Active Task Banner / Timer -->
      <section>
        <!-- Banner de Tarefa Ativa (Apenas se houver tarefa) -->
        <div *ngIf="activeTask()" class="mb-8 relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 md:p-12 shadow-2xl animate-fade-in">
          <div class="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-500/20 text-primary-300 mb-4 border border-primary-500/30">
                <span class="w-2 h-2 rounded-full bg-primary-500 mr-2 animate-pulse"></span>
                Tarefa em Andamento
              </span>
              <h2 class="text-3xl md:text-4xl font-bold mb-2">
                {{ activeTaskName() || 'Inicie uma nova tarefa' }}
              </h2>
              <p class="text-slate-400 flex items-center gap-2">
                <lucide-icon [name]="FolderIcon" size="16"></lucide-icon>
                {{ activeProjectName() || 'Selecione um projeto e tarefa abaixo' }}
              </p>
            </div>

            <div class="flex flex-col items-end gap-4 w-full md:w-auto">
              <div class="text-5xl md:text-6xl font-mono tracking-tighter text-white drop-shadow-sm">
                {{ elapsedTime() | duration }}
              </div>
              <button 
                (click)="stopTask()"
                class="w-full md:w-auto px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/20"
              >
                <lucide-icon [name]="StopIcon" size="20"></lucide-icon>
                Finalizar
              </button>
            </div>
          </div>
          
          <!-- Decorative Background -->
          <div class="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl"></div>
          <div class="absolute bottom-0 left-0 -mb-20 -ml-20 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>
      </section>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- New Entry Form -->
        <div class="lg:col-span-2 space-y-6">
          <div class="card p-6">
            <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <lucide-icon [name]="PlayIcon" size="20" class="text-primary-600"></lucide-icon>
              Iniciar Nova Sessão
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">Projeto</label>
                <select 
                  [(ngModel)]="selectedProjectId" 
                  (change)="onProjectChange()"
                  class="input appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-10"
                >
                  <option value="">Selecione um projeto</option>
                  <option *ngFor="let p of projects()" [value]="p.id">{{ p.name }}</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">Tarefa</label>
                <select 
                  [(ngModel)]="selectedTaskId" 
                  [disabled]="!selectedProjectId"
                  class="input appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-10"
                >
                  <option value="">Selecione uma tarefa</option>
                  <option *ngFor="let t of tasks()" [value]="t.id">{{ t.name }}</option>
                  <option value="NEW">➕ Outra (Nova Tarefa)...</option>
                </select>
              </div>

              <div *ngIf="selectedTaskId === 'NEW'" class="md:col-span-2 animate-slide-in">
                <label class="block text-sm font-semibold text-slate-700 mb-2">Nome da Nova Tarefa</label>
                <input 
                  type="text" 
                  [(ngModel)]="newTaskName" 
                  class="input border-primary-300 bg-primary-50/30" 
                  placeholder="Ex: Reunião de Alinhamento, Pesquisa, etc."
                >
              </div>

              <div class="md:col-span-2">
                <label class="block text-sm font-semibold text-slate-700 mb-2">Observação (Opcional)</label>
                <textarea 
                  [(ngModel)]="note" 
                  rows="2" 
                  class="input" 
                  placeholder="O que você está fazendo?"
                ></textarea>
              </div>
            </div>

            <div class="mt-8 flex justify-end">
              <button 
                (click)="startTask()" 
                [disabled]="!selectedTaskId || activeTask()"
                class="btn-primary px-10 py-3 flex items-center gap-2"
              >
                <lucide-icon [name]="PlayIcon" size="20"></lucide-icon>
                <span>Iniciar Agora</span>
              </button>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="card overflow-hidden">
            <div class="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
                <lucide-icon [name]="HistoryIcon" size="20" class="text-primary-600"></lucide-icon>
                Atividade Recente
              </h3>
              <button class="text-sm font-semibold text-primary-600 hover:text-primary-700">Ver tudo</button>
            </div>
            <div class="divide-y divide-slate-100">
              <div *ngFor="let entry of recentEntries()" class="p-6 hover:bg-slate-50 transition-colors group">
                <div class="flex items-center justify-between gap-4">
                  <div class="flex-1 min-w-0">
                    <p class="font-bold text-slate-800 truncate group-hover:text-primary-700 transition-colors">
                      {{ entry.task?.name || 'Tarefa s/ Nome' }}
                    </p>
                    <p class="text-sm text-slate-500 flex items-center gap-2">
                      {{ entry.project?.name }} • {{ entry.startedAt | date:'HH:mm' }} - {{ entry.endedAt | date:'HH:mm' }}
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="font-mono font-bold text-slate-700">{{ entry.durationSeconds | duration }}</p>
                    <p class="text-xs text-slate-400">{{ entry.startedAt | date:'dd/MM/yyyy' }}</p>
                  </div>
                  <lucide-icon [name]="ChevronRightIcon" size="18" class="text-slate-300 group-hover:text-primary-400 transition-colors"></lucide-icon>
                </div>
              </div>
              <div *ngIf="recentEntries().length === 0" class="p-12 text-center text-slate-400">
                Nenhuma atividade recente registrada hoje.
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar / Stats -->
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
            <div class="card p-6 bg-gradient-to-br from-primary-600 to-primary-700 text-white border-none shadow-lg shadow-primary-200">
              <h4 class="text-sm font-bold uppercase tracking-wider opacity-80 mb-1">Total Hoje</h4>
              <p class="text-4xl font-mono font-bold">{{ dailyTotal() | duration }}</p>
              <div class="mt-4 pt-4 border-t border-white/10 flex justify-between text-sm">
                <span>Sessões: {{ recentEntries().length }}</span>
                <span>Ativo agora: {{ activeTask() ? 'Sim' : 'Não' }}</span>
              </div>
            </div>

            <div class="card p-6 border-none bg-slate-50 shadow-sm">
              <div class="flex items-center justify-between mb-4">
                <h4 class="font-bold text-slate-800 flex items-center gap-2">
                  <lucide-icon [name]="TargetIcon" size="18" class="text-primary-600"></lucide-icon>
                  Progresso Semanal
                </h4>
                <span class="text-xs font-bold text-slate-500">{{ weeklyPercent() }}%</span>
              </div>
              
              <div class="space-y-4">
                <div class="w-full h-4 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                  <div 
                    class="h-full bg-primary-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" 
                    [style.width.%]="weeklyPercent()"
                  ></div>
                </div>
                
                <div class="flex justify-between items-end">
                  <div>
                    <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Acumulado</p>
                    <p class="text-lg font-mono font-bold text-slate-700">{{ weeklyTotal() | duration }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Meta: {{ (userGoal() / 3600) }}h</p>
                    <p class="text-sm font-bold" [class.text-primary-600]="weeklyBalance() > 0" [class.text-emerald-500]="weeklyBalance() <= 0">
                      {{ weeklyBalance() > 0 ? (weeklyBalance() | duration) + ' restante' : 'Meta batida! 🎉' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="card p-6">
              <h4 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
                 <lucide-icon [name]="ListIcon" size="18" class="text-primary-600"></lucide-icon>
                 Projetos Ativos
              </h4>
              <div class="space-y-4">
                <div *ngFor="let p of projects().slice(0, 5)" class="flex items-center justify-between">
                  <span class="text-sm font-medium text-slate-600">{{ p.name }}</span>
                  <div class="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-primary-500 rounded-full" [style.width.%]="45"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit, OnDestroy {
  private timeService = inject(TimeService);
  private projectService = inject(ProjectService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  activeTask = this.timeService.activeTask;
  projects = signal<Project[]>([]);
  tasks = signal<Task[]>([]);
  recentEntries = signal<TimeEntry[]>([]);
  weeklyEntries = signal<TimeEntry[]>([]);
  
  selectedProjectId = '';
  selectedTaskId = '';
  newTaskName = '';
  note = '';
  
  elapsedTime = signal<number>(0);
  private timerSub?: Subscription;

  readonly PlayIcon = Play;
  readonly StopIcon = Square;
  readonly FolderIcon = Folder;
  readonly ListIcon = List;
  readonly HistoryIcon = History;
  readonly ChevronRightIcon = ChevronRight;
  readonly TargetIcon = Target;

  activeProjectName = computed(() => {
    const active = this.activeTask() as any;
    if (!active) return '';
    return active.projectName || this.projects().find(p => p.id === active.projectId)?.name || 'Projeto carregando...';
  });

  activeTaskName = computed(() => {
    const active = this.activeTask() as any;
    if (!active) return '';
    // If we have tasks loaded for this project, find the name
    return active.taskName || this.tasks().find(t => t.id === active.taskId)?.name || 'Tarefa carregando...';
  });

  dailyTotal = computed(() => {
    const entriesTotal = this.recentEntries().reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);
    return entriesTotal + this.elapsedTime();
  });

  userGoal = computed(() => {
    return this.authService.user()?.weeklyGoalSeconds || 36000;
  });

  weeklyTotal = computed(() => {
    const entriesTotal = this.weeklyEntries().reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);
    return entriesTotal + this.elapsedTime();
  });

  weeklyPercent = computed(() => {
    const goal = this.userGoal();
    if (goal === 0) return 100;
    const percent = Math.floor((this.weeklyTotal() / goal) * 100);
    return percent > 100 ? 100 : percent;
  });

  weeklyBalance = computed(() => {
    return this.userGoal() - this.weeklyTotal();
  });

  ngOnInit() {
    this.loadData();
    this.loadRecent();
    this.loadWeekly();
    
    // Check active task every minute just in case
    interval(60000).subscribe(() => this.timeService.getActiveTask().subscribe());
    
    // Timer update
    this.timerSub = interval(1000).subscribe(() => {
      const active = this.activeTask();
      if (active && active.startedAt) {
        const start = new Date(active.startedAt).getTime();
        const now = new Date().getTime();
        const diff = Math.floor((now - start) / 1000);
        this.elapsedTime.set(diff > 0 ? diff : 0);
      } else {
        this.elapsedTime.set(0);
      }
    });
  }

  ngOnDestroy() {
    this.timerSub?.unsubscribe();
  }

  loadData() {
    this.projectService.getProjects().subscribe(res => {
      this.projects.set(res);
      const active = this.activeTask();
      if (active && active.projectId) {
        this.loadTasks(active.projectId);
      }
    });
    this.timeService.getActiveTask().subscribe(active => {
      if (active && active.projectId) {
        this.loadTasks(active.projectId);
      }
    });
  }

  loadTasks(projectId: string) {
    if (!projectId) return;
    this.projectService.getTasks(projectId).subscribe(res => this.tasks.set(res));
  }

  loadRecent() {
    const today = new Date().toISOString().split('T')[0];
    this.timeService.getRecentEntries(today).subscribe(res => {
      this.recentEntries.set(res.filter(e => !!e.endedAt).sort((a, b) => b.startedAt.localeCompare(a.startedAt)));
    });
  }

  loadWeekly() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff)).toISOString().split('T')[0];
    this.timeService.getRecentEntries(monday).subscribe(res => {
      this.weeklyEntries.set(res.filter(e => !!e.endedAt));
    });
  }

  onProjectChange() {
    this.selectedTaskId = '';
    if (this.selectedProjectId) {
      this.projectService.getTasks(this.selectedProjectId).subscribe(res => this.tasks.set(res));
    } else {
      this.tasks.set([]);
    }
  }

  startTask() {
    if (!this.selectedProjectId || !this.selectedTaskId) return;

    if (this.selectedTaskId === 'NEW') {
      if (!this.newTaskName.trim()) {
        this.toastService.warning('Por favor, informe o nome da nova tarefa.');
        return;
      }

      this.projectService.createTask(this.selectedProjectId, this.newTaskName).subscribe({
        next: (task) => {
          this.timeService.startTask(this.selectedProjectId, task.id, this.note).subscribe({
            next: () => {
              this.toastService.success(`Tarefa "${this.newTaskName}" iniciada!`);
              this.selectedTaskId = '';
              this.newTaskName = '';
              this.note = '';
              this.loadTasks(this.selectedProjectId);
            },
            error: (e) => this.toastService.error(e?.error?.message || 'Erro ao iniciar tarefa.')
          });
        },
        error: (e) => this.toastService.error(e?.error?.message || 'Erro ao criar tarefa.')
      });
    } else {
      const taskName = this.tasks().find(t => t.id === this.selectedTaskId)?.name || '';
      this.timeService.startTask(this.selectedProjectId, this.selectedTaskId, this.note).subscribe({
        next: () => {
          this.toastService.success(`Tarefa "${taskName}" iniciada!`);
          this.selectedTaskId = '';
          this.note = '';
        },
        error: (e) => this.toastService.error(e?.error?.message || 'Erro ao iniciar tarefa.')
      });
    }
  }

  stopTask() {
    this.timeService.stopTask().subscribe({
      next: () => {
        this.toastService.success('Sessão finalizada com sucesso!');
        this.loadRecent();
        this.loadWeekly();
      },
      error: (e) => this.toastService.error(e?.error?.message || 'Erro ao finalizar sessão.')
    });
  }
}
