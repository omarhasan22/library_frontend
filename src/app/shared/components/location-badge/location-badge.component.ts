import { Component, Input } from '@angular/core';
import { ToastService } from '../../services/toast.service';

export interface BookAddress {
  roomNumber?: string | number | null;
  wallNumber?: string | number | null;
  shelfNumber?: string | number | null;
  bookNumber?: string | number | null;
}

const PARTS: { key: keyof BookAddress; label: string }[] = [
  { key: 'roomNumber', label: 'الغرفة' },
  { key: 'wallNumber', label: 'الاستاند' },
  { key: 'shelfNumber', label: 'الرف' },
  { key: 'bookNumber', label: 'رقم الكتاب' }
];

/**
 * Where a book sits: الغرفة · الاستاند · الرف · رقم الكتاب.
 *   variant="code"   compact "3 · د · 1 · 12" for tables (full wording in title/aria-label)
 *   variant="inline" labelled one-liner for cards and lists
 *   variant="card"   four large cells + copy button, for the book page
 */
@Component({
  selector: 'app-location-badge',
  standalone: false,
  host: { '[class.is-card]': "variant === 'card'" },
  template: `
    <ng-container [ngSwitch]="variant">
      <span *ngSwitchCase="'code'" class="loc-code location" [attr.title]="spoken" [attr.aria-label]="'الموقع: ' + spoken">
        <ng-container *ngIf="hasAny; else none">
          <ng-container *ngFor="let p of parts; let last = last">
            <span class="loc-code__part">{{ p.value || '—' }}</span><span *ngIf="!last" class="loc-code__sep" aria-hidden="true">·</span>
          </ng-container>
        </ng-container>
      </span>

      <span *ngSwitchCase="'inline'" class="loc-inline location">
        <i class="fas fa-location-dot" aria-hidden="true"></i>
        <span *ngIf="hasAny; else none">{{ spoken }}</span>
      </span>

      <div *ngSwitchCase="'card'" class="loc-card">
        <div class="loc-card__grid" role="list">
          <div *ngFor="let p of parts" class="loc-card__cell" role="listitem">
            <span class="loc-card__label">{{ p.label }}</span>
            <span class="loc-card__value location">{{ p.value || '—' }}</span>
          </div>
        </div>
        <button *ngIf="hasAny" type="button" class="btn btn-sm btn-outline-primary loc-card__copy" (click)="copy()">
          <i class="fas fa-copy" aria-hidden="true"></i> نسخ الموقع
        </button>
      </div>
    </ng-container>
    <ng-template #none><span class="loc-none">غير محدد</span></ng-template>
  `,
  styles: [`
    :host { display: inline-block; max-width: 100%; }
    :host(.is-card) { display: block; }
    .loc-code {
      display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px;
      border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--surface-page);
      font-size: var(--fs-sm); font-weight: 600; color: var(--ink-700); white-space: nowrap;
    }
    .loc-code__sep { color: var(--ink-500); font-weight: 400; }
    .loc-inline { display: inline-flex; align-items: baseline; gap: 6px; color: var(--ink-700); font-size: var(--fs-sm); }
    .loc-inline i { color: var(--brand-600); }
    .loc-none { color: var(--ink-500); font-weight: 400; }
    .loc-card__grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
    .loc-card__cell {
      display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 12px 6px;
      border-radius: var(--radius-md); background: var(--brand-50); border: 1px solid var(--brand-100);
    }
    .loc-card__label { font-size: var(--fs-xs); color: var(--brand-800); font-weight: 500; text-align: center; }
    .loc-card__value { font-size: var(--fs-2xl); font-weight: 700; color: var(--brand-800); line-height: 1.2; }
    .loc-card__copy { margin-top: 12px; }
  `]
})
export class LocationBadgeComponent {
  @Input() address?: BookAddress | null;
  @Input() variant: 'code' | 'inline' | 'card' = 'code';

  constructor(private toast: ToastService) {}

  get parts(): { label: string; value: string }[] {
    return PARTS.map(p => ({ label: p.label, value: String(this.address?.[p.key] ?? '').trim() }));
  }

  get hasAny(): boolean {
    return this.parts.some(p => p.value);
  }

  /** "الغرفة 3، الاستاند د، الرف 1، رقم الكتاب 12" (missing parts are skipped). */
  get spoken(): string {
    if (!this.hasAny) return 'غير محدد';
    return this.parts.filter(p => p.value).map(p => `${p.label} ${p.value}`).join('، ');
  }

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.spoken);
      this.toast.success('تم نسخ الموقع');
    } catch {
      this.toast.error('تعذّر النسخ. انسخ الموقع يدوياً.');
    }
  }
}
