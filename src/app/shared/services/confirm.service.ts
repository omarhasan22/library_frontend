import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  /** 'danger' for destructive actions (red confirm button). */
  tone?: 'danger' | 'primary';
}

export interface ConfirmRequest extends Required<Omit<ConfirmOptions, 'message'>> {
  message?: string;
  resolve: (ok: boolean) => void;
}

/**
 * Accessible replacement for window.confirm(): a modal <dialog> rendered by ConfirmHostComponent.
 *   if (await this.confirm.ask({ title: 'حذف الكتاب؟', tone: 'danger', confirmText: 'حذف' })) { ... }
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly request = signal<ConfirmRequest | null>(null);

  ask(options: ConfirmOptions): Promise<boolean> {
    // A second request while one is open cancels the first.
    this.request()?.resolve(false);
    return new Promise<boolean>(resolve => {
      this.request.set({
        title: options.title,
        message: options.message,
        confirmText: options.confirmText ?? 'تأكيد',
        cancelText: options.cancelText ?? 'إلغاء',
        tone: options.tone ?? 'primary',
        resolve
      });
    });
  }

  /** Called by the host when the dialog closes. */
  settle(ok: boolean): void {
    const current = this.request();
    if (!current) return;
    this.request.set(null);
    current.resolve(ok);
  }
}
