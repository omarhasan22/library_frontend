import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, Subscription, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';

import { Publisher, PublisherService, PublisherStats } from '../../services/publisher.service';
import { BookService } from '../../services/book.service';
import { ConfirmService } from '../../shared/services/confirm.service';
import { ToastService } from '../../shared/services/toast.service';
import { arCount } from '../../shared/utils/arabic';

/** /publishers — publishers in the catalogue; same layout and behaviour as /authors. */
@Component({
  selector: 'app-publisher-dashboard',
  templateUrl: './publisher-dashboard.component.html',
  styleUrls: ['../../shared/styles/entity-admin.css', './publisher-dashboard.component.css']
})
export class PublisherDashboardComponent implements OnInit, OnDestroy {
  @ViewChild('formDialog', { static: true }) formDialog!: ElementRef<HTMLDialogElement>;

  publishers: Publisher[] = [];
  stats: PublisherStats | null = null;
  state: 'loading' | 'ok' | 'error' = 'loading';
  refreshing = false;

  search = '';
  page = 1;
  pageSize = 20;
  totalPages = 1;
  total = 0;

  form: FormGroup;
  editing: Publisher | null = null;
  saving = false;
  formSubmitted = false;

  private search$ = new Subject<string>();
  private load$ = new Subject<void>();
  private subs = new Subscription();

  constructor(
    private publisherService: PublisherService,
    private bookService: BookService,
    private fb: FormBuilder,
    private toast: ToastService,
    private dialog: ConfirmService
  ) {
    this.form = this.fb.group({ title: ['', [Validators.required, Validators.minLength(2)]] });
  }

  ngOnInit(): void {
    this.subs.add(this.load$.pipe(
      tap(() => (this.state === 'ok' ? (this.refreshing = true) : (this.state = 'loading'))),
      switchMap(() => this.publisherService.getAllPublishers(this.page, this.pageSize, this.search.trim()).pipe(
        map(res => ({ res })),
        catchError(() => of({ res: null }))
      ))
    ).subscribe(({ res }) => {
      this.refreshing = false;
      if (!res) { this.state = 'error'; return; }
      this.publishers = (res as any).publishers || [];
      this.total = (res as any).total || 0;
      this.totalPages = Math.max(1, (res as any).totalPages || 1);
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
    this.publisherService.getPublisherStats().pipe(catchError(() => of(null))).subscribe(s => (this.stats = s));
  }

  onSearch(value: string): void { this.search$.next(value.trim()); }
  setPageSize(size: number): void { this.pageSize = +size; this.page = 1; this.load(); }
  onPage(page: number): void { this.page = page; this.load(); }

  openAdd(): void {
    this.editing = null;
    this.formSubmitted = false;
    this.form.reset({ title: '' });
    this.formDialog.nativeElement.showModal();
  }

  openEdit(p: Publisher): void {
    this.editing = p;
    this.formSubmitted = false;
    this.form.reset({ title: p.title });
    this.formDialog.nativeElement.showModal();
  }

  closeForm(): void {
    this.formDialog.nativeElement.close();
  }

  get titleError(): string | null {
    const c = this.form.get('title');
    if (!this.formSubmitted || !c?.errors) return null;
    return c.errors['required'] ? 'اكتب اسم الناشر.' : 'الاسم قصير جداً.';
  }

  save(): void {
    this.formSubmitted = true;
    if (this.form.invalid) {
      (this.formDialog.nativeElement.querySelector('#publisher-title') as HTMLElement | null)?.focus();
      return;
    }
    const title = String(this.form.value.title).trim();
    this.saving = true;
    const request = this.editing?._id
      ? this.publisherService.updatePublisher(this.editing._id, { title })
      : this.publisherService.createPublisher({ title });
    request.subscribe({
      next: () => {
        this.saving = false;
        this.closeForm();
        this.toast.success(this.editing ? `تم حفظ «${title}»` : `تمت إضافة «${title}»`);
        this.load();
        this.loadStats();
      },
      error: err => {
        this.saving = false;
        this.toast.apiError(err, 'تعذّر الحفظ. حاول مرة أخرى.');
      }
    });
  }

  async remove(p: Publisher): Promise<void> {
    if (!p._id) return;
    const used = await new Promise<number | null>(resolve =>
      this.bookService.getAllBooks('advanced', JSON.stringify([{ field: 'publishers', value: p.title }]), 1, 1)
        .pipe(catchError(() => of(null))).subscribe(r => resolve(r ? r.filteredCount : null)));
    const ok = await this.dialog.ask({
      title: `حذف الناشر «${p.title}»؟`,
      message: used
        ? `قد يظهر هذا الناشر في ${arCount(used, 'book')}، وسيختفي منها بعد الحذف. لا يمكن التراجع.`
        : 'لا يمكن التراجع عن الحذف.',
      confirmText: 'حذف',
      tone: 'danger'
    });
    if (!ok) return;
    this.publisherService.deletePublisher(p._id).subscribe({
      next: () => {
        this.toast.success(`تم حذف «${p.title}»`);
        if (this.publishers.length === 1 && this.page > 1) this.page--;
        this.load();
        this.loadStats();
      },
      error: err => this.toast.apiError(err, 'تعذّر الحذف.')
    });
  }

  trackById = (_: number, p: Publisher) => p._id;
}
