import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, Subscription, debounceTime, distinctUntilChanged, of, switchMap, catchError, map } from 'rxjs';
import { DisplayService } from '../../../services/display.service';
import { BookService } from '../../../services/book.service';
import { Book } from '../../../models/book.model';
import {
  DEFAULT_DISPLAY_SETTINGS, DISPLAY_TEMPLATES, DISPLAY_THEMES, DISPLAY_TRANSITIONS, DisplaySettings, DisplaySlide,
  DisplayTemplateDef, DisplayTemplateId, DisplayTheme, SlideStatus, TemplateField, clockParts, formatDay, getTemplate,
  slideFromTemplate, slideStatus
} from '../../../models/display.model';

interface Editor {
  /** null while creating a new slide. */
  id: string | null;
  step: 'template' | 'form';
  slide: DisplaySlide;
  file: File | null;
  filePreview: string | null;
  removeImage: boolean;
  saving: boolean;
  error: string;
}

const MAX_UPLOAD_MB = 15;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

@Component({
  selector: 'app-display-admin',
  templateUrl: './display-admin.component.html',
  styleUrls: ['./display-admin.component.css']
})
export class DisplayAdminComponent implements OnInit, OnDestroy {
  readonly templates = DISPLAY_TEMPLATES;
  readonly themes = DISPLAY_THEMES;
  readonly transitions = DISPLAY_TRANSITIONS;
  readonly hijriOffsets = [-2, -1, 0, 1, 2];
  readonly acceptTypes = ACCEPTED_TYPES.join(',');
  /** Each template filled with its sample content, for the gallery. */
  readonly samples = Object.fromEntries(DISPLAY_TEMPLATES.map(t => [t.id, slideFromTemplate(t.id)])) as Record<DisplayTemplateId, DisplaySlide>;
  readonly screenUrl = `${location.origin}/display`;

  slides: DisplaySlide[] = [];
  settings: DisplaySettings = { ...DEFAULT_DISPLAY_SETTINGS };
  loading = true;
  loadError = '';
  savingSettings = false;
  reordering = false;
  busy = new Set<string>();

  editor: Editor | null = null;
  dragOver = false;
  preview: { slide: DisplaySlide; imageUrl: string | null } | null = null;

  toast = '';
  toastError = false;
  private toastTimer?: ReturnType<typeof setTimeout>;

  // Book picker (featured-book template)
  bookQuery = '';
  bookResults: Book[] = [];
  bookSearching = false;
  private bookSearch$ = new Subject<string>();
  private bookSub?: Subscription;

  constructor(private display: DisplayService, private bookService: BookService) { }

