import { Component, OnDestroy, effect } from '@angular/core';
import { Toast, ToastService } from '../../services/toast.service';

/** Renders toasts in a polite live region (errors are announced assertively). One instance, in AppComponent. */
@Component({
  selector: 'app-toast-host',
  standalone: false,
  template: `
    <div class="toast-region" aria-live="polite" aria-relevant="additions">
      <div *ngFor="let t of toasts.toasts(); trackBy: trackById"
           class="app-toast" [class]="'app-toast app-toast--' + t.tone"
           [attr.role]="t.tone === 'error' ? 'alert' : 'status'"
           (mouseenter)="pause(t)" (mouseleave)="resume(t)" (focusin)="pause(t)" (focusout)="resume(t)">
        <i class="fas app-toast__icon" aria-hidden="true"
           [class.fa-circle-check]="t.tone === 'success'"
           [class.fa-circle-exclamation]="t.tone === 'error'"
           [class.fa-circle-info]="t.tone === 'info'"></i>
        <p class="app-toast__msg">{{ t.message }}</p>
        <button *ngIf="t.actionLabel" type="button" class="app-toast__action" (click)="runAction(t)">{{ t.actionLabel }}</button>
        <button type="button" class="app-toast__close" (click)="toasts.dismiss(t.id)" aria-label="إغلاق التنبيه">
          <i class="fas fa-xmark" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-region {
      position: fixed;
      z-index: 1090;
      inset-inline: 16px;
      bottom: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      pointer-events: none;
    }
    @media (min-width: 768px) {
      /* Desktop: bottom of the reading-start side (right in RTL), away from the main content flow. */
      .toast-region { inset-inline-start: 24px; inset-inline-end: auto; bottom: 24px; align-items: flex-start; }
    }
    .app-toast {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      width: min(440px, 100%);
      padding: 12px 12px 12px 14px;
      border-radius: var(--radius-md);
      background: var(--ink-900);
      color: #fff;
      box-shadow: var(--shadow-2);
      animation: toast-in var(--dur) var(--ease);
    }
    .app-toast__icon { margin-top: 4px; font-size: 1.05rem; }
    .app-toast--success .app-toast__icon { color: #7ee2a1; }
    .app-toast--error { background: var(--danger-700); }
    .app-toast--error .app-toast__icon { color: #ffd2cc; }
    .app-toast--info .app-toast__icon { color: var(--brand-200); }
    .app-toast__msg { flex: 1; margin: 0; font-size: var(--fs-sm); line-height: 1.6; }
    .app-toast__action {
      border: 0; background: transparent; color: var(--brand-200); font-weight: 600;
      padding: 2px 6px; border-radius: var(--radius-sm); white-space: nowrap;
    }
    .app-toast__action:hover { background: rgba(255,255,255,.1); }
    .app-toast__close {
      display: grid; place-items: center; width: 28px; height: 28px; flex: none;
      border: 0; border-radius: 50%; background: transparent; color: rgba(255,255,255,.8);
    }
    .app-toast__close:hover { background: rgba(255,255,255,.12); color: #fff; }
    .app-toast :focus-visible { outline-color: #fff; }
    @keyframes toast-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  `]
})
export class ToastHostComponent implements OnDestroy {
  private timers = new Map<number, { handle: any; remaining: number; started: number }>();

  constructor(public toasts: ToastService) {
    // Start a timer for each new toast; drop timers of dismissed ones.
    effect(() => {
      const list = this.toasts.toasts();
      const ids = new Set(list.map(t => t.id));
      for (const t of list) if (!this.timers.has(t.id)) this.start(t, t.duration);
      for (const id of [...this.timers.keys()]) {
        if (!ids.has(id)) { clearTimeout(this.timers.get(id)!.handle); this.timers.delete(id); }
      }
    });
  }

  trackById = (_: number, t: Toast) => t.id;

  runAction(t: Toast): void {
    t.action?.();
    this.toasts.dismiss(t.id);
  }

  pause(t: Toast): void {
    const timer = this.timers.get(t.id);
    if (!timer || timer.handle === null) return;
    clearTimeout(timer.handle);
    timer.remaining -= Date.now() - timer.started;
    timer.handle = null;
  }

  resume(t: Toast): void {
    const timer = this.timers.get(t.id);
    if (!timer || timer.handle !== null) return;
    this.start(t, Math.max(1500, timer.remaining));
  }

  private start(t: Toast, ms: number): void {
    const handle = setTimeout(() => this.toasts.dismiss(t.id), ms);
    this.timers.set(t.id, { handle, remaining: ms, started: Date.now() });
  }

  ngOnDestroy(): void {
    this.timers.forEach(t => clearTimeout(t.handle));
  }
}
