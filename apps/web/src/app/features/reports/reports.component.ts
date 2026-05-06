import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, PieChart, BarChart2, Download, Calendar, TrendingUp } from 'lucide-angular';
import { ReportService, FullProjectReport, FullTaskReport, ProjectReport, TaskReport } from '../../core/services/report.service';
import { ProjectService } from '../../core/services/project.service';
import { DurationPipe } from '../../shared/pipes/duration.pipe';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, DurationPipe],
  template: `
    <div class="space-y-6 animate-fade-in">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-slate-900">Relatórios</h2>
          <p class="text-slate-500">Analise o tempo investido em cada projeto e tarefa.</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="card p-6 flex flex-wrap items-center gap-6">
        <div class="flex items-center gap-3">
          <lucide-icon [name]="CalendarIcon" size="20" class="text-slate-400"></lucide-icon>
          <input type="date" [(ngModel)]="from" (change)="loadReports()" class="input w-auto">
          <span class="text-slate-400">até</span>
          <input type="date" [(ngModel)]="to" (change)="loadReports()" class="input w-auto">
        </div>
        
        <div class="flex bg-slate-100 p-1 rounded-lg">
          <button 
            (click)="reportType.set('project')" 
            [class.bg-white]="reportType() === 'project'"
            [class.shadow-sm]="reportType() === 'project'"
            class="px-4 py-1.5 rounded-md text-sm font-semibold transition-all"
          >
            Por Projeto
          </button>
          <button 
            (click)="reportType.set('task')" 
            [class.bg-white]="reportType() === 'task'"
            [class.shadow-sm]="reportType() === 'task'"
            class="px-4 py-1.5 rounded-md text-sm font-semibold transition-all"
          >
            Por Tarefa
          </button>
        </div>
      </div>

      <!-- Grand Total Banner -->
      <div *ngIf="grandTotal() > 0" class="card p-6 bg-gradient-to-r from-primary-600 to-primary-500 text-white border-none">
        <p class="text-sm font-semibold opacity-80 uppercase tracking-wider mb-1">Total do Período</p>
        <p class="text-5xl font-mono font-bold tracking-tighter">{{ grandTotal() | duration }}</p>
        <p class="text-sm opacity-70 mt-1">{{ from | date:'dd/MM/yyyy' }} → {{ to | date:'dd/MM/yyyy' }}</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <!-- Totals Table -->
        <div class="lg:col-span-3 card overflow-hidden">
          <div class="p-6 border-b border-slate-100">
            <h3 class="font-bold text-slate-800">Totais por {{ reportType() === 'project' ? 'Projeto' : 'Tarefa' }}</h3>
          </div>
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="px-6 py-4 text-xs font-bold uppercase text-slate-500">{{ reportType() === 'project' ? 'Projeto' : 'Tarefa' }}</th>
                <th *ngIf="reportType() === 'task'" class="px-6 py-4 text-xs font-bold uppercase text-slate-500">Projeto</th>
                <th class="px-6 py-4 text-xs font-bold uppercase text-slate-500 text-right">Duração Total</th>
                <th class="px-6 py-4 text-xs font-bold uppercase text-slate-500 text-right">%</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let item of currentTotals()" class="hover:bg-slate-50 transition-colors">
                <td class="px-6 py-4 text-sm font-bold text-slate-800">
                  {{ reportType() === 'project' ? asProject(item).projectName : asTask(item).taskName }}
                </td>
                <td *ngIf="reportType() === 'task'" class="px-6 py-4 text-xs text-slate-500">
                  {{ asTask(item).projectName }}
                </td>
                <td class="px-6 py-4 text-sm font-mono font-bold text-slate-700 text-right">
                  {{ item.totalDurationSeconds | duration }}
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <div class="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div class="h-full bg-primary-500 rounded-full" [style.width.%]="grandTotal() > 0 ? (item.totalDurationSeconds / grandTotal() * 100) : 0"></div>
                    </div>
                    <span class="text-xs font-bold text-slate-500 w-8 text-right">
                      {{ grandTotal() > 0 ? (item.totalDurationSeconds / grandTotal() * 100 | number:'1.0-1') : 0 }}%
                    </span>
                  </div>
                </td>
              </tr>
              <tr *ngIf="currentTotals().length === 0">
                <td [attr.colspan]="reportType() === 'task' ? 4 : 3" class="px-6 py-12 text-center text-slate-400 text-sm">
                  Sem dados para o período selecionado.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Weekly Breakdown -->
        <div class="lg:col-span-2 card p-6 flex flex-col">
          <h3 class="font-bold text-slate-800 flex items-center gap-2 mb-6">
            <lucide-icon [name]="TrendingIcon" size="20" class="text-primary-600"></lucide-icon>
            Quebra Semanal
          </h3>
          <div class="flex-1 space-y-4">
            <div *ngFor="let week of weeklyData()" class="space-y-1">
              <div class="flex justify-between text-xs font-bold text-slate-600">
                <span>{{ week.week }}</span>
                <span class="font-mono">{{ week.totalSeconds | duration }}</span>
              </div>
              <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-primary-500 rounded-full transition-all duration-700"
                  [style.width.%]="weeklyMax() > 0 ? (week.totalSeconds / weeklyMax() * 100) : 0"
                ></div>
              </div>
            </div>
            <div *ngIf="weeklyData().length === 0" class="flex-1 flex items-center justify-center text-slate-300 py-12">
              <lucide-icon [name]="PieChartIcon" size="64" strokeWidth="1"></lucide-icon>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ReportsComponent implements OnInit {
  private reportService = inject(ReportService);
  private projectService = inject(ProjectService);

  from = new Date(new Date().setDate(1)).toISOString().split('T')[0];
  to = new Date().toISOString().split('T')[0];
  
  reportType = signal<'project' | 'task'>('project');
  projectReport = signal<FullProjectReport | null>(null);
  taskReport = signal<FullTaskReport | null>(null);
  
  projectNames = new Map<string, string>();
  taskNames = new Map<string, string>();

  readonly CalendarIcon = Calendar;
  readonly PieChartIcon = PieChart;
  readonly BarChartIcon = BarChart2;
  readonly TrendingIcon = TrendingUp;

  currentTotals = computed<(ProjectReport | TaskReport)[]>(() => {
    if (this.reportType() === 'project') return this.projectReport()?.totals ?? [];
    return this.taskReport()?.totals ?? [];
  });

  grandTotal = computed(() => {
    if (this.reportType() === 'project') return this.projectReport()?.grandTotalSeconds ?? 0;
    return this.taskReport()?.grandTotalSeconds ?? 0;
  });

  weeklyData = computed(() => {
    const report = this.reportType() === 'project' ? this.projectReport() : this.taskReport();
    if (!report) return [];
    // Aggregate all weeks (sum across projects/tasks per week)
    const weekMap = new Map<string, number>();
    for (const row of report.weekly as any[]) {
      const existing = weekMap.get(row.week) ?? 0;
      weekMap.set(row.week, existing + (row.totalSeconds ?? 0));
    }
    return Array.from(weekMap.entries())
      .map(([week, totalSeconds]) => ({ week, totalSeconds }))
      .sort((a, b) => a.week.localeCompare(b.week));
  });

  weeklyMax = computed(() => {
    const weeks = this.weeklyData();
    if (!weeks.length) return 1;
    return Math.max(...weeks.map(w => w.totalSeconds));
  });

  asProject(item: any): ProjectReport { return item; }
  asTask(item: any): TaskReport { return item; }

  ngOnInit() {
    // Load projects and tasks for name resolution
    this.projectService.getProjects().subscribe(projects => {
      this.projectNames = new Map(projects.map(p => [p.id, p.name]));
      this.projectService.getTasks().subscribe(tasks => {
        this.taskNames = new Map(tasks.map(t => [t.id, t.name]));
        this.loadReports();
      });
    });
  }

  loadReports() {
    this.reportService.getProjectReport(this.from, this.to, this.projectNames).subscribe(res => {
      this.projectReport.set(res);
    });
    this.reportService.getTaskReport(this.from, this.to, this.taskNames, this.projectNames).subscribe(res => {
      this.taskReport.set(res);
    });
  }
}
