import { Component, Input } from '@angular/core';

/** A number with a label, e.g. "5,642 / كتاب في المكتبة". Not interactive unless wrapped in a link. */
@Component({
  selector: 'app-stat-tile',
  standalone: false,
  template: `
    <div class="stat" [class.stat--plain]="plain">
      <span *ngIf="icon" class="stat__icon" aria-hidden="true"><i class="fas" [ngClass]="icon"></i></span>
      <div class="stat__text">
        <span class="stat-value">{{ value === null || value === undefined ? '—' : (value | num) }}</span>
        <span class="stat__label">{{ label }}</span>
      </div>
    </div>
  `,
  styles: [`
    .stat {
      display: flex; align-items: center; gap: 12px; height: 100%;
      padding: 14px 16px; border: 1px solid var(--line); border-radius: var(--radius-md); background: var(--surface);
    }
    .stat--plain { border: 0; padding: 0; background: transparent; }
    .stat__icon {
      display: grid; place-items: center; flex: none; width: 40px; height: 40px; border-radius: var(--radius-sm);
      background: var(--brand-50); color: var(--brand-600);
    }
    .stat__text { display: flex; flex-direction: column; min-width: 0; }
    .stat-value { font-size: var(--fs-xl); font-weight: 700; line-height: 1.2; color: var(--ink-900); }
    .stat__label { font-size: var(--fs-sm); color: var(--ink-600); }
  `]
})
export class StatTileComponent {
  @Input() label = '';
  @Input() value: number | null | undefined;
  @Input() icon?: string;
  @Input() plain = false;
}
