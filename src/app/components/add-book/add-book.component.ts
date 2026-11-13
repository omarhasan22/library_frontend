import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { BookService } from '../../services/book.service';
import { Book } from '../../models/book.model';
import { ToastService } from '../../shared/services/toast.service';
import { ConfirmService } from '../../shared/services/confirm.service';
import { TaxonomyService } from '../../shared/services/taxonomy.service';
import { HasUnsavedChanges } from '../../guards/unsaved-changes.guard';
import { parseArabicInt, toLatinDigits } from '../../shared/utils/arabic';

type BookForm = Book & {
  address: { roomNumber: string; shelfNumber: string; wallNumber: string; bookNumber: string };
  notes?: string;
};

type PersonType = 'author' | 'commentator' | 'editor' | 'caretaker' | 'muhashi';

/**
 * /add-book and /edit-book/:id — one form for both.
 * Creating offers "حفظ وإضافة التالي": the next book keeps the section, subject and location, and its
 * book number goes up by one (the previous form did this silently; now it is shown before saving).
 */
@Component({
  selector: 'app-add-book',
  templateUrl: './add-book.component.html',
  styleUrls: ['./add-book.component.css']
})
export class AddBookComponent implements OnInit, HasUnsavedChanges {
  isEditMode = false;
  bookId: string | null = null;

  loadingBook = false;
  loadingLists = true;
  listsFailed = false;
  saving = false;
  submitted = false;

  people: Record<PersonType, any[]> = { author: [], commentator: [], editor: [], caretaker: [], muhashi: [] };
  categories: any[] = [];
  subjects: any[] = [];
  publishers: any[] = [];
  rooms: string[] = [];
  walls: string[] = [];
  private wallsRoom = '';
  private categorySubjects = new Map<string, string[]>();

  newBook: BookForm = this.emptyBook();
  pageCountInput = '';
  pageCountTotal: number | null = null;
  lastSaved: { id: string; title: string } | null = null;

  private snapshot = '';
  /** Address as loaded (edit mode): unchanged parts are saved exactly as they were. */
  private loadedAddress: BookForm['address'] | null = null;

  // createFn for each picker (arrow functions keep `this`)
  readonly createPerson = (type: PersonType) => (name: string): Observable<any> =>
    this.bookService.createPerson({ name, type }).pipe(tap(p => (this.people[type] = [...this.people[type], p])));
  readonly createAuthor = this.createPerson('author');
  readonly createCommentator = this.createPerson('commentator');
  readonly createEditor = this.createPerson('editor');
  readonly createCaretaker = this.createPerson('caretaker');
  readonly createMuhashi = this.createPerson('muhashi');
  readonly createPublisher = (title: string) =>
    this.bookService.createPublisher({ title }).pipe(tap(p => (this.publishers = [...this.publishers, p])));
  readonly createCategory = (title: string) =>
    this.bookService.createCategory({ title }).pipe(tap(c => { this.categories = [...this.categories, c]; this.taxonomy.invalidate(); }));
  readonly createSubject = (title: string) =>
    this.bookService.createSubject({ title }).pipe(tap(s => { this.subjects = [...this.subjects, s]; this.taxonomy.invalidate(); }));

  constructor(
    private bookService: BookService,
    private taxonomy: TaxonomyService,
    private route: ActivatedRoute,
    private router: Router,
    private host: ElementRef<HTMLElement>,
    private toast: ToastService,
    private dialog: ConfirmService
  ) { }

  ngOnInit(): void {
    this.bookId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.bookId;
    this.loadLists();
    if (this.isEditMode && this.bookId) this.loadBook(this.bookId);
    else this.takeSnapshot();
  }

  // ---------- loading ----------

  loadLists(): void {
    this.loadingLists = true;
    this.listsFailed = false;
    forkJoin([
      this.bookService.getPeople(),
      this.bookService.getCategories(),
      this.bookService.getSubjects(),
      this.bookService.getPublishers(),
      this.bookService.getUniqueRoomNumbers().pipe(catchError(() => of([] as string[])))
    ]).subscribe({
      next: ([people, categories, subjects, publishers, rooms]) => {
        const byType = (t: PersonType) => (people || []).filter((p: any) => p.type === t);
        this.people = {
          author: byType('author'), commentator: byType('commentator'), editor: byType('editor'),
          caretaker: byType('caretaker'), muhashi: byType('muhashi')
        };
        this.categories = categories || [];
        this.categorySubjects = new Map(this.categories.map((c: any) =>
          [String(c._id), (c.subjects || []).map((s: any) => String(s?._id ?? s))]));
        this.subjects = Array.isArray(subjects) ? subjects : ((subjects as any)?.subjects ?? []);
        this.publishers = publishers || [];
        this.rooms = [...new Set((rooms || []).map(r => toLatinDigits(String(r).trim())).filter(Boolean))]
          .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
        this.loadingLists = false;
        this.loadWalls();
      },
      error: () => {
        this.loadingLists = false;
        this.listsFailed = true;
      }
    });
  }

