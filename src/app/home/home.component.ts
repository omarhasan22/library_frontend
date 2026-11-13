import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { BookService, LocationSummary } from '../services/book.service';
import { AuthService } from '../services/auth.service';
import { Book } from '../models/book.model';
import { TaxCategory, TaxonomyService } from '../shared/services/taxonomy.service';
import { joinNames } from '../shared/utils/arabic';
import { ListReturnService } from '../books/list-return.service';

type Load<T> = { state: 'loading' } | { state: 'ok'; data: T } | { state: 'error' };

interface RoomTile {
  room: string;
  count: number;
  share: number; // 0..100 of the largest room, for the bar
  walls: { wall: string; count: number }[];
}

/**
 * Home — the library portal: search first, then the library map (rooms and stands), the sections
 * (الأقسام) with real book counts, recent additions, and a short "how to find a book" guide.
 * Each section loads on its own, so one slow or failing request never blanks the whole page.
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  query = '';
  isAdmin = false;

  stats: Load<{ totalBooks: number; totalAuthors: number }> = { state: 'loading' };
  categories: Load<TaxCategory[]> = { state: 'loading' };
  rooms: Load<{ tiles: RoomTile[]; unassigned: number }> = { state: 'loading' };
  recent: Load<Book[]> = { state: 'loading' };

  readonly adminActions = [
    { path: '/add-book', label: 'إضافة كتاب', hint: 'فهرسة كتاب جديد', icon: 'fa-plus' },
    { path: '/bulk-update', label: 'التحديث الجماعي', hint: 'تعديل قسم أو موضوع رفٍّ كامل', icon: 'fa-pen-to-square' },
    { path: '/exports', label: 'التصدير', hint: 'ملفات Excel للفهرس والمواقع', icon: 'fa-file-export' },
    { path: '/admin/display', label: 'شاشة العرض', hint: 'شرائح شاشة المكتبة', icon: 'fa-tv' }
  ];

  private subs = new Subscription();

  constructor(
    private bookService: BookService,
    private taxonomyService: TaxonomyService,
    private authService: AuthService,
    private listReturn: ListReturnService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subs.add(this.authService.currentUser$.subscribe(user => (this.isAdmin = user?.role === 'admin')));
    this.loadStats();
    this.loadCategories();
    this.loadRooms();
    this.loadRecent();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // ---------- data ----------

  loadStats(): void {
    this.stats = { state: 'loading' };
    this.bookService.getStatistics().pipe(catchError(() => of(null))).subscribe(s => {
      this.stats = s ? { state: 'ok', data: { totalBooks: s.totalBooks, totalAuthors: s.totalAuthors } } : { state: 'error' };
    });
  }

  loadCategories(): void {
    this.categories = { state: 'loading' };
    this.taxonomyService.load().pipe(catchError(() => of(null))).subscribe(tax => {
      if (!tax) { this.categories = { state: 'error' }; return; }
      // Home shows the sections that hold books (all of them when the API has no counts);
      // the categories page lists every section.
      const list = [...tax.categories]
        .filter(c => c.booksCount === undefined || c.booksCount > 0)
        .sort((a, b) => (b.booksCount ?? 0) - (a.booksCount ?? 0));
      this.categories = { state: 'ok', data: list };
    });
  }

  loadRooms(): void {
    this.rooms = { state: 'loading' };
    this.bookService.getLocationSummary().pipe(catchError(() => of(null as LocationSummary | null))).subscribe(summary => {
      if (!summary) { this.rooms = { state: 'error' }; return; }
      const max = Math.max(1, ...summary.rooms.map(r => r.count));
      const tiles = summary.rooms.map(r => ({ ...r, share: Math.max(4, Math.round((r.count / max) * 100)) }));
      this.rooms = { state: 'ok', data: { tiles, unassigned: summary.unassigned } };
    });
  }

  loadRecent(): void {
    this.recent = { state: 'loading' };
    this.bookService.getRecentBooks(6).pipe(catchError(() => of(null as Book[] | null))).subscribe(books => {
      this.recent = books ? { state: 'ok', data: books } : { state: 'error' };
    });
  }

  // ---------- view helpers ----------

  /** The four largest sections, as quick suggestions under the search box. */
  get suggestions(): TaxCategory[] {
    return this.categories.state === 'ok' ? this.categories.data.filter(c => (c.booksCount ?? 1) > 0).slice(0, 4) : [];
  }

  get categoryCount(): number | null {
    return this.categories.state === 'ok' ? this.categories.data.length : null;
  }

  /** "ركن الفقه الإسلامي" -> { eyebrow: 'ركن', name: 'الفقه الإسلامي' } so the distinctive part leads. */
  splitTitle(title: string): { eyebrow: string; name: string } {
    const m = /^(الركن|ركن)\s+(.+)$/.exec(title.trim());
    return m ? { eyebrow: m[1], name: m[2] } : { eyebrow: '', name: title };
  }

  topSubjects(category: TaxCategory): string {
    return category.subjects.filter(s => (s.booksCount ?? 1) > 0).slice(0, 3).map(s => s.title).join('، ');
  }

  names(list: unknown): string {
    return joinNames(list, '');
  }

  rememberBook(id?: string): void {
    if (id) this.listReturn.rememberBook(id);
  }

  search(event: Event): void {
    event.preventDefault();
    const q = this.query.trim();
    this.router.navigate(['/books'], q ? { queryParams: { q } } : {});
  }

  trackById = (_: number, item: { _id?: string }) => item._id;
  trackByRoom = (_: number, item: RoomTile) => item.room;
}
