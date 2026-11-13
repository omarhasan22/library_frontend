/**
 * The book list's state lives in the URL, in readable parameters:
 *
 *   /books?q=الفقه&category=<id>&subject=<id>&room=3&wall=د&shelf=1&f=authors:ابن تيمية&page=2&dir=desc&view=grid
 *
 * This module is the single place that
 *   - parses those parameters (and converts old links: base64 `filters=`, `search=`, `category=<title>`,
 *     `subjectTitle=`),
 *   - turns the state into canonical URL parameters, and
 *   - maps it onto the existing API: GET /books?query=&searchTerm=&page=&limit=&sortDirection=&sort=
 *     (query='advanced' means searchTerm is a JSON array of { field, value }, all of which must match).
 * Pure functions, no Angular, so it is unit-tested directly (book-query.spec.ts).
 */
import { normalizeArabic, toLatinDigits } from '../shared/utils/arabic';

export interface FilterRow {
  field: string;
  value: string;
}

export interface BookQuery {
  /** Free text, matched against every field. */
  q: string;
  /** Category (القسم) id — exact. */
  category: string;
  /** Subject (الموضوع) id — exact. */
  subject: string;
  /** Exact location parts. */
  room: string;
  wall: string;
  shelf: string;
  /** Advanced rows: field "contains" value (field from ADVANCED_FIELDS). */
  rows: FilterRow[];
  page: number;
  dir: 'asc' | 'desc';
  /** '' = shelf order (room → shelf → wall → number); 'recent' = newest additions first. */
  sort: '' | 'recent';
  view: 'table' | 'grid';
}

export const DEFAULT_QUERY: Readonly<BookQuery> = Object.freeze({
  q: '', category: '', subject: '', room: '', wall: '', shelf: '',
  rows: [], page: 1, dir: 'asc', sort: '', view: 'table'
}) as BookQuery;

/** Fields offered in "بحث متقدم" (each row is a "contains" match). */
export const ADVANCED_FIELDS: { key: string; label: string }[] = [
  { key: 'title', label: 'العنوان' },
  { key: 'authors', label: 'المؤلف' },
  { key: 'commentators', label: 'الشارح' },
  { key: 'muhashis', label: 'المحشي' },
  { key: 'editors', label: 'المحقق' },
  { key: 'caretakers', label: 'المعتني' },
  { key: 'publishers', label: 'الناشر' },
  { key: 'category', label: 'القسم (يحتوي)' },
  { key: 'subject', label: 'الموضوع (يحتوي)' },
  { key: 'publicationYear', label: 'سنة النشر' },
  { key: 'editionNumber', label: 'رقم الطبعة' },
  { key: 'bookNumber', label: 'رقم الكتاب' },
  { key: 'notes', label: 'الملاحظات' },
  { key: 'all', label: 'جميع الحقول' }
];

const FIELD_LABELS: Record<string, string> = Object.fromEntries(ADVANCED_FIELDS.map(f => [f.key, f.label]));
// Old links may carry location rows (they used substring matching); keep their labels readable.
Object.assign(FIELD_LABELS, { roomNumber: 'الغرفة', wallNumber: 'الاستاند', shelfNumber: 'الرف', subcategory: 'الموضوع' });

export function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key;
}

const OBJECT_ID = /^[a-f\d]{24}$/i;
export const isObjectId = (v: string) => OBJECT_ID.test(v);

/** Titles from old links that still need to be resolved to ids (see resolveLegacy). */
export interface LegacyTitles {
  categoryTitles: string[];
  subjectTitles: string[];
}

export interface ParsedBookQuery {
  query: BookQuery;
  legacy: LegacyTitles;
  /** True when the URL used an old format and should be rewritten to the canonical one. */
  isLegacy: boolean;
}

type Params = Record<string, string | string[] | undefined | null>;

const first = (v: Params[string]): string => (Array.isArray(v) ? v[0] ?? '' : v ?? '').toString();
const all = (v: Params[string]): string[] => (Array.isArray(v) ? v : v ? [v] : []).map(String);
const clean = (v: string) => v.replace(/\s+/g, ' ').trim();