  private loadBook(id: string): void {
    this.loadingBook = true;
    this.bookService.getBookById(id).subscribe({
      next: book => {
        this.newBook = {
          ...book,
          authors: book.authors || [],
          commentators: book.commentators || [],
          editors: book.editors || [],
          caretakers: book.caretakers || [],
          muhashis: book.muhashis || [],
          publishers: book.publishers || [],
          category: book.category || (null as any),
          subject: book.subject || (null as any),
          address: {
            roomNumber: book.address?.roomNumber || '',
            shelfNumber: book.address?.shelfNumber || '',
            wallNumber: book.address?.wallNumber || '',
            bookNumber: book.address?.bookNumber || ''
          },
          notes: book.notes || ''
        };
        this.loadedAddress = { ...this.newBook.address };
        this.pageCountInput = book.pageCount?.toString() || '';
        this.pageCountTotal = book.pageCount || null;
        this.loadingBook = false;
        this.loadWalls();
        this.takeSnapshot();
      },
      error: () => {
        this.loadingBook = false;
        this.toast.error('تعذّر تحميل بيانات الكتاب');
        this.router.navigate(['/books']);
      }
    });
  }

  loadWalls(): void {
    const room = (this.newBook.address.roomNumber || '').trim();
    if (room === this.wallsRoom) return;
    this.wallsRoom = room;
    this.walls = [];
    if (!room) return;
    this.bookService.getUniqueWallNumbers(room).pipe(catchError(() => of([] as string[])))
      .subscribe(walls => (this.walls = [...new Set((walls || []).filter(Boolean))]));
  }

  // ---------- derived view state ----------

  get subjectIdsForCategory(): string[] {
    const id = (this.newBook.category as any)?._id;
    return id ? this.categorySubjects.get(String(id)) || [] : [];
  }

  get titleMissing(): boolean { return !String(this.newBook.title ?? '').trim(); }
  get categoryMissing(): boolean { return !(this.newBook.category as any)?._id && !(this.newBook.category as any)?.title; }

  /** Where "حفظ وإضافة التالي" will put the next book. */
  get nextAddress(): BookForm['address'] {
    const n = parseArabicInt(this.newBook.address.bookNumber);
    return { ...this.newBook.address, bookNumber: Number.isNaN(n) ? '' : String(n + 1) };
  }

  get hasLocation(): boolean {
    const a = this.newBook.address;
    return !!(a.roomNumber || a.wallNumber || a.shelfNumber || a.bookNumber);
  }

  /**
   * Location values are stored with Latin digits ("11", not "١١"), so new entries stop adding to the
   * mixed-digit data. Applied when the user leaves the field, so untouched records are never rewritten.
   */
  normalizeDigits(key: keyof BookForm['address']): void {
    const value = this.newBook.address[key];
    const normalized = toLatinDigits(value).trim();
    if (normalized !== value) this.newBook.address = { ...this.newBook.address, [key]: normalized };
  }

  // ---------- page count (accepts sums like 350+420 for multi-volume sets) ----------

  onPageCountChange(expr: string): void {
    this.pageCountInput = expr.trim();
    if (!this.pageCountInput) {
      this.pageCountTotal = null;
      this.newBook.pageCount = null as any; // empty means "not recorded" (it used to save as 1)
      return;
    }
    const total = this.calculateExpression(toLatinDigits(this.pageCountInput));
    this.pageCountTotal = total;
    if (total !== null) this.newBook.pageCount = total;
  }

  get pageCountIsExpression(): boolean {
    return /[+\-*/]/.test(this.pageCountInput);
  }

  private calculateExpression(expr: string): number | null {
    if (!expr || !/^[0-9+\-*/().\s]+$/.test(expr)) return null;
    try {
      // Only digits and arithmetic operators reach here (checked above).
      const result = new Function(`return ${expr}`)();
      return typeof result === 'number' && isFinite(result) ? Math.round(result) : null;
    } catch {
      return null;
    }
  }

  // ---------- saving ----------

  /** Payload for the API — unchanged from the previous form, so the server receives the same shape. */
  private preparePayload(): any {
    const payload: any = { ...this.newBook };

    payload.authors = payload.authors.map((p: any) => p._id ? p._id : { name: p.name });
    payload.commentators = payload.commentators.map((p: any) => p._id ? p._id : { name: p.name });
    payload.editors = payload.editors.map((p: any) => p._id ? p._id : { name: p.name });
    payload.caretakers = payload.caretakers.map((p: any) => p._id ? p._id : { name: p.name });
    payload.muhashis = payload.muhashis.map((p: any) => p._id ? p._id : { name: p.name });
    payload.publishers = payload.publishers.map((p: any) => p._id ? p._id : { title: p.title });

    if (payload.category && payload.category._id) {
      payload.category = payload.category._id;
    } else if (payload.category && payload.category.title) {
      payload.category = { title: payload.category.title };
    } else {
      delete payload.category;
    }

    if (payload.subject && payload.subject._id) {
      payload.subject = payload.subject._id;
    } else if (payload.subject && payload.subject.title) {
      payload.subject = { title: payload.subject.title };
    } else {
      delete payload.subject;
    }

    return payload;
  }