  ngOnInit(): void {
    this.load();
    this.bookSub = this.bookSearch$.pipe(
      map(term => term.trim()),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (term.length < 2) return of([] as Book[]);
        this.bookSearching = true;
        return this.bookService.getAllBooks('title', term, 1, 8).pipe(
          map(res => res.books || []),
          catchError(() => of([] as Book[]))
        );
      })
    ).subscribe(books => {
      this.bookSearching = false;
      this.bookResults = books;
    });
  }

  ngOnDestroy(): void {
    this.bookSub?.unsubscribe();
    clearTimeout(this.toastTimer);
    this.revokePreview();
    this.lockScroll(false);
  }

  load(): void {
    this.loading = true;
    this.loadError = '';
    this.display.getAdminData().subscribe({
      next: data => {
        this.slides = data.slides || [];
        this.settings = { ...DEFAULT_DISPLAY_SETTINGS, ...data.settings };
        this.loading = false;
      },
      error: err => {
        this.loadError = this.errorText(err);
        this.loading = false;
      }
    });
  }

  // ---------- list helpers ----------

  mediaUrl(id: string | null | undefined): string | null {
    return this.display.mediaUrl(id);
  }

  templateOf(id: DisplayTemplateId): DisplayTemplateDef {
    return getTemplate(id);
  }

  slideLabel(slide: DisplaySlide): string {
    return slide.title || slide.body || slide.subtitle || getTemplate(slide.template).name;
  }

  statusOf(slide: DisplaySlide): SlideStatus {
    return slideStatus(slide);
  }

  statusText(slide: DisplaySlide): string {
    switch (slideStatus(slide)) {
      case 'live': return 'تُعرض الآن';
      case 'off': return 'معطّلة';
      case 'upcoming': return `تبدأ ${formatDay(slide.startDate)}`;
      case 'expired': return 'انتهت مدتها';
    }
  }

  scheduleText(slide: DisplaySlide): string {
    if (slide.startDate && slide.endDate) return `من ${formatDay(slide.startDate)} إلى ${formatDay(slide.endDate)}`;
    if (slide.startDate) return `من ${formatDay(slide.startDate)}`;
    return `حتى ${formatDay(slide.endDate)}`;
  }

  get liveCount(): number {
    return this.slides.filter(s => slideStatus(s) === 'live').length;
  }

  get hijriToday(): string {
    return clockParts(new Date(), this.settings.hijriOffset).hijri;
  }

  trackSlide(_: number, slide: DisplaySlide): string | undefined {
    return slide._id;
  }

  // ---------- list actions ----------

  toggleActive(slide: DisplaySlide): void {
    const id = slide._id!;
    this.busy.add(id);
    this.display.updateSlide(id, { isActive: !slide.isActive }).subscribe({
      next: saved => {
        this.replaceSlide(saved);
        this.busy.delete(id);
      },
      error: err => {
        this.busy.delete(id);
        this.flash(this.errorText(err), true);
      }
    });
  }

  move(index: number, direction: -1 | 1): void {
    const target = index + direction;
    if (target < 0 || target >= this.slides.length || this.reordering) return;
    const previous = this.slides;
    const reordered = [...this.slides];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    this.slides = reordered;
    this.reordering = true;
    this.display.reorderSlides(reordered.map(s => s._id!)).subscribe({
      next: () => (this.reordering = false),
      error: err => {
        this.slides = previous;
        this.reordering = false;
        this.flash(this.errorText(err), true);
      }
    });
  }

  remove(slide: DisplaySlide): void {
    if (!confirm(`حذف الشريحة «${this.slideLabel(slide)}» نهائياً؟`)) return;
    const id = slide._id!;
    this.busy.add(id);
    this.display.deleteSlide(id).subscribe({
      next: () => {
        this.slides = this.slides.filter(s => s._id !== id);
        this.busy.delete(id);
        this.flash('تم حذف الشريحة');
      },
      error: err => {
        this.busy.delete(id);
        this.flash(this.errorText(err), true);
      }
    });
  }

  // ---------- settings ----------

  saveSettings(): void {
    this.savingSettings = true;
    this.display.updateSettings(this.settings).subscribe({
      next: saved => {
        this.settings = { ...DEFAULT_DISPLAY_SETTINGS, ...saved };
        this.savingSettings = false;
        this.flash('تم حفظ إعدادات الشاشة');
      },
      error: err => {
        this.savingSettings = false;
        this.flash(this.errorText(err), true);
      }
    });
  }

  copyScreenUrl(): void {
    navigator.clipboard?.writeText(this.screenUrl).then(
      () => this.flash('تم نسخ رابط الشاشة'),
      () => this.flash('تعذّر النسخ، انسخ الرابط يدوياً', true)
    );
  }

  // ---------- editor ----------

  newSlide(): void {
    this.openEditor({ id: null, step: 'template', slide: slideFromTemplate('announcement') });
  }

  /** "Upload an image directly": straight to an image-only slide with the chosen file. */
  quickUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const problem = this.fileProblem(file);
    if (problem) {
      this.flash(problem, true);
      return;
    }
    this.openEditor({ id: null, step: 'form', slide: slideFromTemplate('image') });
    this.setFile(file);
  }

  edit(slide: DisplaySlide): void {
    this.openEditor({ id: slide._id!, step: 'form', slide: { ...slide } });
  }

  chooseTemplate(id: DisplayTemplateId): void {
    if (!this.editor) return;
    this.editor.slide = slideFromTemplate(id);
    this.editor.step = 'form';
  }

  /** Switching template in the form keeps whatever was typed. */
  changeTemplate(id: DisplayTemplateId): void {
    if (!this.editor) return;
    const slide = this.editor.slide;
    slide.template = id;
    if (id === 'image') slide.imageFit = 'contain';
    else if (!getTemplate(id).fitChoice) slide.imageFit = 'cover';
  }

  setTheme(theme: DisplayTheme): void {
    if (this.editor) this.editor.slide.theme = theme;
  }

  get editorTemplate(): DisplayTemplateDef | null {
    return this.editor ? getTemplate(this.editor.slide.template) : null;
  }

  get editorImage(): string | null {
    const ed = this.editor;
    if (!ed) return null;
    if (ed.filePreview) return ed.filePreview;
    return ed.removeImage ? null : this.mediaUrl(ed.slide.image);
  }

  onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.trySetFile(file);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.trySetFile(file);
  }

  clearImage(): void {
    if (!this.editor) return;
    this.revokePreview();
    this.editor.file = null;
    this.editor.filePreview = null;
    this.editor.removeImage = !!this.editor.slide.image;
  }

  pickBook(book: Book): void {
    if (!this.editor) return;
    const slide = this.editor.slide;
    const address = book.address || ({} as Book['address']);
    const place = [
      address.roomNumber && `الغرفة ${address.roomNumber}`,
      address.wallNumber && `الاستاند ${address.wallNumber}`,
      address.shelfNumber && `الرف ${address.shelfNumber}`
    ].filter(Boolean).join(' - ');

    slide.title = (book.title || '').slice(0, 150);
    slide.attribution = (book.authors || []).map(a => a.name).filter(Boolean).join('، ').slice(0, 150);
    if (place) slide.location = place;
    this.bookQuery = '';
    this.bookResults = [];
  }

  authorsOf(book: Book): string {
    return (book.authors || []).map(a => a.name).filter(Boolean).join('، ');
  }

  onBookQuery(term: string): void {
    this.bookSearch$.next(term);
  }

  save(): void {
    const ed = this.editor;
    if (!ed || ed.saving) return;
    const problem = this.validate(ed);
    if (problem) {
      ed.error = problem;
      return;
    }
    ed.saving = true;
    ed.error = '';
    const request$ = ed.id
      ? this.display.updateSlide(ed.id, ed.slide, ed.file, ed.removeImage && !ed.file)
      : this.display.createSlide(ed.slide, ed.file);

    request$.subscribe({
      next: saved => {
        if (ed.id) this.replaceSlide(saved);
        else this.slides = [...this.slides, saved];
        this.closeEditor();
        this.flash('تم حفظ الشريحة');
      },
      error: err => {
        ed.saving = false;
        ed.error = this.errorText(err);
      }
    });
  }

  closeEditor(): void {
    this.revokePreview();
    this.editor = null;
    this.bookQuery = '';
    this.bookResults = [];
    this.lockScroll(false);
  }

  // ---------- full-size preview ----------

  openPreview(slide: DisplaySlide, imageUrl: string | null = this.mediaUrl(slide.image)): void {
    this.preview = { slide: { ...slide }, imageUrl };
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.preview) this.preview = null;
    else if (this.editor && !this.editor.saving) this.closeEditor();
  }

  // ---------- internals ----------

  private openEditor(partial: Pick<Editor, 'id' | 'step' | 'slide'>): void {
    this.revokePreview();
    this.editor = { ...partial, file: null, filePreview: null, removeImage: false, saving: false, error: '' };
    this.lockScroll(true);
  }

  private trySetFile(file: File): void {
    const problem = this.fileProblem(file);
    if (problem) {
      if (this.editor) this.editor.error = problem;
      return;
    }
    this.setFile(file);
  }

  private setFile(file: File): void {
    if (!this.editor) return;
    this.revokePreview();
    this.editor.file = file;
    this.editor.filePreview = URL.createObjectURL(file);
    this.editor.removeImage = false;
    this.editor.error = '';
  }

  private fileProblem(file: File): string {
    if (!ACCEPTED_TYPES.includes(file.type)) return 'نوع الملف غير مدعوم. استخدم صورة JPG أو PNG أو WEBP.';
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return `حجم الصورة أكبر من ${MAX_UPLOAD_MB} ميغابايت`;
    return '';
  }

  private revokePreview(): void {
    if (this.editor?.filePreview) URL.revokeObjectURL(this.editor.filePreview);
  }

  private validate(ed: Editor): string {
    const template = getTemplate(ed.slide.template);
    const missing = template.fields.find((f: TemplateField) => f.required && !(ed.slide[f.key] || '').trim());
    if (missing) return `حقل «${missing.label}» مطلوب`;
    if (template.image === 'required' && !this.editorImage) return 'هذا القالب يحتاج إلى صورة';
    const duration = Number(ed.slide.duration);
    if (!duration || duration < 3 || duration > 600) return 'مدة العرض بين 3 و 600 ثانية';
    if (ed.slide.startDate && ed.slide.endDate && ed.slide.startDate > ed.slide.endDate) {
      return 'تاريخ النهاية قبل تاريخ البداية';
    }
    return '';
  }

  private replaceSlide(saved: DisplaySlide): void {
    this.slides = this.slides.map(s => (s._id === saved._id ? saved : s));
  }

  private lockScroll(lock: boolean): void {
    document.body.classList.toggle('overflow-hidden', lock);
  }

  private flash(message: string, isError = false): void {
    this.toast = message;
    this.toastError = isError;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toast = ''), 3500);
  }

  private errorText(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) return 'تعذّر الاتصال بالخادم';
      if (err.status === 403) return 'هذه الصفحة للمشرفين فقط';
      const body = err.error as { error?: string; message?: string } | null;
      if (body?.error && err.status < 500) return body.error;
      if (body?.message && err.status < 500) return body.message;
    }
    return 'حدث خطأ غير متوقع، حاول مرة أخرى';
  }
}
