/**
 * Arabic text helpers shared by the whole app.
 * normalizeArabic mirrors the backend's normalizeArabicText (library_backend/utils/text.js), so
 * client-side matching (autocomplete, category search) agrees with server-side search.
 */

export function normalizeArabic(text: unknown): string {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/[ً-ْٰـ]/g, '') // diacritics, superscript alef, tatweel
    .replace(/[آأإا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[ٕٔ]/g, '')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ء/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN = '۰۱۲۳۴۵۶۷۸۹';

/** "١٢" -> "12" (also Persian digits). Location values were typed with both digit systems. */
export function toLatinDigits(value: unknown): string {
  return String(value ?? '').replace(/[٠-٩۰-۹]/g, d => {
    const i = ARABIC_INDIC.indexOf(d);
    return String(i >= 0 ? i : PERSIAN.indexOf(d));
  });
}

/** parseInt that understands Arabic-Indic digits: parseArabicInt('١٢') === 12. NaN when not a number. */
export function parseArabicInt(value: unknown): number {
  return parseInt(toLatinDigits(value).trim(), 10);
}

/** Joins names with the Arabic comma. Accepts strings or { name } / { title } objects. */
export function joinNames(items: unknown, empty = ''): string {
  if (!Array.isArray(items) || !items.length) return empty;
  const names = items
    .map(item => (typeof item === 'string' ? item : (item as any)?.name ?? (item as any)?.title ?? ''))
    .map(name => String(name).trim())
    .filter(Boolean);
  return names.length ? names.join('، ') : empty;
}

/** 5642 -> "5,642" (Latin digits, as used across the catalogue). */
export function formatNumber(n: number | null | undefined): string {
  return Number(n ?? 0).toLocaleString('en-US');
}

/**
 * Arabic count phrases following CLDR plural rules:
 *   1 -> "كتاب واحد", 2 -> "كتابان", 3–10 -> "5 كتب", 11–99 -> "762 كتاباً", 100+ (other) -> "100 كتاب".
 * The rule applies to n % 100, so 806 -> "806 كتب" and 1240 -> "1,240 كتاباً".
 */
export interface ArNoun { one: string; two: string; few: string; many: string; zero?: string; }

export const AR_NOUNS: Record<string, ArNoun> = {
  book: { one: 'كتاب واحد', two: 'كتابان', few: 'كتب', many: 'كتاباً', zero: 'لا توجد كتب' },
  subject: { one: 'موضوع واحد', two: 'موضوعان', few: 'مواضيع', many: 'موضوعاً', zero: 'لا مواضيع' },
  category: { one: 'قسم واحد', two: 'قسمان', few: 'أقسام', many: 'قسماً', zero: 'لا أقسام' },
  author: { one: 'مؤلف واحد', two: 'مؤلفان', few: 'مؤلفين', many: 'مؤلفاً', zero: 'لا مؤلفين' },
  publisher: { one: 'ناشر واحد', two: 'ناشران', few: 'ناشرين', many: 'ناشراً', zero: 'لا ناشرين' },
  result: { one: 'نتيجة واحدة', two: 'نتيجتان', few: 'نتائج', many: 'نتيجة', zero: 'لا نتائج' },
  day: { one: 'يوم واحد', two: 'يومان', few: 'أيام', many: 'يوماً', zero: '0 يوم' },
  page: { one: 'صفحة واحدة', two: 'صفحتان', few: 'صفحات', many: 'صفحة', zero: '0 صفحة' }
};

/** The singular used for "other" (100, 1000, ...): "100 كتاب". */
const AR_SINGULAR: Record<string, string> = {
  book: 'كتاب', subject: 'موضوع', category: 'قسم', author: 'مؤلف', publisher: 'ناشر',
  result: 'نتيجة', day: 'يوم', page: 'صفحة'
};

export function arCount(n: number | null | undefined, noun: keyof typeof AR_NOUNS | ArNoun): string {
  const value = Math.max(0, Math.floor(Number(n ?? 0)));
  const forms = typeof noun === 'string' ? AR_NOUNS[noun] : noun;
  const singular = typeof noun === 'string' ? AR_SINGULAR[noun] : forms.one;
  if (!forms) return formatNumber(value);
  if (value === 0) return forms.zero ?? `0 ${singular}`;
  if (value === 1) return forms.one;
  if (value === 2) return forms.two;
  const mod = value % 100;
  const num = formatNumber(value);
  if (mod >= 3 && mod <= 10) return `${num} ${forms.few}`;
  if (mod >= 11 && mod <= 99) return `${num} ${forms.many}`;
  return `${num} ${singular}`;
}
