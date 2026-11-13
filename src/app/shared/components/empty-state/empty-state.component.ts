import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * One component for "nothing here" moments:
 *   kind="empty"      nothing exists yet
 *   kind="no-results" a search/filter matched nothing (offer to clear it via the actions slot)
 *   kind="error"      loading failed (announced, with a retry button when (retry) is bound)
 */
@Component({
  selector: 'app-empty-state',
  standalone: false,
  template: `
    <div class="empty" [class.empty--compact]="compact" [attr.role]="kind === 'error' ? 'alert' : null">
      <span class="empty__icon" [class.is-error]="kind === 'error'" aria-hidden="true">
        <i class="fas" [ngClass]="iconClass"></i>
      </span>
      <h2 class="empty__title">{{ title || defaultTitle }}</h2>
      <p *ngIf="message || kind === 'error'" class="empty__message">{{ message || defaultMessage }}</p>
      <div class="empty__actions">
        <button *ngIf="kind === 'error' && retry.observed" type="button" class="btn btn-primary" (click)="retry.emit()">
          <i class="fas fa-rotate-right" aria-hidden="true"></i> إعادة المحاولة
        </button>
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 48px 16px; }
    .empty--compact { padding: 24px 16px; }
    .empty__icon {
      display: grid; place-items: center; width: 56px; height: 56px; margin-bottom: 14px; border-radius: 50%;
      background: var(--brand-50); color: var(--brand-600); font-size: 1.4rem;
    }
    .empty__icon.is-error { background: var(--danger-50); color: var(--danger-600); }
    .empty__title { font-size: var(--fs-lg); margin: 0 0 6px; }
    .empty__message { max-width: 46ch; margin: 0; color: var(--ink-600); }
    .empty__actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 16px; }
    .empty__actions:empty { display: none; }
  `]
})
export class EmptyStateComponent {
  @Input() kind: 'empty' | 'no-results' | 'error' = 'empty';
  @Input() title?: string;
  @Input() message?: string;
  @Input() icon?: string;
  @Input() compact = false;
  @Output() retry = new EventEmitter<void>();

  get iconClass(): string {
    if (this.icon) return this.icon;
    return { empty: 'fa-inbox', 'no-results': 'fa-magnifying-glass', error: 'fa-triangle-exclamation' }[this.kind];
  }

  get defaultTitle(): string {
    return { empty: 'لا توجد بيانات بعد', 'no-results': 'لا توجد نتائج', error: 'تعذّر تحميل البيانات' }[this.kind];
  }

  get defaultMessage(): string {
    return this.kind === 'error' ? 'تحقّق من الاتصال ثم أعد المحاولة.' : '';
  }
}
