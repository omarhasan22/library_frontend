import { Component, ElementRef, ViewChild, effect } from '@angular/core';
import { ConfirmService } from '../../services/confirm.service';

/**
 * Renders ConfirmService requests in a native modal <dialog>: the browser blocks the page behind it,
 * traps focus and closes on Esc. Focus returns to the element that opened it.
 */
@Component({
  selector: 'app-confirm-host',
  standalone: false,
  template: `
    <dialog #dialog class="app-dialog" aria-labelledby="confirm-title" aria-describedby="confirm-message"
            (cancel)="onCancel($event)" (close)="onClose()">
      <ng-container *ngIf="confirm.request() as req">
        <div class="app-dialog__body">
          <span class="app-dialog__icon" [class.is-danger]="req.tone === 'danger'" aria-hidden="true">
            <i class="fas" [class.fa-triangle-exclamation]="req.tone === 'danger'" [class.fa-circle-question]="req.tone !== 'danger'"></i>
          </span>
          <div>
            <h2 id="confirm-title" class="app-dialog__title">{{ req.title }}</h2>
            <p id="confirm-message" class="app-dialog__message" *ngIf="req.message">{{ req.message }}</p>
          </div>
        </div>
        <div class="app-dialog__actions">
          <button type="button" class="btn" [class.btn-danger]="req.tone === 'danger'" [class.btn-primary]="req.tone !== 'danger'"
                  (click)="answer(true)">{{ req.confirmText }}</button>
          <button #cancelBtn type="button" class="btn btn-secondary" (click)="answer(false)">{{ req.cancelText }}</button>
        </div>
      </ng-container>
    </dialog>
  `,
  styles: [`
    .app-dialog {
      width: min(460px, calc(100vw - 32px));
      padding: 0;
      border: 1px solid var(--line);
      border-radius: var(--radius-lg);
      background: var(--surface);
      color: var(--ink-900);
      box-shadow: var(--shadow-2);
    }
    .app-dialog::backdrop { background: rgba(31, 35, 36, 0.45); }
    .app-dialog[open] { animation: dialog-in var(--dur) var(--ease); }
    .app-dialog__body { display: flex; gap: 14px; padding: 24px 24px 8px; }
    .app-dialog__icon {
      display: grid; place-items: center; flex: none; width: 40px; height: 40px; border-radius: 50%;
      background: var(--brand-50); color: var(--brand-700); font-size: 1.1rem;
    }
    .app-dialog__icon.is-danger { background: var(--danger-50); color: var(--danger-600); }
    .app-dialog__title { font-size: var(--fs-lg); margin: 6px 0 4px; }
    .app-dialog__message { margin: 0; color: var(--ink-600); }
    .app-dialog__actions { display: flex; gap: 8px; justify-content: flex-start; padding: 16px 24px 24px; padding-inline-start: 78px; }
    @media (max-width: 480px) {
      .app-dialog__actions { padding-inline-start: 24px; }
      .app-dialog__actions .btn { flex: 1; }
    }
    @keyframes dialog-in { from { opacity: 0; transform: scale(.97); } to { opacity: 1; transform: none; } }
  `]
})
export class ConfirmHostComponent {
  @ViewChild('dialog', { static: true }) dialogRef!: ElementRef<HTMLDialogElement>;
  @ViewChild('cancelBtn') cancelBtn?: ElementRef<HTMLButtonElement>;
  private opener: HTMLElement | null = null;
  private result = false;

  constructor(public confirm: ConfirmService) {
    effect(() => {
      const req = this.confirm.request();
      const dialog = this.dialogRef.nativeElement;
      if (req && !dialog.open) {
        this.opener = document.activeElement as HTMLElement | null;
        this.result = false;
        dialog.showModal();
        // Safer default: focus "cancel", so Enter never confirms a destructive action by accident.
        setTimeout(() => this.cancelBtn?.nativeElement.focus());
      } else if (!req && dialog.open) {
        dialog.close();
      }
    });
  }

  answer(ok: boolean): void {
    this.result = ok;
    this.dialogRef.nativeElement.close();
  }

  onCancel(event: Event): void {
    // Esc: treat as "cancel" (the dialog then fires close).
    this.result = false;
  }

  onClose(): void {
    this.confirm.settle(this.result);
    this.opener?.focus?.();
    this.opener = null;
  }
}
