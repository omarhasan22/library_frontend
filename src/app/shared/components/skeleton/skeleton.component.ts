import { Component, Input } from '@angular/core';

/**
 * Placeholder shapes shown while content loads, so the layout doesn't jump when data arrives.
 *   <app-skeleton variant="lines" [count]="3">   text lines
 *   <app-skeleton variant="rows" [count]="8">    list/table rows
 *   <app-skeleton variant="cards" [count]="6">   card grid
 */
@Component({
  selector: 'app-skeleton',
  standalone: false,
  template: `
    <div class="sk" [ngClass]="'sk--' + variant" role="status" aria-live="polite">
      <span class="visually-hidden">{{ label }}</span>
      <ng-container *ngFor="let i of items">
        <div *ngIf="variant === 'lines'" class="sk-bar" [style.width.%]="i % 3 === 2 ? 60 : 100"></div>
        <div *ngIf="variant === 'rows'" class="sk-row">
          <div class="sk-bar sk-bar--title"></div>
          <div class="sk-bar sk-bar--meta"></div>
        </div>
        <div *ngIf="variant === 'cards'" class="sk-card">
          <div class="sk-bar sk-bar--title"></div>
          <div class="sk-bar"></div>
          <div class="sk-bar sk-bar--meta"></div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .sk { display: flex; flex-direction: column; gap: 12px; }
    .sk--cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
    .sk--rows { gap: 0; }
    .sk-row { display: flex; flex-direction: column; gap: 8px; padding: 14px 16px; border-bottom: 1px solid var(--line); }
    .sk-card { display: flex; flex-direction: column; gap: 10px; padding: 16px; border: 1px solid var(--line); border-radius: var(--radius-md); background: var(--surface); }
    .sk-bar {
      height: 12px; border-radius: 6px;
      background: linear-gradient(90deg, var(--surface-sunken) 25%, var(--line) 37%, var(--surface-sunken) 63%);
      background-size: 400% 100%;
      animation: sk-shimmer 1.4s ease infinite;
    }
    .sk-bar--title { height: 14px; width: 55%; }
    .sk-bar--meta { width: 30%; }
    @keyframes sk-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }
  `]
})
export class SkeletonComponent {
  @Input() variant: 'lines' | 'rows' | 'cards' = 'lines';
  @Input() count = 3;
  @Input() label = 'جارٍ التحميل…';

  get items(): number[] {
    return Array.from({ length: this.count }, (_, i) => i);
  }
}
