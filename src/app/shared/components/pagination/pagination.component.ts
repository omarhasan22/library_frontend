import { Component, EventEmitter, Input, Output } from '@angular/core';
import { formatNumber } from '../../utils/arabic';

type PageItem = number | 'gap';

/**
 * Pagination: السابق · 1 … 5 6 [7] 8 9 … 189 · التالي, plus "صفحة 7 من 189" and an optional range
 * ("عرض 181–210 من 5,642"). On phones only the current page and the arrows are shown.
 * Same inputs/outputs as the previous component: [currentPage] [totalPages] (pageChange).
 */
@Component({
  selector: 'app-pagination',
  standalone: false,
  template: `
    <nav *ngIf="totalPages > 1 || (totalItems ?? 0) > 0" class="pager" [attr.aria-label]="label">
      <p *ngIf="rangeText" class="pager__range">{{ rangeText }}</p>
      <ul *ngIf="totalPages > 1" class="pager__list">
        <li>
          <button type="button" class="pager__btn pager__btn--step" [disabled]="currentPage <= 1"
                  (click)="go(currentPage - 1)" aria-label="الصفحة السابقة">
            <i class="fas fa-angle-right" aria-hidden="true"></i><span class="pager__step-text">السابق</span>
          </button>
        </li>
        <li *ngFor="let item of pages" class="pager__num">
          <span *ngIf="item === 'gap'" class="pager__gap" aria-hidden="true">…</span>
          <button *ngIf="item !== 'gap'" type="button" class="pager__btn"
                  [class.is-current]="item === currentPage"
                  [attr.aria-current]="item === currentPage ? 'page' : null"
                  [attr.aria-label]="'الصفحة ' + item"
                  (click)="go(item)">{{ item }}</button>
        </li>
        <li class="pager__compact" aria-hidden="true">صفحة {{ currentPage }} من {{ totalPages }}</li>
        <li>
          <button type="button" class="pager__btn pager__btn--step" [disabled]="currentPage >= totalPages"
                  (click)="go(currentPage + 1)" aria-label="الصفحة التالية">
            <span class="pager__step-text">التالي</span><i class="fas fa-angle-left" aria-hidden="true"></i>
          </button>
        </li>
      </ul>
    </nav>
  `,
  styles: [`
    .pager { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-top: 16px; }
    .pager__range { margin: 0; color: var(--ink-600); font-size: var(--fs-sm); font-variant-numeric: tabular-nums; }
    .pager__list { display: flex; align-items: center; gap: 4px; margin: 0; padding: 0; list-style: none; flex-wrap: wrap; }
    .pager__btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      min-width: 38px; height: 38px; padding: 0 10px;
      border: 1px solid var(--line-strong); border-radius: var(--radius-sm);
      background: var(--surface); color: var(--ink-900); font-variant-numeric: tabular-nums;
    }
    .pager__btn:hover:not(:disabled):not(.is-current) { background: var(--brand-50); border-color: var(--brand-200); }
    .pager__btn.is-current { background: var(--brand-600); border-color: var(--brand-600); color: #fff; font-weight: 600; }
    .pager__btn:disabled { color: var(--ink-500); background: var(--surface-page); border-color: var(--line); cursor: not-allowed; }
    .pager__gap { display: inline-block; min-width: 24px; text-align: center; color: var(--ink-500); }
    .pager__compact { display: none; padding: 0 8px; color: var(--ink-700); font-size: var(--fs-sm); }
    @media (max-width: 575.98px) {
      .pager { justify-content: center; }
      .pager__num { display: none; }
      .pager__compact { display: block; }
      .pager__range { width: 100%; text-align: center; }
    }
  `]
})
export class PaginationComponent {
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  /** Optional: enables "عرض 31–60 من 5,642". */
  @Input() totalItems?: number | null;
  @Input() pageSize?: number | null;
  @Input() label = 'التنقل بين الصفحات';
  /** Pages shown on each side of the current one. */
  @Input() siblings = 1;
  /** Kept for compatibility with older templates; the window is now derived from `siblings`. */
  @Input() maxVisiblePages = 5;

  @Output() pageChange = new EventEmitter<number>();

  get pages(): PageItem[] {
    const total = Math.max(0, this.totalPages);
    const current = Math.min(Math.max(1, this.currentPage), Math.max(1, total));
    const wanted = new Set<number>([1, total]);
    for (let p = current - this.siblings; p <= current + this.siblings; p++) {
      if (p >= 1 && p <= total) wanted.add(p);
    }
    const sorted = [...wanted].filter(p => p >= 1).sort((a, b) => a - b);
    const items: PageItem[] = [];
    sorted.forEach((p, i) => {
      if (i > 0) {
        const gap = p - sorted[i - 1];
        if (gap === 2) items.push(p - 1);       // fill a single hidden page instead of "…"
        else if (gap > 2) items.push('gap');
      }
      items.push(p);
    });
    return items;
  }

  get rangeText(): string | null {
    if (this.totalItems === null || this.totalItems === undefined || !this.pageSize) return null;
    if (this.totalItems === 0) return null;
    const from = (this.currentPage - 1) * this.pageSize + 1;
    const to = Math.min(this.currentPage * this.pageSize, this.totalItems);
    return `عرض ${formatNumber(from)}–${formatNumber(to)} من ${formatNumber(this.totalItems)}`;
  }

  go(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }
}
