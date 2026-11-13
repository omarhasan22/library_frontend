import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, Subscription, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';

import { Author, AuthorService, AuthorStats } from '../../services/author.service';
import { BookService } from '../../services/book.service';
import { ConfirmService } from '../../shared/services/confirm.service';
import { ToastService } from '../../shared/services/toast.service';
import { arCount } from '../../shared/utils/arabic';

/** Which book field each person type fills (for "his books" links and usage counts). */
const BOOK_FIELD: Record<string, string> = {
  author: 'authors', editor: 'editors', commentator: 'commentators', caretaker: 'caretakers', muhashi: 'muhashis'
};

/**
 * /authors — every person in the catalogue (authors, editors, commentators, …).
 * Search is debounced; the form is a native <dialog>; deleting warns how many books carry the name.
 */
@Component({
  selector: 'app-author-dashboard',
  templateUrl: './author-dashboard.component.html',
  styleUrls: ['../../shared/styles/entity-admin.css', './author-dashboard.component.css']
})
export class AuthorDashboardComponent implements OnInit, OnDestroy {
  @ViewChild('formDialog', { static: true }) formDialog!: ElementRef<HTMLDialogElement>;

  readonly types = [
    { value: 'author', label: 'مؤلف' },
    { value: 'editor', label: 'محقق' },
    { value: 'commentator', label: 'شارح' },
    { value: 'muhashi', label: 'محشٍّ' },
    { value: 'caretaker', label: 'معتنٍ' }
  ];

  authors: Author[] = [];
  stats: AuthorStats | null = null;
  state: 'loading' | 'ok' | 'error' = 'loading';
  refreshing = false;

  search = '';
  type = '';
  page = 1;
  pageSize = 20;
  totalPages = 1;
  total = 0;

  form: FormGroup;
  editing: Author | null = null;
  saving = false;
  formSubmitted = false;

  private search$ = new Subject<string>();
  private load$ = new Subject<void>();
  private subs = new Subscription();

  constructor(
    private authorService: AuthorService,
    private bookService: BookService,
    private fb: FormBuilder,
    private toast: ToastService,
    private dialog: ConfirmService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      type: ['author', Validators.required],
      dateOfBirth: [''],
      dateOfDeath: ['']
    });
  }

  ngOnInit(): void {
    this.subs.add(this.load$.pipe(
      tap(() => (this.state === 'ok' ? (this.refreshing = true) : (this.state = 'loading'))),
      switchMap(() => this.authorService.getAllAuthors(this.page, this.pageSize, this.search.trim(), this.type).pipe(
        map(res => ({ res })),
        catchError(() => of({ res: null }))
      ))
    ).subscribe(({ res }) => {
      this.refreshing = false;
      if (!res) { this.state = 'error'; return; }
      this.authors = res.authors || [];
      this.total = res.total || 0;
      this.totalPages = Math.max(1, res.totalPages || 1);
      this.state = 'ok';
    }));
    this.subs.add(this.search$.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => { this.page = 1; this.load(); }));
    this.load();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  load(): void { this.load$.next(); }

  loadStats(): void {
    this.authorService.getAuthorStats().pipe(catchError(() => of(null))).subscribe(s => (this.stats = s));
  }

  onSearch(value: string): void { this.search$.next(value.trim()); }
  setType(type: string): void { this.type = type; this.page = 1; this.load(); }
  setPageSize(size: number): void { this.pageSize = +size; this.page = 1; this.load(); }
  onPage(page: number): void { this.page = page; this.load(); }

  typeLabel(value: string): string {
    return this.types.find(t => t.value === value)?.label ?? (value === 'publisher' ? 'ناشر' : value);
  }

  typeCount(value: string): number {
    return this.stats?.authorsByType?.find(t => t._id === value)?.count ?? 0;
  }

  booksLink(a: Author): Record<string, string> {
    return { f: `${BOOK_FIELD[a.type] || 'authors'}:${a.name}` };
  }

  year(date?: Date | string): string {
    if (!date) return '—';
    const d = new Date(date);
    return Number.isNaN(d.getTime()) ? '—' : String(d.getFullYear());
  }

  // ---------- add / edit ----------

  openAdd(): void {
    this.editing = null;
    this.formSubmitted = false;
    this.form.reset({ name: '', type: this.type || 'author', dateOfBirth: '', dateOfDeath: '' });
    this.formDialog.nativeElement.showModal();
  }

  openEdit(a: Author): void {
    this.editing = a;
    this.formSubmitted = false;
    this.form.reset({
      name: a.name, type: a.type,
      dateOfBirth: a.dateOfBirth ? new Date(a.dateOfBirth).toISOString().slice(0, 10) : '',
      dateOfDeath: a.dateOfDeath ? new Date(a.dateOfDeath).toISOString().slice(0, 10) : ''
    });
    this.formDialog.nativeElement.showModal();
  }

  closeForm(): void {
    this.formDialog.nativeElement.close();
  }

  get nameError(): string | null {
    const c = this.form.get('name');
    if (!this.formSubmitted || !c?.errors) return null;
    return c.errors['required'] ? 'اكتب الاسم.' : 'الاسم قصير جداً.';
  }

  save(): void {
    this.formSubmitted = true;
    if (this.form.invalid) {
      (this.formDialog.nativeElement.querySelector('#person-name') as HTMLElement | null)?.focus();
      return;
    }
    const v = this.form.value;
    const data: Partial<Author> = {
      name: String(v.name).trim(),
      type: v.type,
      dateOfBirth: v.dateOfBirth ? new Date(v.dateOfBirth) : undefined,
      dateOfDeath: v.dateOfDeath ? new Date(v.dateOfDeath) : undefined
    };
    this.saving = true;
    const request = this.editing?._id
      ? this.authorService.updateAuthor(this.editing._id, data)
      : this.authorService.createAuthor(data);
    request.subscribe({
      next: () => {
        this.saving = false;
        this.closeForm();
        this.toast.success(this.editing ? `تم حفظ «${data.name}»` : `تمت إضافة «${data.name}»`);
        this.load();
        this.loadStats();
      },
      error: err => {
        this.saving = false;
        this.toast.apiError(err, 'تعذّر الحفظ. حاول مرة أخرى.');
      }
    });
  }

  // ---------- delete ----------

  async remove(a: Author): Promise<void> {
    if (!a._id) return;
    const field = BOOK_FIELD[a.type] || 'authors';
    const used = await new Promise<number | null>(resolve =>
      this.bookService.getAllBooks('advanced', JSON.stringify([{ field, value: a.name }]), 1, 1)
        .pipe(catchError(() => of(null))).subscribe(r => resolve(r ? r.filteredCount : null)));
    const ok = await this.dialog.ask({
      title: `حذف «${a.name}»؟`,
      message: used
        ? `قد يظهر هذا الاسم في ${arCount(used, 'book')}، وسيختفي منها بعد الحذف. لا يمكن التراجع.`
        : 'لا يمكن التراجع عن الحذف.',
      confirmText: 'حذف',
      tone: 'danger'
    });
    if (!ok) return;
    this.authorService.deleteAuthor(a._id).subscribe({
      next: () => {
        this.toast.success(`تم حذف «${a.name}»`);
        if (this.authors.length === 1 && this.page > 1) this.page--;
        this.load();
        this.loadStats();
      },
      error: err => this.toast.apiError(err, 'تعذّر الحذف.')
    });
  }

  trackById = (_: number, a: Author) => a._id;
}
