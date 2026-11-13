import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { normalizeArabic } from '../utils/arabic';

export interface TaxSubject {
  _id: string;
  title: string;
  /** Books filed under this subject within the parent category (when the API provides counts). */
  booksCount?: number;
}

export interface TaxCategory {
  _id: string;
  title: string;
  booksCount?: number;
  subjects: TaxSubject[];
}

export interface Taxonomy {
  categories: TaxCategory[];
  subjects: TaxSubject[];
  /** True when the API returned book counts (new backend). */
  hasCounts: boolean;
}

/**
 * Categories (الأقسام) and subjects (المواضيع), loaded once per session and shared by every page
 * (home tiles, categories page, book filters, legacy-link resolution).
 */
@Injectable({ providedIn: 'root' })
export class TaxonomyService {
  private readonly api = environment.apiUrl;
  private cache$?: Observable<Taxonomy>;

  constructor(private http: HttpClient) {}

  load(): Observable<Taxonomy> {
    if (!this.cache$) {
      this.cache$ = combineLatest([
        this.http.get<any[]>(`${this.api}/categories`),
        this.http.get<any>(`${this.api}/subjects`)
      ]).pipe(
        map(([rawCategories, rawSubjects]) => this.build(rawCategories, rawSubjects)),
        shareReplay({ bufferSize: 1, refCount: false }),
        catchError(err => {
          this.cache$ = undefined; // allow a retry after a failure
          throw err;
        })
      );
    }
    return this.cache$;
  }

  /** Forget the cache (after creating/renaming a category or subject). */
  invalidate(): void {
    this.cache$ = undefined;
  }

  /** Finds a category by id or by (normalized) exact title. */
  findCategory(tax: Taxonomy, idOrTitle: string): TaxCategory | undefined {
    return this.findIn(tax.categories, idOrTitle);
  }

  findSubject(tax: Taxonomy, idOrTitle: string): TaxSubject | undefined {
    return this.findIn(tax.subjects, idOrTitle);
  }

  private findIn<T extends { _id: string; title: string }>(list: T[], idOrTitle: string): T | undefined {
    if (!idOrTitle) return undefined;
    const byId = list.find(item => item._id === idOrTitle);
    if (byId) return byId;
    const wanted = normalizeArabic(idOrTitle);
    return list.find(item => normalizeArabic(item.title) === wanted);
  }

  private build(rawCategories: any[], rawSubjects: any): Taxonomy {
    const subjectList: any[] = Array.isArray(rawSubjects) ? rawSubjects : (rawSubjects?.subjects ?? rawSubjects?.data ?? []);
    const subjectsById = new Map<string, TaxSubject>(
      subjectList.map(s => [String(s._id), { _id: String(s._id), title: s.title }])
    );
    const hasCounts = (rawCategories || []).some(c => typeof c.booksCount === 'number');

    const categories: TaxCategory[] = (rawCategories || []).map(c => {
      const counts: Record<string, number> = c.subjectBookCounts || {};
      const ids: string[] = [...new Set<string>((c.subjects || []).map((s: any) => String(s?._id ?? s)))];
      const subjects = ids
        .map(id => subjectsById.get(id))
        .filter((s): s is TaxSubject => !!s)
        .map(s => ({ ...s, booksCount: hasCounts ? counts[s._id] ?? 0 : undefined }))
        // Subjects with books first (by count), then alphabetical.
        .sort((a, b) => (b.booksCount ?? 0) - (a.booksCount ?? 0) || a.title.localeCompare(b.title, 'ar'));
      return { _id: String(c._id), title: c.title, booksCount: hasCounts ? c.booksCount : undefined, subjects };
    });

    const subjects = [...subjectsById.values()].sort((a, b) => a.title.localeCompare(b.title, 'ar'));
    return { categories, subjects, hasCounts };
  }
}

/** Fallback used by pages that must render even when taxonomy fails to load. */
export const EMPTY_TAXONOMY: Taxonomy = { categories: [], subjects: [], hasCounts: false };
export const taxonomyOrEmpty = (source: Observable<Taxonomy>) => source.pipe(catchError(() => of(EMPTY_TAXONOMY)));
