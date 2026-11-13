import { Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
  /** Optional single action, e.g. "تراجع" (undo). */
  actionLabel?: string;
  action?: () => void;
  duration: number;
}

/**
 * Non-blocking feedback for the result of an action (replaces alert()).
 * Validation errors belong next to the field, not in a toast.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  readonly toasts = signal<Toast[]>([]);

  success(message: string, opts: Partial<Omit<Toast, 'id' | 'tone' | 'message'>> = {}): number {
    return this.show('success', message, { duration: 4500, ...opts });
  }

  error(message: string, opts: Partial<Omit<Toast, 'id' | 'tone' | 'message'>> = {}): number {
    return this.show('error', message, { duration: 8000, ...opts });
  }

  info(message: string, opts: Partial<Omit<Toast, 'id' | 'tone' | 'message'>> = {}): number {
    return this.show('info', message, { duration: 5000, ...opts });
  }

  /** Shows the API's own message when there is one, otherwise the fallback. */
  apiError(err: any, fallback: string): number {
    const serverMessage = err?.error?.error || err?.error?.message;
    // Server messages are often English; only show them when they are Arabic.
    const useServer = typeof serverMessage === 'string' && /[؀-ۿ]/.test(serverMessage);
    return this.error(useServer ? serverMessage : fallback);
  }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  private show(tone: ToastTone, message: string, opts: Partial<Toast>): number {
    const toast: Toast = { id: this.nextId++, tone, message, duration: 5000, ...opts } as Toast;
    // Keep at most 3 on screen; the newest wins.
    this.toasts.update(list => [...list.slice(-2), toast]);
    return toast.id;
  }
}
