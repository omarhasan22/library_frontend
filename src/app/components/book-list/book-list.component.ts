import { Component, ElementRef, HostListener, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';

import { BookPage, BookService } from '../../services/book.service';
import { Book } from '../../models/book.model';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { ConfirmService } from '../../shared/services/confirm.service';
import { Taxonomy, TaxonomyService, TaxSubject, EMPTY_TAXONOMY } from '../../shared/services/taxonomy.service';
import { joinNames, toLatinDigits } from '../../shared/utils/arabic';
import {
  ADVANCED_FIELDS, BookQuery, DEFAULT_QUERY, FilterRow, fieldLabel, hasFilters, parseBookQuery,
  resolveLegacy, resultKey, toApiArgs, toQueryParams, withChanges
} from '../../books/book-query';
import { ListReturnService } from '../../books/list-return.service';

interface Chip { label: string; remove: Partial<BookQuery>; }
interface OptionalColumn { key: string; label: string; }

const PAGE_SIZE = 30;
const COLUMNS_KEY = 'books.columns';

/**
 * /books — the catalogue. All state is in the URL (see book-query.ts): typing, filtering, sorting and
 * paging only navigate; one pipeline turns the URL into exactly one request.
 */
@Component({
  selector: 'app-book-list',
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.css']
})
export class BookListComponent implements OnInit, OnDestroy {
  readonly pageSize = PAGE_SIZE;
  chips: Chip[] = [];
  readonly advancedFields = ADVANCED_FIELDS;
  readonly optionalColumns: OptionalColumn[] = [
    { key: 'commentators', label: 'الشارح' },
    { key: 'muhashis', label: 'المحشي' },
    { key: 'editors', label: 'المحقق' },
    { key: 'caretakers', label: 'المعتني' },
    { key: 'publicationYear', label: 'سنة النشر' },
    { key: 'editionNumber', label: 'الطبعة' },
    { key: 'numberOfVolumes', label: 'الأجزاء' }
  ];

  query: BookQuery = { ...DEFAULT_QUERY, rows: [] };
  taxonomy: Taxonomy = EMPTY_TAXONOMY;
  books: Book[] = [];
  result: Omit<BookPage, 'books'> | null = null;
  loading = true;
  failed = false;
  exporting = false;
  isAdmin = false;

  // Form state (mirrors the URL; edited locally before being applied)
  qInput = '';
  shelfInput = '';
  advancedOpen = false;
  draftRows: FilterRow[] = [];
  columnsOpen = false;
  visibleExtra = new Set<string>();
  rooms: string[] = [];
  walls: string[] = [];
  highlightId: string | null = null;
  showBackToTop = false;

  private readonly typing$ = new Subject<string>();
  private readonly load$ = new Subject<BookQuery>();
  private lastKey = '';
  private wallsForRoom = '';
  private subs = new Subscription();

  constructor(
    private bookService: BookService,
    private authService: AuthService,
    private taxonomyService: TaxonomyService,
    private listReturn: ListReturnService,
    private router: Router,
    private route: ActivatedRoute,
    private zone: NgZone,
    private host: ElementRef<HTMLElement>,
    private toast: ToastService,
    private dialog: ConfirmService
  ) {}

  ngOnInit(): void {
    this.restoreColumns();
    // Filters used to be restored silently from here; the URL is now the only source of truth.
    try { localStorage.removeItem('bookSearchFilters'); localStorage.removeItem('lastViewedBookPage'); } catch {}

    this.subs.add(this.authService.currentUser$.subscribe(user => (this.isAdmin = user?.role === 'admin')));

    this.subs.add(this.taxonomyService.load().pipe(catchError(() => of(EMPTY_TAXONOMY)))
      .subscribe(tax => { this.taxonomy = tax; this.chips = this.buildChips(); }));

    this.subs.add(this.bookService.getUniqueRoomNumbers().pipe(catchError(() => of([] as string[])))
      .subscribe(rooms => (this.rooms = this.uniqueRooms(rooms))));

    // state -> exactly one request per distinct result set; newer requests cancel older ones
    this.subs.add(this.load$.pipe(
      tap(() => { this.loading = true; this.failed = false; }),
      switchMap(q => this.bookService.getBooks(toApiArgs(q), q.page, PAGE_SIZE).pipe(
        map(page => ({ page, ok: true })),
        catchError(() => of({ page: null as BookPage | null, ok: false }))
      ))
    ).subscribe(({ page, ok }) => {
      this.loading = false;
      if (!ok || !page) {
        this.failed = true;
        this.lastKey = ''; // allow "retry" with the same query
        return;
      }
      const { books, ...stats } = page;
      this.books = books || [];
      this.result = stats;
      this.restoreHighlight();
    }));

    // URL -> state (old link formats are converted, then the URL is rewritten once).
    // Subscribed after load$: queryParams emits synchronously, and that first query must not be lost.
    this.subs.add(this.route.queryParams.subscribe(params => {
      const parsed = parseBookQuery(params);
      if (parsed.isLegacy) {
        this.taxonomyService.load().pipe(catchError(() => of(EMPTY_TAXONOMY))).subscribe(tax => {
          const resolved = resolveLegacy(parsed.query, parsed.legacy, tax);
          this.router.navigate([], { relativeTo: this.route, queryParams: toQueryParams(resolved), replaceUrl: true });
        });
        return;
      }
      this.applyUrlState(parsed.query);
    }));

    // Typing: apply after a short pause, replacing the history entry (no back-button spam)
    this.subs.add(this.typing$.pipe(debounceTime(350), map(v => v.trim()), distinctUntilChanged())
      .subscribe(q => { if (q !== this.query.q) this.go({ q }, true); }));

    this.zone.runOutsideAngular(() => window.addEventListener('scroll', this.onScroll, { passive: true }));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    window.removeEventListener('scroll', this.onScroll);
  }

  // ---------- URL state ----------

  private applyUrlState(query: BookQuery): void {
    this.query = query;
    this.chips = this.buildChips();
    this.listReturn.rememberList(this.router.url);
    // Keep the form in sync, but never overwrite what the user is typing right now.
    const active = document.activeElement as HTMLElement | null;
    if (active?.id !== 'books-q') this.qInput = query.q;
    if (active?.id !== 'filter-shelf') this.shelfInput = query.shelf;
    if (!this.advancedOpen) this.draftRows = query.rows.map(r => ({ ...r }));
    if (query.rows.length && !this.advancedOpen && this.draftRows.length) this.advancedOpen = true;
    this.loadWalls(query.room);

    const key = resultKey(query);
    if (key !== this.lastKey) {
      this.lastKey = key;
      this.load$.next(query);
    }
  }

  /** Navigate to the query with `changes` applied (back to page 1 unless only page/view change). */
  go(changes: Partial<BookQuery>, replaceUrl = false): void {
    const next = withChanges(this.query, changes);
    this.router.navigate([], { relativeTo: this.route, queryParams: toQueryParams(next), replaceUrl });
  }

  retry(): void {
    this.lastKey = '';
    this.applyUrlState(this.query);
  }

  // ---------- Search & filters ----------

  onType(value: string): void {
    this.typing$.next(value);
  }

  submitSearch(event: Event): void {
    event.preventDefault();
    const q = this.qInput.trim();
    if (q !== this.query.q) this.go({ q });
  }

  clearSearch(input: HTMLInputElement): void {
    this.qInput = '';
    this.go({ q: '' });
    input.focus();
  }

  setCategory(id: string): void { this.go({ category: id }); }
  setSubject(id: string): void { this.go({ subject: id }); }
  setRoom(room: string): void { this.go({ room }); }
  setWall(wall: string): void { this.go({ wall }); }

  applyShelf(): void {
    const shelf = this.shelfInput.trim();
    if (shelf !== this.query.shelf) this.go({ shelf });
  }

  setSort(value: string): void {
    if (value === 'recent') this.go({ sort: 'recent', dir: 'desc' });
    else this.go({ sort: '', dir: value === 'loc-desc' ? 'desc' : 'asc' });
  }

  get sortValue(): string {
    return this.query.sort === 'recent' ? 'recent' : this.query.dir === 'desc' ? 'loc-desc' : 'loc-asc';
  }

  setView(view: 'table' | 'grid'): void { this.go({ view }); }

  onPageChange(page: number): void {
    this.go({ page });
    this.host.nativeElement.querySelector('#results')?.scrollIntoView({ block: 'start' });
  }

  toggleAdvanced(): void {
    this.advancedOpen = !this.advancedOpen;
    if (this.advancedOpen && !this.draftRows.length) this.draftRows = [{ field: 'title', value: '' }];
  }

  addRow(): void { this.draftRows = [...this.draftRows, { field: 'authors', value: '' }]; }

  removeRow(i: number): void {
    this.draftRows = this.draftRows.filter((_, idx) => idx !== i);
    if (this.query.rows.length) this.applyRows();
  }

  applyRows(event?: Event): void {
    event?.preventDefault();
    const rows = this.draftRows.map(r => ({ field: r.field, value: r.value.trim() })).filter(r => r.value);
    this.go({ rows });
  }

  clearAll(): void {
    this.qInput = '';
    this.shelfInput = '';
    this.draftRows = [];
    this.advancedOpen = false;
    this.router.navigate([], { relativeTo: this.route, queryParams: this.query.view === 'grid' ? { view: 'grid' } : {} });
  }

  get filtered(): boolean { return hasFilters(this.query); }

  get subjectsForCategory(): TaxSubject[] {
    const cat = this.taxonomy.categories.find(c => c._id === this.query.category);
    return cat ? cat.subjects : this.taxonomy.subjects;
  }

  /**
   * Recomputed only when the query or taxonomy changes. (A getter rebuilt the chip objects on every
   * change detection, so *ngFor replaced the buttons between mousedown and mouseup and clicks were lost.)
   */
  private buildChips(): Chip[] {
    const q = this.query;
    const chips: Chip[] = [];
    if (q.q) chips.push({ label: `«${q.q}»`, remove: { q: '' } });
    if (q.category) chips.push({ label: `القسم: ${this.categoryTitle(q.category)}`, remove: { category: '', subject: '' } });
    if (q.subject) chips.push({ label: `الموضوع: ${this.subjectTitle(q.subject)}`, remove: { subject: '' } });
    if (q.room) chips.push({ label: `الغرفة ${q.room}`, remove: { room: '', wall: '', shelf: '' } });
    if (q.wall) chips.push({ label: `الاستاند ${q.wall}`, remove: { wall: '' } });
    if (q.shelf) chips.push({ label: `الرف ${q.shelf}`, remove: { shelf: '' } });
    q.rows.forEach((row, i) => chips.push({
      label: `${fieldLabel(row.field)}: ${row.value}`,
      remove: { rows: q.rows.filter((_, idx) => idx !== i) }
    }));
    return chips;
  }

  removeChip(chip: Chip): void {
    if ('q' in chip.remove) this.qInput = '';
    if ('shelf' in chip.remove) this.shelfInput = '';
    if ('rows' in chip.remove) this.draftRows = (chip.remove.rows || []).map(r => ({ ...r }));
    this.go(chip.remove);
  }

  categoryTitle(id: string): string {
    return this.taxonomy.categories.find(c => c._id === id)?.title ?? 'قسم محدد';
  }

  subjectTitle(id: string): string {
    return this.taxonomy.subjects.find(s => s._id === id)?.title ?? 'موضوع محدد';
  }

  // ---------- Results ----------

  get totalPages(): number {
    return Math.max(1, Math.ceil((this.result?.filteredCount ?? 0) / PAGE_SIZE));
  }

  names(list: unknown): string { return joinNames(list, '—'); }

  rememberBook(id?: string): void {
    if (id) this.listReturn.rememberBook(id);
  }

  toggleColumn(key: string, on: boolean): void {
    on ? this.visibleExtra.add(key) : this.visibleExtra.delete(key);
    this.visibleExtra = new Set(this.visibleExtra);
    try { localStorage.setItem(COLUMNS_KEY, JSON.stringify([...this.visibleExtra])); } catch {}
  }

  get extraColumns(): OptionalColumn[] {
    return this.optionalColumns.filter(c => this.visibleExtra.has(c.key));
  }

  extraValue(book: any, key: string): string {
    const v = book?.[key];
    if (Array.isArray(v)) return joinNames(v, '—');
    return v === null || v === undefined || v === '' ? '—' : String(v);
  }

  async deleteBook(book: Book): Promise<void> {
    const ok = await this.dialog.ask({
      title: 'حذف هذا الكتاب؟',
      message: `«${book.title}» سيُحذف من الفهرس نهائياً، ولا يمكن التراجع عن ذلك.`,
      confirmText: 'حذف الكتاب',
      tone: 'danger'
    });
    if (!ok || !book._id) return;
    this.bookService.deleteBook(book._id).subscribe({
      next: () => {
        this.toast.success(`تم حذف «${book.title}»`);
        // Stay on this page unless it is now empty.
        const lastOnPage = this.books.length === 1 && this.query.page > 1;
        if (lastOnPage) this.go({ page: this.query.page - 1 });
        else this.retry();
      },
      error: err => this.toast.apiError(err, 'تعذّر حذف الكتاب. حاول مرة أخرى.')
    });
  }

  exportResults(): void {
    const args = toApiArgs(this.query);
    this.exporting = true;
    this.bookService.exportBooksToExcel(args.query, args.searchTerm, args.sortDirection).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `books_${new Date().toISOString().slice(0, 10)}.xlsx`;
        link.click();
        URL.revokeObjectURL(url);
        this.exporting = false;
        this.toast.success('تم تصدير النتائج إلى ملف Excel');
      },
      error: () => {
        this.exporting = false;
        this.toast.error('تعذّر تصدير النتائج. حاول مرة أخرى.');
      }
    });
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('books-q')?.focus({ preventScroll: true });
  }

  trackById = (_: number, b: Book) => b._id;
  trackByLabel = (_: number, c: Chip) => c.label;

  // pointerdown: iOS Safari sends no document click for taps on plain content.
  @HostListener('document:pointerdown', ['$event'])
  closeColumns(event: Event): void {
    if (!this.columnsOpen) return;
    const menu = this.host.nativeElement.querySelector('.columns-menu');
    if (menu && !menu.contains(event.target as Node)) this.columnsOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.columnsOpen = false;
  }

  // ---------- helpers ----------

  private loadWalls(room: string): void {
    if (room === this.wallsForRoom) return;
    this.wallsForRoom = room;
    this.walls = [];
    if (!room) return;
    this.bookService.getUniqueWallNumbers(room).pipe(catchError(() => of([] as string[])))
      .subscribe(walls => (this.walls = [...new Set(walls.filter(Boolean))]));
  }

  /** "11" and "١١" are the same room (the API matches both); show it once. */
  private uniqueRooms(rooms: string[]): string[] {
    const seen = new Map<string, string>();
    for (const r of rooms || []) {
      const value = String(r ?? '').trim();
      if (!value) continue;
      const key = toLatinDigits(value);
      if (!seen.has(key)) seen.set(key, key);
    }
    return [...seen.values()].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  }

  private restoreColumns(): void {
    try {
      const saved = JSON.parse(localStorage.getItem(COLUMNS_KEY) || '[]');
      if (Array.isArray(saved)) this.visibleExtra = new Set(saved.filter(k => this.optionalColumns.some(c => c.key === k)));
    } catch { /* ignore */ }
  }

  private restoreHighlight(): void {
    const id = this.listReturn.takeLastBook();
    if (!id || !this.books.some(b => b._id === id)) return;
    this.highlightId = id;
    setTimeout(() => {
      const el = document.getElementById('book-' + id);
      el?.scrollIntoView({ block: 'center' });
      setTimeout(() => (this.highlightId = null), 2500);
    });
  }


  private onScroll = (): void => {
    const show = window.scrollY > 900;
    if (show !== this.showBackToTop) this.zone.run(() => (this.showBackToTop = show));
  };
}
