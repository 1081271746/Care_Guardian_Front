import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  kind: 'success' | 'error' | 'info';
  text: string;
}

/** Short confirmations after an action ("Medicamento registrado"). */
@Injectable({ providedIn: 'root' })
export class Notifier {
  readonly toasts = signal<Toast[]>([]);
  private next = 1;

  success(text: string): void { this.push('success', text); }
  error(text: string): void { this.push('error', text, 7000); }
  info(text: string): void { this.push('info', text); }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(toast => toast.id !== id));
  }

  private push(kind: Toast['kind'], text: string, ttl = 4000): void {
    const id = this.next++;
    this.toasts.update(list => [...list.slice(-3), { id, kind, text }]);
    if (typeof window !== 'undefined') window.setTimeout(() => this.dismiss(id), ttl);
  }
}
