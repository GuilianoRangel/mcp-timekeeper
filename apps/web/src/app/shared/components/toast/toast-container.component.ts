import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { LucideAngularModule, CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-angular';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <div
        *ngFor="let toast of toastService.toasts; trackBy: trackById"
        class="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border min-w-[300px] max-w-sm animate-slide-in"
        [ngClass]="getClass(toast.type)"
      >
        <lucide-icon [name]="getIcon(toast.type)" size="20" class="shrink-0 mt-0.5"></lucide-icon>
        <p class="flex-1 text-sm font-medium leading-snug">{{ toast.message }}</p>
        <button (click)="toastService.dismiss(toast.id)" class="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
          <lucide-icon [name]="XIcon" size="16"></lucide-icon>
        </button>
      </div>
    </div>
  `
})
export class ToastContainerComponent {
  toastService = inject(ToastService);

  readonly XIcon = X;
  readonly CheckIcon = CheckCircle2;
  readonly ErrorIcon = XCircle;
  readonly WarnIcon = AlertTriangle;
  readonly InfoIcon = Info;

  trackById(_: number, t: any) { return t.id; }

  getIcon(type: string) {
    if (type === 'success') return CheckCircle2;
    if (type === 'error') return XCircle;
    if (type === 'warning') return AlertTriangle;
    return Info;
  }

  getClass(type: string) {
    if (type === 'success') return 'bg-emerald-50 border-emerald-200 text-emerald-800';
    if (type === 'error') return 'bg-red-50 border-red-200 text-red-800';
    if (type === 'warning') return 'bg-amber-50 border-amber-200 text-amber-800';
    return 'bg-blue-50 border-blue-200 text-blue-800';
  }
}