/** UTF-8-safe base64, as written by the previous book list (btoa(unescape(encodeURIComponent(s)))). */
export function decodeLegacyFilters(encoded: string): FilterRow[] {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((f: any) => ({ field: String(f?.field ?? 'all'), value: String(f?.value ?? '') }))
      .filter(f => f.value.trim() !== '');
  } catch {
    return [];
  }
}

/** Splits "field:value" at the first colon (values may contain colons). */
export function parseRow(raw: string): FilterRow | null {
  const i = raw.indexOf(':');
  if (i <= 0) return null;
  const field = raw.slice(0, i).trim();
  const value = clean(raw.slice(i + 1));
  return field && value ? { field, value } : null;
}

export function parseBookQuery(params: Params): ParsedBookQuery {
  const query: BookQuery = { ...DEFAULT_QUERY, rows: [] };
  const legacy: LegacyTitles = { categoryTitles: [], subjectTitles: [] };
  let isLegacy = false;

  query.q = clean(first(params['q']));
  query.room = clean(first(params['room']));
  query.wall = clean(first(params['wall']));
  query.shelf = clean(first(params['shelf']));
  query.rows = all(params['f']).map(parseRow).filter((r): r is FilterRow => !!r);

  const page = parseInt(toLatinDigits(first(params['page'])), 10);
  query.page = page >= 1 ? page : 1;
  query.dir = first(params['dir']) === 'desc' ? 'desc' : 'asc';
  query.sort = first(params['sort']) === 'recent' ? 'recent' : '';
  query.view = first(params['view']) === 'grid' ? 'grid' : 'table';

  // category / subject: ids; old links put titles here.
  const category = clean(first(params['category']));
  if (category) {
    if (isObjectId(category)) query.category = category;
    else { legacy.categoryTitles.push(category); isLegacy = true; }
  }
  const subject = clean(first(params['subject']));
  if (subject) {
    if (isObjectId(subject)) query.subject = subject;
    else { legacy.subjectTitles.push(subject); isLegacy = true; }
  }

  // --- Old formats ---
  const search = clean(first(params['search']));
  if (search) {
    if (!query.q) query.q = search;
    isLegacy = true;
  }
  const subjectTitle = clean(first(params['subjectTitle']));
  if (subjectTitle) {
    legacy.subjectTitles.push(subjectTitle);
    isLegacy = true;
  }
  if (first(params['categoryTitle'])) isLegacy = true; // was always ignored by the old list

  const encoded = first(params['filters']);
  if (encoded) {
    isLegacy = true;
    absorbLegacyRows(query, legacy, decodeLegacyFilters(encoded));
  }

  return { query, legacy, isLegacy };
}

/**
 * Folds rows from an old link (or the old localStorage key) into the query:
 * the first "all" row becomes q, category/subject rows become titles to resolve, the rest stay rows.
 */
export function absorbLegacyRows(query: BookQuery, legacy: LegacyTitles, rows: FilterRow[]): void {
  for (const row of rows) {
    const value = clean(row.value);
    if (!value) continue;
    if (row.field === 'all' && !query.q) query.q = value;
    else if (row.field === 'category') legacy.categoryTitles.push(value);
    else if (row.field === 'subject' || row.field === 'subcategory') legacy.subjectTitles.push(value);
    else query.rows.push({ field: row.field, value });
  }
}

export interface TitleLookup {
  categories: { _id: string; title: string }[];
  subjects: { _id: string; title: string }[];
}

/**
 * Resolves legacy titles to ids where a category/subject has exactly that (normalized) title.
 * Titles that match nothing exactly stay as "contains" rows, preserving the old substring behaviour.
 */
