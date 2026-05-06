import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private counter = 0;
  private toastSubject = new Subject<Toast>();
  
  toasts: Toast[] = [];

  show(message: string, type: Toast['type'] = 'info', durationMs = 4000) {
    const id = ++this.counter;
    const toast: Toast = { id, message, type };
    this.toasts.push(toast);
    
    setTimeout(() => this.dismiss(id), durationMs);
  }

  success(message: string) { this.show(message, 'success'); }
  error(message: string) { this.show(message, 'error', 5000); }
  warning(message: string) { this.show(message, 'warning'); }
  info(message: string) { this.show(message, 'info'); }

  dismiss(id: number) {
    const idx = this.toasts.findIndex(t => t.id === id);
    if (idx > -1) this.toasts.splice(idx, 1);
  }
}
