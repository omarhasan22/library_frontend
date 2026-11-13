import { Component, Input } from '@angular/core';

export interface Crumb {
  label: string;
  link?: any[] | string;
  queryParams?: Record<string, any>;
}

/**
 * Standard page header: optional breadcrumb, title (the page's single h1), subtitle, and an actions slot.
 *   <app-page-header title="الكتب" [subtitle]="..." [crumbs]="[{label:'الرئيسية', link:'/'}]">
 *     <a actions class="btn btn-primary" routerLink="/add-book">إضافة كتاب</a>
 *   </app-page-header>
 */
@Component({
  selector: 'app-page-header',
  standalone: false,
  template: `
    <header class="page-header">
      <nav *ngIf="crumbs?.length" class="page-header__crumbs" aria-label="مسار التنقل">
        <ol>
          <li *ngFor="let c of crumbs; let last = last">
            <a *ngIf="c.link && !last; else plain" [routerLink]="c.link" [queryParams]="c.queryParams">{{ c.label }}</a>
            <ng-template #plain><span [attr.aria-current]="last ? 'page' : null">{{ c.label }}</span></ng-template>
          </li>
        </ol>
      </nav>
      <div class="page-header__row">
        <div class="page-header__text">
          <h1 class="page-header__title">
            <ng-content select="[titlePrefix]"></ng-content>{{ title }}
          </h1>
          <p *ngIf="subtitle" class="page-header__subtitle">{{ subtitle }}</p>
          <ng-content select="[subtitle]"></ng-content>
        </div>
        <div class="page-header__actions">
          <ng-content select="[actions]"></ng-content>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .page-header__crumbs ol {
      display: flex; flex-wrap: wrap; gap: 4px; margin: 0 0 8px; padding: 0; list-style: none;
      font-size: var(--fs-sm); color: var(--ink-600);
    }
    .page-header__crumbs li:not(:last-child)::after {
      content: '\\203A'; /* › — mirrors correctly in RTL text */
      margin-inline-start: 6px; color: var(--ink-500);
    }
    .page-header__crumbs a { color: var(--ink-600); }
    .page-header__crumbs a:hover { color: var(--brand-700); }
    .page-header__crumbs span[aria-current] {
      color: var(--ink-700); display: inline-block; max-width: 40ch;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: bottom;
    }
    .page-header__row { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px 24px; }
    .page-header__text { min-width: 0; flex: 1 1 320px; }
    .page-header__title { font-size: var(--fs-2xl); margin: 0; }
    @media (max-width: 575.98px) { .page-header__title { font-size: var(--fs-xl); } }
    .page-header__subtitle, ::ng-deep [subtitle] { margin: 6px 0 0; color: var(--ink-600); }
    .page-header__actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .page-header__actions:empty { display: none; }
  `]
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle?: string | null;
  @Input() crumbs?: Crumb[] | null;
}