export function resolveLegacy(query: BookQuery, legacy: LegacyTitles, lookup: TitleLookup): BookQuery {
  const out: BookQuery = { ...query, rows: [...query.rows] };
  const find = (list: { _id: string; title: string }[], title: string) => {
    const wanted = normalizeArabic(title);
    return list.find(item => normalizeArabic(item.title) === wanted);
  };
  for (const title of legacy.categoryTitles) {
    const hit = find(lookup.categories, title);
    if (hit && !out.category) out.category = hit._id;
    else if (!hit) out.rows.push({ field: 'category', value: title });
  }
  for (const title of legacy.subjectTitles) {
    const hit = find(lookup.subjects, title);
    if (hit && !out.subject) out.subject = hit._id;
    else if (!hit) out.rows.push({ field: 'subject', value: title });
  }
  return out;
}

/** Canonical URL parameters (defaults omitted, so URLs stay short and comparable). */
export function toQueryParams(query: BookQuery): Record<string, string | string[]> {
  const p: Record<string, string | string[]> = {};
  if (query.q) p['q'] = query.q;
  if (query.category) p['category'] = query.category;
  if (query.subject) p['subject'] = query.subject;
  if (query.room) p['room'] = query.room;
  if (query.wall) p['wall'] = query.wall;
  if (query.shelf) p['shelf'] = query.shelf;
  const rows = query.rows.filter(r => r.field && clean(r.value));
  if (rows.length) p['f'] = rows.map(r => `${r.field}:${clean(r.value)}`);
  if (query.page > 1) p['page'] = String(query.page);
  if (query.dir === 'desc') p['dir'] = 'desc';
  if (query.sort === 'recent') p['sort'] = 'recent';
  if (query.view === 'grid') p['view'] = 'grid';
  return p;
}

/** The conditions that are ANDed by the API, in a stable order. */
export function toFilters(query: BookQuery): FilterRow[] {
  const filters: FilterRow[] = [];
  if (query.q) filters.push({ field: 'all', value: query.q });
  if (query.category) filters.push({ field: 'categoryId', value: query.category });
  if (query.subject) filters.push({ field: 'subjectId', value: query.subject });
  if (query.room) filters.push({ field: 'roomExact', value: query.room });
  if (query.wall) filters.push({ field: 'wallExact', value: query.wall });
  if (query.shelf) filters.push({ field: 'shelfExact', value: query.shelf });
  for (const row of query.rows) {
    const value = clean(row.value);
    if (row.field && value) filters.push({ field: row.field, value });
  }
  return filters;
}

export interface ApiArgs {
  query: string;
  searchTerm: string;
  sortDirection: 'asc' | 'desc';
  sort: '' | 'recent';
}

/** Arguments for GET /books (and the two exports, which accept the same query/searchTerm). */
export function toApiArgs(query: BookQuery): ApiArgs {
  const filters = toFilters(query);
  const base = { sortDirection: query.dir, sort: query.sort };
  if (!filters.length) return { query: '', searchTerm: '', ...base };
  if (filters.length === 1 && filters[0].field === 'all') return { query: '', searchTerm: filters[0].value, ...base };
  return { query: 'advanced', searchTerm: JSON.stringify(filters), ...base };
}

/** Everything that changes the result set (not the view). Used to skip duplicate requests. */
export function resultKey(query: BookQuery): string {
  return JSON.stringify([toFilters(query), query.page, query.dir, query.sort]);
}

/** True when anything narrows the results (used for "مسح الكل" and the no-results message). */
export function hasFilters(query: BookQuery): boolean {
  return toFilters(query).length > 0;
}

/** A copy with changes applied; any change other than page/view returns to page 1. */
export function withChanges(query: BookQuery, changes: Partial<BookQuery>): BookQuery {
  const next: BookQuery = { ...query, ...changes, rows: changes.rows ?? [...query.rows] };
  const onlyPaging = Object.keys(changes).every(k => k === 'page' || k === 'view');
  if (!onlyPaging && changes.page === undefined) next.page = 1;
  // A subject belongs to a category; choosing another category clears the subject.
  if (changes.category !== undefined && changes.category !== query.category && changes.subject === undefined) next.subject = '';
  // A wall belongs to a room; changing the room clears wall and shelf.
  if (changes.room !== undefined && changes.room !== query.room) {
    if (changes.wall === undefined) next.wall = '';
    if (changes.shelf === undefined) next.shelf = '';
  }
  return next;
}
