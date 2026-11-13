import {
  Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild, forwardRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable } from 'rxjs';
import { normalizeArabic } from '../../utils/arabic';

/** Shape of a selected value: { _id, name } for people, { _id, title } for publishers/sections/subjects. */
export type PickedItem = { _id?: string; name?: string; title?: string };

let nextId = 0;

/**
 * Searchable picker for people, publishers, sections and subjects (ARIA 1.2 combobox + listbox).
 *   <app-entity-picker name="authors" [(ngModel)]="book.authors" [options]="authors" labelKey="name"
 *       [multiple]="true" label="المؤلف" newItemLabel="مؤلف" [createFn]="createAuthor"></app-entity-picker>
 *
 * - Value: an array of {_id, name|title} when [multiple], otherwise one object or null (a new
 *   array/object is emitted on every change, so dirty checks and change detection work).
 * - Matching is Arabic-normalized (hamza, taa marbuta, diacritics); prefix matches come first and at
 *   most `maxResults` options render, so lists of thousands stay fast.
 * - "إضافة «…»" appears only when no option matches the text exactly and a createFn is given.
 * - Keyboard: ↑/↓, Home/End, Enter to choose, Esc to close (then to clear the text), Backspace on an
 *   empty input removes the last chip.
 */
@Component({
  selector: 'app-entity-picker',
  standalone: false,
  templateUrl: './entity-picker.component.html',
  styleUrls: ['./entity-picker.component.css'],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => EntityPickerComponent), multi: true }]
})
export class EntityPickerComponent implements ControlValueAccessor, OnChanges {
  @Input() options: any[] = [];
  @Input() labelKey: 'name' | 'title' = 'name';
  @Input() multiple = false;
  @Input() label = '';
  @Input() placeholder = 'اكتب للبحث…';
  /** Noun for the create option: "إضافة «X» مؤلفاً جديداً" reads as "إضافة «X» (مؤلف جديد)". */
  @Input() newItemLabel = '';
  @Input() createFn?: (text: string) => Observable<any>;
  @Input() required = false;
  @Input() hint?: string;
  @Input() errorText?: string | null;
  @Input() maxResults = 50;
  /** Ids to list first (e.g. the subjects of the chosen section). */
  @Input() preferredIds?: string[] | null;
  @Input() inputId = `picker-${++nextId}`;
  @Output() created = new EventEmitter<any>();

  @ViewChild('input', { static: true }) inputRef!: ElementRef<HTMLInputElement>;

  get listId(): string { return `${this.inputId}-list`; }
  selected: PickedItem[] = [];
  text = '';
  open = false;
  activeIndex = -1;
  busy = false;
  createError = '';
  disabled = false;
  filtered: any[] = [];

