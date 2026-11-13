import { Component } from '@angular/core';
import { Router } from '@angular/router';

/** Shown for unknown URLs instead of silently redirecting home. */
@Component({
  selector: 'app-not-found',
  standalone: false,
  template: `
    <div class="app-container page">
      <div class="nf surface surface-pad">
        <span class="nf__code" aria-hidden="true">404</span>
        <h1 class="nf__title">الصفحة غير موجودة</h1>
        <p class="nf__text">ربما تغيّر الرابط أو حُذفت الصفحة. ابحث عن الكتاب الذي تريده أو عد إلى الرئيسية.</p>
        <form class="nf__search" role="search" (submit)="search($event)">
          <label for="nf-q" class="visually-hidden">ابحث في الكتب</label>
          <input id="nf-q" name="q" type="search" class="form-control" placeholder="عنوان، مؤلف، ناشر…" [(ngModel)]="q">
          <button type="submit" class="btn btn-primary"><i class="fas fa-magnifying-glass" aria-hidden="true"></i> بحث</button>
        </form>
        <div class="nf__links">
          <a routerLink="/" class="btn btn-secondary">الرئيسية</a>
          <a routerLink="/books" class="btn btn-secondary">جميع الكتب</a>
          <a routerLink="/categories" class="btn btn-secondary">أقسام المكتبة</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .nf { max-width: 640px; margin: 24px auto; text-align: center; padding-block: 40px; }
    .nf__code { display: block; font-size: 4rem; font-weight: 700; line-height: 1; color: var(--brand-500); }
    .nf__title { font-size: var(--fs-2xl); margin: 12px 0 8px; }
    .nf__text { color: var(--ink-600); margin: 0 auto 20px; max-width: 46ch; }
    .nf__search { display: flex; gap: 8px; max-width: 460px; margin: 0 auto 16px; }
    .nf__links { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
  `]
})
export class NotFoundComponent {
  q = '';

  constructor(private router: Router) {}

  search(event: Event): void {
    event.preventDefault();
    const q = this.q.trim();
    this.router.navigate(['/books'], q ? { queryParams: { q } } : {});
  }
}
