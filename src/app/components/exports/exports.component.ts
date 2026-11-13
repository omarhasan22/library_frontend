import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { BookService, LocationSummary } from '../../services/book.service';
import { ToastService } from '../../shared/services/toast.service';
import { TaxonomyService, EMPTY_TAXONOMY, Taxonomy } from '../../shared/services/taxonomy.service';
import { ApiArgs, BookQuery, DEFAULT_QUERY, fieldLabel, hasFilters, parseBookQuery, toApiArgs } from '../../books/book-query';
import { ListReturnService } from '../../books/list-return.service';

type Scope = 'all' | 'search';

/**
 * /exports — Excel files: the full catalogue, or one room's shelf list (for labels and stock-taking).
 * Each export can cover everything or the last search made on /books, and shows how many books it
 * will contain before downloading.
 */
@Component({
  selector: 'app-exports',
  templateUrl: './exports.component.html',
  styleUrls: ['./exports.component.css']
})
export class ExportsComponent implements OnInit {
  scope: Scope = 'all';
  lastSearch: BookQuery | null = null;
  lastSearchCount: number | null = null;
  totalBooks: number | null = null;
  taxonomy: Taxonomy = EMPTY_TAXONOMY;

  locations: LocationSummary | null = null;
  roomsState: 'loading' | 'ok' | 'error' = 'loading';
  rawRooms: string[] = [];
  room: string | null = null;
  roomCount: number | null = null;

  busy: 'catalogue' | 'locations' | null = null;

  constructor(
    private bookService: BookService,
    private taxonomyService: TaxonomyService,
    private listReturn: ListReturnService,
    private router: Router,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.taxonomyService.load().pipe(catchError(() => of(EMPTY_TAXONOMY))).subscribe(t => (this.taxonomy = t));
    this.bookService.getAllBooks('', '', 1, 1).pipe(catchError(() => of(null)))
      .subscribe(r => (this.totalBooks = r ? r.totalBooks : null));

    // The last search made on /books (if it narrowed anything) can be exported as is.
    const url = this.listReturn.lastListUrl();
    if (url) {
      const query = parseBookQuery(this.router.parseUrl(url).queryParams).query;
      if (hasFilters(query)) {
        this.lastSearch = query;
        this.bookService.getBooks(toApiArgs(query), 1, 1).pipe(catchError(() => of(null)))
          .subscribe(r => (this.lastSearchCount = r ? r.filteredCount : null));
      }
    }
    this.loadRooms();
  }

  loadRooms(): void {
    this.roomsState = 'loading';
    // Raw room values (the locations export matches the room exactly as stored).
    this.bookService.getUniqueRoomNumbers().pipe(catchError(() => of(null as string[] | null))).subscribe(rooms => {
      if (!rooms) { this.roomsState = 'error'; return; }
      this.rawRooms = rooms.filter(Boolean).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
      this.roomsState = 'ok';
    });
    this.bookService.getLocationSummary().pipe(catchError(() => of(null))).subscribe(s => (this.locations = s));
  }

  // ---------- scope ----------

  get args(): ApiArgs {
    return this.scope === 'search' && this.lastSearch ? toApiArgs(this.lastSearch) : toApiArgs(DEFAULT_QUERY);
  }

  get searchSummary(): string {
    const q = this.lastSearch;
    if (!q) return '';
    const parts: string[] = [];
    if (q.q) parts.push(`«${q.q}»`);
    if (q.category) parts.push(this.taxonomy.categories.find(c => c._id === q.category)?.title ?? 'قسم محدد');
    if (q.subject) parts.push(this.taxonomy.subjects.find(s => s._id === q.subject)?.title ?? 'موضوع محدد');
    if (q.room) parts.push(`الغرفة ${q.room}`);
    if (q.wall) parts.push(`الاستاند ${q.wall}`);
    if (q.shelf) parts.push(`الرف ${q.shelf}`);
    q.rows.forEach(r => parts.push(`${fieldLabel(r.field)}: ${r.value}`));
    return parts.join(' · ');
  }

  get catalogueCount(): number | null {
    return this.scope === 'search' ? this.lastSearchCount : this.totalBooks;
  }

  onRoomChange(room: string | null): void {
    this.room = room;
    this.roomCount = null;
    if (!room) return;
    const args = this.args;
    const filters = [{ field: 'roomExact', value: room }];
    // Count = books in this room within the chosen scope.
    const scoped = args.query === 'advanced' ? [...JSON.parse(args.searchTerm), ...filters]
      : args.searchTerm ? [{ field: 'all', value: args.searchTerm }, ...filters] : filters;
    this.bookService.getAllBooks('advanced', JSON.stringify(scoped), 1, 1).pipe(catchError(() => of(null)))
      .subscribe(r => (this.roomCount = r ? r.filteredCount : null));
  }

  setScope(scope: Scope): void {
    this.scope = scope;
    if (this.room) this.onRoomChange(this.room);
  }

  roomBooks(room: string): number | null {
    const latin = room.replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
    return this.locations?.rooms.find(r => r.room === latin)?.count ?? null;
  }

  // ---------- downloads ----------

  exportCatalogue(): void {
    const a = this.args;
    this.busy = 'catalogue';
    this.bookService.exportBooksToExcel(a.query, a.searchTerm, a.sortDirection).subscribe({
      next: blob => {
        this.download(blob, `books_${this.stamp()}.xlsx`);
        this.busy = null;
        this.toast.success('تم تنزيل ملف الفهرس');
      },
      error: () => { this.busy = null; this.toast.error('تعذّر تصدير الفهرس. حاول مرة أخرى.'); }
    });
  }

  exportLocations(): void {
    if (!this.room) return;
    const a = this.args;
    const room = this.room;
    this.busy = 'locations';
    this.bookService.exportBookLocationsToExcel(room, a.query, a.searchTerm, a.sortDirection).subscribe({
      next: blob => {
        this.download(blob, `locations_room_${room}_${this.stamp()}.xlsx`);
        this.busy = null;
        this.toast.success(`تم تنزيل مواقع كتب الغرفة ${room}`);
      },
      error: () => { this.busy = null; this.toast.error('تعذّر تصدير المواقع. حاول مرة أخرى.'); }
    });
  }

  private download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  private stamp(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
