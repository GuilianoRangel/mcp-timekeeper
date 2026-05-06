import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  LucideAngularModule, 
  Plus, 
  Trash2, 
  Key, 
  Copy, 
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon
} from 'lucide-angular';
import { ApiKeyService, ApiKey, CreatedApiKey } from '../../../core/services/api-key.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-api-keys',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">Chaves de API</h2>
          <p class="text-slate-500">Gerencie suas chaves para acesso via MCP</p>
        </div>
        <button (click)="showForm = true" class="btn-primary px-6 py-2 flex items-center gap-2">
          <lucide-icon [name]="PlusIcon" size="20"></lucide-icon>
          Gerar Nova Chave
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
          {{ showInactive() ? 'Ocultar Revogadas' : 'Ver Revogadas' }}
        </button>
      </div>

      <!-- Success Alert for New Key (CRITICAL) -->
      <div *ngIf="newKey()" class="card p-6 border-emerald-200 bg-emerald-50 animate-bounce-subtle">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <lucide-icon [name]="CheckCircleIcon" size="24"></lucide-icon>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-bold text-emerald-900 mb-1">Chave gerada com sucesso!</h3>
            <p class="text-emerald-700 text-sm mb-4 font-medium">
              ⚠️ IMPORTANTE: Copie sua chave agora. Por segurança, ela não será exibida novamente.
            </p>
            <div class="flex items-center gap-2 bg-white p-3 rounded-xl border border-emerald-100 shadow-inner">
              <code class="flex-1 font-mono text-sm text-slate-800 break-all bg-slate-50 p-2 rounded">
                {{ newKey()?.rawKey }}
              </code>
              <button 
                (click)="copyToClipboard(newKey()?.rawKey || '')"
                class="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors shrink-0"
                title="Copiar Chave"
              >
                <lucide-icon [name]="CopyIcon" size="20"></lucide-icon>
              </button>
            </div>
            <button 
              (click)="clearNewKey()" 
              class="mt-4 text-emerald-700 text-sm font-bold hover:underline"
            >
              Eu salvei a chave, fechar este aviso
            </button>
          </div>
        </div>
      </div>

      <!-- New Key Form -->
      <div *ngIf="showForm && !newKey()" class="card p-6 border-primary-100 bg-primary-50/10 animate-slide-in">
        <h3 class="text-lg font-bold text-slate-800 mb-4">Nova Chave de API</h3>
        <form (ngSubmit)="generateKey()" class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Identificador (Label)</label>
            <input 
              type="text" 
              [(ngModel)]="label" 
              name="label" 
              required 
              class="input" 
              placeholder="Ex: Cursor Desktop, Open WebUI Home"
            >
            <p class="text-xs text-slate-500 mt-1">Um nome para você identificar onde esta chave está sendo usada.</p>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button 
              type="button" 
              (click)="showForm = false" 
              class="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button type="submit" class="btn-primary px-6 py-2">
              Gerar Chave
            </button>
          </div>
        </form>
      </div>

      <!-- Keys List -->
      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Identificador</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Criada em</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Último uso</th>
                <th class="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let key of apiKeys()" class="hover:bg-slate-50/50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                      <lucide-icon [name]="KeyIcon" size="16"></lucide-icon>
                    </div>
                    <div>
                      <p class="font-bold text-slate-800">{{ key.label || 'Sem rótulo' }}</p>
                      <p class="text-xs text-slate-400 font-mono">ID: {{ key.id }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span [class]="'px-2 py-1 rounded-full text-xs font-bold ' + (key.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')">
                    {{ key.isActive ? 'Ativa' : 'Revogada' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-slate-600">
                  {{ key.createdAt | date:'short' }}
                </td>
                <td class="px-6 py-4 text-sm text-slate-600">
                  <div class="flex items-center gap-1.5" *ngIf="key.lastUsedAt">
                    <lucide-icon [name]="ClockIcon" size="14"></lucide-icon>
                    {{ key.lastUsedAt | date:'short' }}
                  </div>
                  <span *ngIf="!key.lastUsedAt" class="text-slate-400 italic">Nunca usada</span>
                </td>
                <td class="px-6 py-4 text-right min-w-[80px]">
                  <button 
                    *ngIf="key.isActive"
                    (click)="revokeKey(key)" 
                    class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="Revogar Chave"
                  >
                    <lucide-icon [name]="Trash2Icon" size="18"></lucide-icon>
                  </button>
                  <span *ngIf="!key.isActive" class="text-xs text-slate-400 italic">Revogada</span>
                </td>
              </tr>
              <tr *ngIf="apiKeys().length === 0">
                <td colspan="5" class="px-6 py-12 text-center text-slate-400">
                  <lucide-icon [name]="KeyIcon" size="48" class="mx-auto mb-4 opacity-20"></lucide-icon>
                  <p>Você ainda não possui chaves de API.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Info Card -->
      <div class="card p-6 border-blue-100 bg-blue-50/50">
        <div class="flex gap-4">
          <lucide-icon [name]="AlertCircleIcon" size="24" class="text-blue-600 shrink-0"></lucide-icon>
          <div class="text-sm text-blue-800">
            <h4 class="font-bold mb-1">Como usar suas chaves</h4>
            <p>As chaves de API permitem que ferramentas como Cursor, Claude Desktop e outros clientes MCP acessem seus dados do TimeKeeper de forma segura. Adicione o cabeçalho <code class="bg-blue-100 px-1 rounded font-bold">x-api-key</code> em suas requisições HTTP para o servidor MCP.</p>
          </div>
        </div>
      </div>
      <!-- Revoke Confirmation Modal -->
      <div *ngIf="keyToRevoke" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
        <div class="card max-w-md w-full p-6 shadow-2xl animate-zoom-in">
          <div class="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4 mx-auto">
            <lucide-icon [name]="AlertCircleIcon" size="24"></lucide-icon>
          </div>
          <h3 class="text-xl font-bold text-slate-900 text-center mb-2">Revogar Chave?</h3>
          <p class="text-slate-500 text-center mb-6">
            Tem certeza que deseja revogar a chave <strong>"{{ keyToRevoke.label }}"</strong>? 
            Esta ação é irreversível e o acesso será perdido imediatamente.
          </p>
          <div class="flex flex-col gap-3">
            <button 
              (click)="confirmRevoke()" 
              class="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-600/20"
            >
              Sim, Revogar Acesso
            </button>
            <button 
              (click)="keyToRevoke = null" 
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
export class ApiKeysComponent implements OnInit {
  private apiKeyService = inject(ApiKeyService);
  private toastService = inject(ToastService);

  apiKeys = signal<ApiKey[]>([]);
  showForm = false;
  label = '';
  newKey = signal<CreatedApiKey | null>(null);
  keyToRevoke: ApiKey | null = null;
  showInactive = signal(false);

  readonly PlusIcon = Plus;
  readonly Trash2Icon = Trash2;
  readonly KeyIcon = Key;
  readonly CopyIcon = Copy;
  readonly CheckCircleIcon = CheckCircle;
  readonly AlertCircleIcon = AlertCircle;
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;
  readonly ClockIcon = Clock;

  ngOnInit() {
    this.loadKeys();
  }

  loadKeys() {
    this.apiKeyService.list(this.showInactive()).subscribe(keys => this.apiKeys.set(keys));
  }

  toggleShowInactive() {
    this.showInactive.set(!this.showInactive());
    this.loadKeys();
  }

  generateKey() {
    if (!this.label.trim()) {
      this.toastService.error('O identificador é obrigatório.');
      return;
    }

    this.apiKeyService.create(this.label).subscribe({
      next: (key) => {
        this.newKey.set(key);
        this.label = '';
        this.showForm = false;
        this.loadKeys();
        this.toastService.success('Chave de API gerada com sucesso!');
      },
      error: (err) => this.toastService.error(err?.error?.message || 'Erro ao gerar chave de API.')
    });
  }

  revokeKey(key: ApiKey) {
    this.keyToRevoke = key;
  }

  confirmRevoke() {
    if (!this.keyToRevoke) return;

    this.apiKeyService.revoke(this.keyToRevoke.id).subscribe({
      next: () => {
        this.toastService.success('Chave revogada com sucesso.');
        this.keyToRevoke = null;
        this.loadKeys();
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Erro ao revogar chave.');
        this.keyToRevoke = null;
      }
    });
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.toastService.success('Copiado para a área de transferência!');
    });
  }

  clearNewKey() {
    this.newKey.set(null);
  }
}
