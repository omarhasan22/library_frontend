import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, UrlTree } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { BookService } from '../../services/book.service';
import { AuthService } from '../../services/auth.service';
import { Book } from '../../models/book.model';
import { ToastService } from '../../shared/services/toast.service';
import { ConfirmService } from '../../shared/services/confirm.service';
import { ListReturnService } from '../../books/list-return.service';
import { pageTitle } from '../../app-title.strategy';
import { Crumb } from '../../shared/components/page-header/page-header.component';

type State = { kind: 'loading' } | { kind: 'ok'; book: Book } | { kind: 'not-found' } | { kind: 'error' };

interface Person { name: string; field: string; }
interface Detail { label: string; value: string | null; people?: Person[]; wide?: boolean; }

/**
 * /books/:id — one book: where it is (the main job), who wrote/edited it, and its publication details.
 * Editing happens on /edit-book/:id (one form for create and edit).
 */
@Component({
  selector: 'app-book-detail',
  templateUrl: './book-detail.component.html',
  styleUrls: ['./book-detail.component.css'],
  standalone: false
})
export class BookDetailComponent implements OnInit, OnDestroy {
  state: State = { kind: 'loading' };
  isAdmin = false;
  deleting = false;
  backUrl: UrlTree;

  private bookId = '';
  private subs = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookService: BookService,
    private authService: AuthService,
    private listReturn: ListReturnService,
    private title: Title,
    private toast: ToastService,
    private dialog: ConfirmService
  ) {
    this.backUrl = this.router.parseUrl(this.listReturn.lastListUrl() || '/books');
  }

  ngOnInit(): void {
    this.subs.add(this.authService.currentUser$.subscribe(user => (this.isAdmin = user?.role === 'admin')));
    this.subs.add(this.route.paramMap.pipe(
      map(params => params.get('id') || ''),
      switchMap(id => {
        this.bookId = id;
        this.state = { kind: 'loading' };
        return this.bookService.getBookById(id).pipe(
          map(book => (book ? ({ kind: 'ok', book } as State) : ({ kind: 'not-found' } as State))),
          catchError(err => of((err?.status === 404 || err?.status === 400 ? { kind: 'not-found' } : { kind: 'error' }) as State))
        );
      })
    ).subscribe(state => {
      this.state = state;
      if (state.kind === 'ok') this.title.setTitle(pageTitle(state.book.title || 'كتاب'));
      if (state.kind === 'not-found') this.title.setTitle(pageTitle('كتاب غير موجود'));
    }));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  retry(): void {
    this.state = { kind: 'loading' };
    this.bookService.getBookById(this.bookId).pipe(
      map(book => ({ kind: 'ok', book } as State)),
      catchError(() => of({ kind: 'error' } as State))
    ).subscribe(state => (this.state = state));
  }

  crumbs(book: Book): Crumb[] {
    const crumbs: Crumb[] = [{ label: 'الكتب', link: '/books' }];
    if (book.category?._id) crumbs.push({ label: book.category.title || 'القسم', link: '/books', queryParams: { category: book.category._id } });
    crumbs.push({ label: book.title || 'كتاب' });
    return crumbs;
  }

  authors(book: Book): Person[] {
    return this.people(book.authors, 'authors');
  }

  /** Everything except title, section and location, in reading order. Empty values are null. */
  details(book: Book): Detail[] {
    const num = (n?: number | null) => (n === null || n === undefined || (n as any) === '' ? null : String(n));
    return [
      { label: 'الشارح', value: null, people: this.people(book.commentators, 'commentators') },
      { label: 'المحشي', value: null, people: this.people(book.muhashis, 'muhashis') },
      { label: 'المحقق', value: null, people: this.people(book.editors, 'editors') },
      { label: 'المعتني', value: null, people: this.people(book.caretakers, 'caretakers') },
      { label: 'الناشر', value: null, people: (book.publishers || []).filter(p => p?.title).map(p => ({ name: p.title!, field: 'publishers' })) },
      { label: 'رقم الطبعة', value: num(book.editionNumber) },
      { label: 'سنة النشر', value: num(book.publicationYear) },
      { label: 'عدد الأجزاء', value: num(book.numberOfVolumes) },
      { label: 'عدد المجلدات', value: num(book.numberOfFolders) },
      { label: 'عدد الصفحات', value: num(book.pageCount) },
      { label: 'ملاحظات', value: (book.notes || '').trim() || null, wide: true }
    ];
  }

  /** Visitors see only what is recorded; admins also see the gaps, as a prompt to complete the record. */
  visibleDetails(book: Book): Detail[] {
    return this.details(book).filter(d => this.isAdmin || this.hasValue(d));
  }

  hasValue(d: Detail): boolean {
    return d.people ? d.people.length > 0 : d.value !== null;
  }

  sameShelfParams(book: Book): Record<string, string> | null {
    const a = book.address || ({} as Book['address']);
    if (!a.roomNumber || !a.shelfNumber) return null;
    const params: Record<string, string> = { room: String(a.roomNumber), shelf: String(a.shelfNumber) };
    if (a.wallNumber) params['wall'] = String(a.wallNumber);
    return params;
  }

  async deleteBook(book: Book): Promise<void> {
    const ok = await this.dialog.ask({
      title: 'حذف هذا الكتاب؟',
      message: `«${book.title}» سيُحذف من الفهرس نهائياً، ولا يمكن التراجع عن ذلك.`,
      confirmText: 'حذف الكتاب',
      tone: 'danger'
    });
    if (!ok || !book._id) return;
    this.deleting = true;
    this.bookService.deleteBook(book._id).subscribe({
      next: () => {
        this.toast.success(`تم حذف «${book.title}»`);
        this.router.navigateByUrl(this.backUrl);
      },
      error: err => {
        this.deleting = false;
        this.toast.apiError(err, 'تعذّر حذف الكتاب. حاول مرة أخرى.');
      }
    });
  }

  private people(list: { name?: string }[] | undefined, field: string): Person[] {
    return (list || []).filter(p => p?.name).map(p => ({ name: p.name!, field }));
  }
}
