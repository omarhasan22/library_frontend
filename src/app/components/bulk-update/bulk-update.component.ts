import { Component, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { BookService } from '../../services/book.service';
import { ToastService } from '../../shared/services/toast.service';
import { ConfirmService } from '../../shared/services/confirm.service';
import { TaxonomyService } from '../../shared/services/taxonomy.service';
import { arCount, parseArabicInt, toLatinDigits } from '../../shared/utils/arabic';

type UpdateType = 'subject' | 'category';
const MAX_RANGE = 5000;
const DATE_FMT = new Intl.DateTimeFormat('ar-u-nu-latn', { dateStyle: 'medium', timeStyle: 'short' });

interface Preview {
  key: string;
  count: number;
  sample: { _id: string; title: string; address: any; category?: string; subject?: string }[];
}

/**
 * /bulk-update — change the section or subject of a run of books on one shelf.
 * Flow: what to change → which books (with a real preview of the matching books) → new value →
 * confirm → result with undo. Recent updates can be undone from the history list too.
 */
@Component({
  selector: 'app-bulk-update',
  templateUrl: './bulk-update.component.html',
  styleUrls: ['./bulk-update.component.css']
})
export class BulkUpdateComponent implements OnInit {
  updateType: UpdateType = 'subject';

  // criteria
  roomNumber = '';
  wallNumber = '';
  shelfNumber = '';
  fromInput = '';
  toInput = '';

  // new value
  selectedSubject: any = null;
  selectedCategory: any = null;

  rooms: string[] = [];
  walls: string[] = [];
  subjects: any[] = [];
  categories: any[] = [];

  submitted = false;
  previewing = false;
  preview: Preview | null = null;
  applying = false;
  lastResult: { historyId: string; count: number; type: UpdateType; value: string; books: any[] } | null = null;

  history: any[] = [];
  historyState: 'loading' | 'ok' | 'error' = 'loading';
  undoingId: string | null = null;

  readonly createSubject = (title: string) =>
    this.bookService.createSubject({ title }).pipe(tap(s => { this.subjects = [...this.subjects, s]; this.taxonomy.invalidate(); }));
  readonly createCategory = (title: string) =>
    this.bookService.createCategory({ title }).pipe(tap(c => { this.categories = [...this.categories, c]; this.taxonomy.invalidate(); }));

  constructor(
    private bookService: BookService,
    private taxonomy: TaxonomyService,
    private toast: ToastService,
    private dialog: ConfirmService
  ) {}

  ngOnInit(): void {
    // Rooms are matched exactly as stored here, so "11" and "١١" stay separate options.
    this.bookService.getUniqueRoomNumbers().pipe(catchError(() => of([] as string[])))
      .subscribe(rooms => (this.rooms = (rooms || []).filter(Boolean)));
    this.bookService.getSubjects().pipe(catchError(() => of([] as any[])))
      .subscribe(s => (this.subjects = Array.isArray(s) ? s : ((s as any)?.subjects ?? [])));
    this.bookService.getCategories().pipe(catchError(() => of([] as any[])))
      .subscribe(c => (this.categories = c || []));
    this.loadHistory();
  }

  // ---------- criteria ----------

  get from(): number { return parseArabicInt(this.fromInput); }
  get to(): number { return parseArabicInt(this.toInput); }

  get errors(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!this.shelfNumber.trim()) e['shelf'] = 'حدّد رقم الرف.';
    if (!this.fromInput.trim()) e['from'] = 'أدخل أول رقم.';
    else if (Number.isNaN(this.from) || this.from < 0) e['from'] = 'أدخل رقماً صحيحاً.';
    if (!this.toInput.trim()) e['to'] = 'أدخل آخر رقم.';
    else if (Number.isNaN(this.to) || this.to < 0) e['to'] = 'أدخل رقماً صحيحاً.';
    if (!e['from'] && !e['to']) {
      if (this.from > this.to) e['to'] = 'آخر رقم يجب ألا يقل عن أول رقم.';
      else if (this.to - this.from + 1 > MAX_RANGE) e['to'] = `النطاق أكبر من ${MAX_RANGE} كتاب.`;
    }
    return e;
  }

  get criteriaValid(): boolean { return Object.keys(this.errors).length === 0; }

  private criteria() {
    return {
      roomNumber: this.roomNumber || undefined,
      wallNumber: this.wallNumber || undefined,
      shelfNumber: toLatinDigits(this.shelfNumber).trim(),
      bookNumberFrom: this.from,
      bookNumberTo: this.to
    };
  }

  private criteriaKey(): string {
    return JSON.stringify(this.criteria());
  }

  /** The preview belongs to the criteria it was made for. */
  get previewCurrent(): boolean {
    return !!this.preview && this.preview.key === this.criteriaKey();
  }

  onRoomChange(room: string): void {
    this.roomNumber = room;
    this.wallNumber = '';
    this.walls = [];
    if (!room) return;
    this.bookService.getUniqueWallNumbers(room).pipe(catchError(() => of([] as string[])))
      .subscribe(walls => (this.walls = (walls || []).filter(Boolean)));
  }

  setType(type: UpdateType): void {
    this.updateType = type;
  }

  get criteriaText(): string {
    const parts = [];
    if (this.roomNumber) parts.push(`الغرفة ${this.roomNumber}`);
    if (this.wallNumber) parts.push(`الاستاند ${this.wallNumber}`);
    parts.push(`الرف ${toLatinDigits(this.shelfNumber).trim()}`);
    parts.push(`الكتب ${this.from}–${this.to}`);
    return parts.join('، ');
  }

  // ---------- preview & apply ----------

  runPreview(): void {
    this.submitted = true;
    if (!this.criteriaValid) return;
    this.previewing = true;
    const key = this.criteriaKey();
    this.bookService.previewBulkUpdate(this.criteria()).subscribe({
      next: res => {
        this.previewing = false;
        this.preview = { key, count: res.count, sample: res.sample || [] };
      },
      error: err => {
        this.previewing = false;
        this.preview = null;
        this.toast.apiError(err, 'تعذّرت معاينة الكتب. حاول مرة أخرى.');
      }
    });
  }

  get newValue(): any {
    return this.updateType === 'subject' ? this.selectedSubject : this.selectedCategory;
  }

  get canApply(): boolean {
    return this.previewCurrent && (this.preview?.count ?? 0) > 0 && !!this.newValue?._id && !this.applying;
  }

  async apply(): Promise<void> {
    this.submitted = true;
    if (!this.canApply || !this.preview) return;
    const field = this.updateType === 'subject' ? 'الموضوع' : 'القسم';
    const value = this.newValue.title;
    const ok = await this.dialog.ask({
      title: `تغيير ${field} لـ ${arCount(this.preview.count, 'book')}؟`,
      message: `سيصبح ${field} «${value}» لكل الكتب في: ${this.criteriaText}. يمكنك التراجع بعد التنفيذ.`,
      confirmText: 'تطبيق التغيير'
    });
    if (!ok) return;

    this.applying = true;
    const criteria = this.criteria();
    const request: Observable<any> = this.updateType === 'subject'
      ? this.bookService.bulkUpdateSubjects({ ...criteria, subjectId: this.newValue._id })
      : this.bookService.bulkUpdateCategories({ ...criteria, categoryId: this.newValue._id });

    request.subscribe({
      next: (result: any) => {
        this.applying = false;
        const count = result.modifiedCount ?? 0;
        this.lastResult = { historyId: result.historyId, count, type: this.updateType, value, books: [] };
        if (result.historyId) {
          this.bookService.getHistoryById(result.historyId).pipe(catchError(() => of(null)))
            .subscribe(h => { if (h && this.lastResult) this.lastResult.books = h.affectedBooks || []; });
        }
        this.toast.success(`تم تحديث ${arCount(count, 'book')}`, result.historyId
          ? { actionLabel: 'تراجع', action: () => this.undo(result.historyId) } : {});
        this.preview = null;
        this.submitted = false;
        this.fromInput = '';
        this.toInput = '';
        this.taxonomy.invalidate(); // book counts per section/subject changed
        this.loadHistory();
      },
      error: err => {
        this.applying = false;
        const message = String(err?.error?.error || '');
        this.toast.error(message.includes('rollback')
          ? 'تعذّر التحديث، واستُعيدت الحالة السابقة تلقائياً.'
          : 'تعذّر تنفيذ التحديث. لم يتغيّر شيء، حاول مرة أخرى.');
      }
    });
  }

  // ---------- history & undo ----------

  loadHistory(): void {
    this.historyState = 'loading';
    this.bookService.getBulkUpdateHistory(1, 10).subscribe({
      next: res => { this.history = res.history || []; this.historyState = 'ok'; },
      error: () => (this.historyState = 'error')
    });
  }

  async undo(historyId: string): Promise<void> {
    const ok = await this.dialog.ask({
      title: 'التراجع عن هذا التحديث؟',
      message: 'ستعود الكتب المشمولة إلى القسم أو الموضوع الذي كانت عليه قبل التحديث.',
      confirmText: 'تراجع'
    });
    if (!ok) return;
    this.undoingId = historyId;
    this.bookService.undoBulkUpdateSubjects(historyId).subscribe({
      next: res => {
        this.undoingId = null;
        this.toast.success(`تم التراجع واستعادة ${arCount(res.restoredCount, 'book')}`);
        if (this.lastResult?.historyId === historyId) this.lastResult = null;
        this.taxonomy.invalidate();
        this.loadHistory();
      },
      error: err => {
        this.undoingId = null;
        this.toast.apiError(err, 'تعذّر التراجع عن التحديث.');
      }
    });
  }

  historyLabel(h: any): { field: string; from: string; to: string } {
    return h.updateType === 'category'
      ? { field: 'القسم', from: h.oldCategory?.title || '—', to: h.newCategory?.title || '—' }
      : { field: 'الموضوع', from: h.oldSubject?.title || '—', to: h.newSubject?.title || '—' };
  }

  historyAddress(h: any): any {
    const c = h.criteria || {};
    return { roomNumber: c.roomNumber, wallNumber: c.wallNumber, shelfNumber: c.shelfNumber, bookNumber: `${c.bookNumberFrom}–${c.bookNumberTo}` };
  }

  date(value: any): string {
    try { return DATE_FMT.format(new Date(value)); } catch { return ''; }
  }
}
