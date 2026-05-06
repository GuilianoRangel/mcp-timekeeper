import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ShieldCheck, Search, Filter } from 'lucide-angular';
import { AuditService, AuditLog } from '../../../core/services/audit.service';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">Trilha de Auditoria</h2>
        <p class="text-slate-500">Histórico completo de ações realizadas no sistema (Apenas Admin).</p>
      </div>

      <div class="card p-4 flex flex-wrap items-center gap-4">
        <div class="relative flex-1 min-w-[200px]">
          <lucide-icon [name]="SearchIcon" size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></lucide-icon>
          <input type="text" class="input pl-10" placeholder="Buscar por ação ou entidade...">
        </div>
        <button class="btn-secondary flex items-center gap-2">
          <lucide-icon [name]="FilterIcon" size="18"></lucide-icon>
          <span>Filtros Avançados</span>
        </button>
      </div>

      <div class="card overflow-hidden">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200">
              <th class="px-6 py-4 font-bold text-slate-500">Data/Hora</th>
              <th class="px-6 py-4 font-bold text-slate-500">Ação</th>
              <th class="px-6 py-4 font-bold text-slate-500">Entidade</th>
              <th class="px-6 py-4 font-bold text-slate-500">Origem</th>
              <th class="px-6 py-4 font-bold text-slate-500">Usuário</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr *ngFor="let log of logs()" class="hover:bg-slate-50">
              <td class="px-6 py-4 whitespace-nowrap text-slate-600">{{ log.timestamp | date:'dd/MM/yyyy HH:mm:ss' }}</td>
              <td class="px-6 py-4">
                <span [ngClass]="getActionClass(log.action)" class="px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                  {{ log.action }}
                </span>
              </td>
              <td class="px-6 py-4 text-slate-800 font-medium">{{ log.entity }} ({{ log.entityId }})</td>
              <td class="px-6 py-4">
                <span class="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-500 uppercase font-semibold">{{ log.source }}</span>
              </td>
              <td class="px-6 py-4 text-slate-600">{{ log.actorId }}</td>
            </tr>
            <tr *ngIf="logs().length === 0">
              <td colspan="5" class="px-6 py-12 text-center text-slate-400">Nenhum log encontrado.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AuditLogComponent implements OnInit {
  private auditService = inject(AuditService);
  
  logs = signal<AuditLog[]>([]);

  readonly SearchIcon = Search;
  readonly FilterIcon = Filter;

  ngOnInit() {
    this.auditService.getLogs().subscribe(res => this.logs.set(res));
  }

  getActionClass(action: string) {
    if (action.includes('start') || action.includes('create')) return 'bg-emerald-100 text-emerald-700';
    if (action.includes('stop') || action.includes('delete')) return 'bg-rose-100 text-rose-700';
    return 'bg-amber-100 text-amber-700';
  }
}
