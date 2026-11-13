import { Component, OnInit } from '@angular/core';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TaxCategory, TaxonomyService } from '../../shared/services/taxonomy.service';
import { normalizeArabic } from '../../shared/utils/arabic';

interface CategoryView extends TaxCategory {
  /** Subjects to show (all, or the ones matching the search). */
  shownSubjects: TaxCategory['subjects'];
  /** The category matched by its own title (vs. only through a subject). */
  titleMatch: boolean;
}

/**
 * /categories — every section (القسم) with its subjects (المواضيع) and book counts.
 * Search filters sections and subjects instantly (Arabic-normalized: hamza/taa marbuta/diacritics).
 */
@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css']
})
export class CategoriesComponent implements OnInit {
  state: 'loading' | 'ok' | 'error' = 'loading';
  hasCounts = false;
  search = '';
  open = new Set<string>();
  private all: TaxCategory[] = [];
  view: CategoryView[] = [];

  constructor(private taxonomyService: TaxonomyService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.state = 'loading';
    this.taxonomyService.load().pipe(catchError(() => of(null))).subscribe(tax => {
      if (!tax) { this.state = 'error'; return; }
      this.hasCounts = tax.hasCounts;
      this.all = [...tax.categories].sort((a, b) => (b.booksCount ?? 0) - (a.booksCount ?? 0) || a.title.localeCompare(b.title, 'ar'));
      this.state = 'ok';
      this.applySearch();
    });
  }

  applySearch(): void {
    const q = normalizeArabic(this.search);
    if (!q) {
      this.view = this.all.map(c => ({ ...c, shownSubjects: c.subjects, titleMatch: false }));
      return;
    }
    this.view = this.all
      .map(c => {
        const titleMatch = normalizeArabic(c.title).includes(q);
        const subjects = c.subjects.filter(s => normalizeArabic(s.title).includes(q));
        return { ...c, shownSubjects: titleMatch ? c.subjects : subjects, titleMatch };
      })
      .filter(c => c.titleMatch || c.shownSubjects.length > 0);
    // While searching, open the sections whose subjects matched, so the matches are visible.
    this.open = new Set(this.view.filter(c => !c.titleMatch).map(c => c._id));
  }

  clearSearch(): void {
    this.search = '';
    this.open.clear();
    this.applySearch();
  }

  toggle(id: string): void {
    this.open.has(id) ? this.open.delete(id) : this.open.add(id);
  }

  get totalBooks(): number {
    return this.all.reduce((n, c) => n + (c.booksCount ?? 0), 0);
  }

  /** Splits text around the search match for highlighting. */
  parts(text: string): { text: string; hit: boolean }[] {
    const q = normalizeArabic(this.search);
    if (!q) return [{ text, hit: false }];
    // Match on the normalized text, then map back by position (normalization keeps length for most letters).
    const norm = normalizeArabic(text);
    const i = norm.indexOf(q);
    if (i < 0 || norm.length !== text.trim().replace(/\s+/g, ' ').length) return [{ text, hit: false }];
    const t = text.trim().replace(/\s+/g, ' ');
    return [
      { text: t.slice(0, i), hit: false },
      { text: t.slice(i, i + q.length), hit: true },
      { text: t.slice(i + q.length), hit: false }
    ].filter(p => p.text);
  }

  trackById = (_: number, c: { _id: string }) => c._id;
}