  private normalized: { item: any; key: string }[] = [];
  private onChange: (v: any) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] || changes['labelKey']) {
      const normKey = this.labelKey === 'name' ? 'normalizedName' : 'normalizedTitle';
      this.normalized = (this.options || [])
        .filter(o => o && o[this.labelKey])
        .map(item => ({ item, key: item[normKey] || normalizeArabic(item[this.labelKey]) }));
      if (this.open) this.refilter();
    }
  }

  // ---------- ControlValueAccessor ----------

  writeValue(value: any): void {
    if (this.multiple) this.selected = Array.isArray(value) ? value.filter(Boolean).map((v: any) => ({ ...v })) : [];
    else this.selected = value && (value._id || value[this.labelKey]) ? [{ ...value }] : [];
  }

  registerOnChange(fn: (v: any) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

  // ---------- view helpers ----------

  labelOf(item: PickedItem | any): string {
    return item?.[this.labelKey] ?? '';
  }

  get activeOptionId(): string | null {
    return this.open && this.activeIndex >= 0 ? `${this.inputId}-opt-${this.activeIndex}` : null;
  }

  get canCreate(): boolean {
    const t = this.text.trim();
    if (!this.createFn || !t) return false;
    const key = normalizeArabic(t);
    return !this.normalized.some(n => n.key === key);
  }

  /** Index of the "create" row in keyboard order (after the options). */
  get createIndex(): number {
    return this.canCreate ? this.filtered.length : -1;
  }

  get optionCount(): number {
    return this.filtered.length + (this.canCreate ? 1 : 0);
  }

  get placeholderText(): string {
    if (!this.multiple && this.selected.length) return 'اكتب لتغيير الاختيار…';
    return this.placeholder;
  }

  // ---------- interaction ----------

  onInput(value: string): void {
    this.text = value;
    this.createError = '';
    this.open = true;
    this.refilter();
    this.activeIndex = this.filtered.length ? 0 : (this.canCreate ? 0 : -1);
  }

  onFocus(): void {
    if (this.disabled) return;
    this.open = true;
    this.refilter();
  }

  onBlur(): void {
    this.open = false;
    this.activeIndex = -1;
    this.onTouched();
  }

  onKeydown(event: KeyboardEvent): void {
    const count = this.optionCount;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.open) { this.open = true; this.refilter(); }
        this.activeIndex = count ? (this.activeIndex + 1) % count : -1;
        this.scrollActiveIntoView();
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!this.open) { this.open = true; this.refilter(); }
        this.activeIndex = count ? (this.activeIndex - 1 + count) % count : -1;
        this.scrollActiveIntoView();
        break;
      case 'Home':
        if (this.open && count) { event.preventDefault(); this.activeIndex = 0; this.scrollActiveIntoView(); }
        break;
      case 'End':
        if (this.open && count) { event.preventDefault(); this.activeIndex = count - 1; this.scrollActiveIntoView(); }
        break;
      case 'Enter':
        if (this.open && this.activeIndex >= 0) {
          event.preventDefault(); // never submit the surrounding form while choosing
          this.activeIndex === this.createIndex ? this.create() : this.choose(this.filtered[this.activeIndex]);
        } else if (this.text.trim()) {
          event.preventDefault();
        }
        break;
      case 'Escape':
        if (this.open) { event.preventDefault(); event.stopPropagation(); this.open = false; this.activeIndex = -1; }
        else if (this.text) { event.preventDefault(); this.text = ''; }
        break;
      case 'Backspace':
        if (!this.text && this.selected.length && this.multiple) this.remove(this.selected.length - 1);
        break;
    }
  }

  choose(item: any): void {
    if (!item) return;
    const picked: PickedItem = { _id: item._id, [this.labelKey]: item[this.labelKey] };
    if (this.multiple) {
      if (!this.selected.some(s => s._id && s._id === picked._id)) this.selected = [...this.selected, picked];
    } else {
      this.selected = [picked];
    }
    this.text = '';
    this.emit();
    if (this.multiple) {
      this.refilter();
      this.activeIndex = this.filtered.length ? 0 : -1;
    } else {
      this.open = false;
      this.activeIndex = -1;
    }
  }

  remove(index: number): void {
    this.selected = this.selected.filter((_, i) => i !== index);
    this.emit();
    this.inputRef.nativeElement.focus();
  }

  create(): void {
    const name = this.text.trim();
    if (!this.createFn || !name || this.busy) return;
    this.busy = true;
    this.createError = '';
    this.createFn(name).subscribe({
      next: entity => {
        this.busy = false;
        const item = { ...entity, [this.labelKey]: entity?.[this.labelKey] ?? name };
        this.created.emit(item);
        this.choose(item);
      },
      error: () => {
        this.busy = false;
        this.createError = `تعذّرت إضافة «${name}». حاول مرة أخرى.`;
      }
    });
  }

  private emit(): void {
    const value = this.multiple ? this.selected.map(s => ({ ...s })) : (this.selected[0] ? { ...this.selected[0] } : null);
    this.onChange(value);
  }

  private refilter(): void {
    const q = normalizeArabic(this.text);
    const taken = new Set(this.multiple ? this.selected.map(s => s._id).filter(Boolean) : []);
    const preferred = new Set(this.preferredIds || []);
    const starts: any[] = [];
    const contains: any[] = [];
    for (const { item, key } of this.normalized) {
      if (taken.has(item._id)) continue;
      if (!q) { (preferred.has(item._id) ? starts : contains).push(item); continue; }
      const at = key.indexOf(q);
      if (at === 0 || key.includes(' ' + q)) starts.push(item);
      else if (at > 0) contains.push(item);
    }
    const byPreference = (a: any, b: any) => Number(preferred.has(b._id)) - Number(preferred.has(a._id));
    if (preferred.size) { starts.sort(byPreference); contains.sort(byPreference); }
    this.filtered = [...starts, ...contains].slice(0, this.maxResults);
    if (this.activeIndex >= this.optionCount) this.activeIndex = this.optionCount - 1;
  }

  private scrollActiveIntoView(): void {
    setTimeout(() => {
      const id = this.activeOptionId;
      if (id) document.getElementById(id)?.scrollIntoView({ block: 'nearest' });
    });
  }

  trackById = (i: number, item: any) => item?._id ?? i;
}