  /** mode: 'next' = save and start the next book here; 'view' = save and open the book. */
  save(form: NgForm, mode: 'next' | 'view' = 'view'): void {
    this.submitted = true;
    if (this.titleMissing || this.categoryMissing) {
      this.focusFirstError();
      return;
    }
    if (this.pageCountInput && this.pageCountTotal === null) {
      this.focusFirstError();
      return;
    }
    // Typed-then-saved without leaving the field: normalize digits of new/changed location parts too.
    for (const key of ['roomNumber', 'wallNumber', 'shelfNumber', 'bookNumber'] as const) {
      if (!this.loadedAddress || this.newBook.address[key] !== this.loadedAddress[key]) this.normalizeDigits(key);
    }
    const payload = this.preparePayload();
    this.saving = true;

    if (this.isEditMode && this.bookId) {
      this.bookService.updateBook(this.bookId, payload).subscribe({
        next: () => {
          this.saving = false;
          this.takeSnapshot();
          this.toast.success('تم حفظ التغييرات');
          this.router.navigate(['/books', this.bookId], { replaceUrl: true });
        },
        error: err => {
          this.saving = false;
          this.toast.apiError(err, 'تعذّر حفظ التغييرات. راجع البيانات وحاول مرة أخرى.');
        }
      });
      return;
    }

    this.bookService.createBook(payload).subscribe({
      next: created => {
        this.saving = false;
        const id = String((created as any)?._id ?? '');
        const title = String(payload.title ?? '');
        if (mode === 'view' && id) {
          this.takeSnapshot();
          this.toast.success(`تمت إضافة «${title}»`);
          this.router.navigate(['/books', id]);
          return;
        }
        this.lastSaved = id ? { id, title } : null;
        this.toast.success(`تمت إضافة «${title}». أدخل الكتاب التالي.`, id ? {
          actionLabel: 'عرض', action: () => this.router.navigate(['/books', id])
        } : {});
        this.startNext(form);
      },
      error: err => {
        this.saving = false;
        this.toast.apiError(err, 'تعذّرت إضافة الكتاب. راجع البيانات وحاول مرة أخرى.');
      }
    });
  }

  /** Same section, subject and location; book number + 1; everything else cleared. */
  private startNext(form: NgForm): void {
    const prev = this.newBook;
    const next = this.emptyBook();
    next.category = prev.category;
    next.subject = prev.subject;
    next.address = this.nextAddress;
    // A new model object re-binds every field. (form.resetForm() would clear the controls while
    // ngModel kept the old values, leaving the inputs and the model out of sync.)
    this.newBook = next;
    this.pageCountInput = '';
    this.pageCountTotal = null;
    this.submitted = false;
    form.form.markAsPristine();
    form.form.markAsUntouched();
    setTimeout(() => {
      this.takeSnapshot();
      this.host.nativeElement.querySelector<HTMLElement>('#book-title')?.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  cancel(): void {
    if (this.isEditMode && this.bookId) this.router.navigate(['/books', this.bookId]);
    else this.router.navigate(['/books']);
  }

  /** Ctrl+Enter: the primary action (save & next when adding, save when editing). */
  onFormKeydown(event: KeyboardEvent, form: NgForm): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.save(form, this.isEditMode ? 'view' : 'next');
    }
  }

  // ---------- unsaved changes ----------

  get isDirty(): boolean {
    return !this.saving && !this.loadingBook && JSON.stringify(this.comparable()) !== this.snapshot;
  }

  async canLeave(): Promise<boolean> {
    if (!this.isDirty) return true;
    return this.dialog.ask({
      title: 'تجاهل التغييرات؟',
      message: 'لم تُحفظ التغييرات على هذا الكتاب بعد. إذا غادرت الصفحة ستضيع.',
      confirmText: 'مغادرة دون حفظ',
      cancelText: 'البقاء في الصفحة',
      tone: 'danger'
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.isDirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  private takeSnapshot(): void {
    this.snapshot = JSON.stringify(this.comparable());
  }

  private comparable(): unknown {
    return { book: this.newBook, pages: this.pageCountInput };
  }

  private focusFirstError(): void {
    setTimeout(() => {
      const el = this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]');
      el?.scrollIntoView({ block: 'center' });
      el?.focus({ preventScroll: true });
    });
  }

  private emptyBook(): BookForm {
    return {
      title: '',
      authors: [],
      commentators: [],
      editors: [],
      caretakers: [],
      muhashis: [],
      category: null as any,
      subject: null as any,
      numberOfVolumes: 1,
      numberOfFolders: 1,
      publishers: [],
      editionNumber: 1,
      pageCount: null as any,
      address: { roomNumber: '', shelfNumber: '', wallNumber: '', bookNumber: '1' },
      imageUrl: '',
      notes: ''
    };
  }
}
