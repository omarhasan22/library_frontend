import { arCount, joinNames, normalizeArabic, parseArabicInt, toLatinDigits } from './arabic';

describe('arabic utils', () => {
  it('arCount follows Arabic plural rules (on n % 100)', () => {
    expect(arCount(0, 'book')).toBe('لا توجد كتب');
    expect(arCount(1, 'book')).toBe('كتاب واحد');
    expect(arCount(2, 'book')).toBe('كتابان');
    expect(arCount(5, 'book')).toBe('5 كتب');
    expect(arCount(762, 'book')).toBe('762 كتاباً');
    expect(arCount(806, 'book')).toBe('806 كتب');
    expect(arCount(100, 'book')).toBe('100 كتاب');
    expect(arCount(5642, 'book')).toBe('5,642 كتاباً');
    expect(arCount(21, 'subject')).toBe('21 موضوعاً');
  });

  it('normalizeArabic matches the backend normalizer', () => {
    expect(normalizeArabic('  السِّيرةُ   النبويّة ')).toBe('السيره النبويه');
    expect(normalizeArabic('إسلام آداب أصول')).toBe('اسلام اداب اصول');
    expect(normalizeArabic('مسائل')).toBe('مسايل');
  });

  it('digits', () => {
    expect(toLatinDigits('١١')).toBe('11');
    expect(parseArabicInt('١٢')).toBe(12);
    expect(parseArabicInt('x')).toBeNaN();
  });

  it('joinNames uses the Arabic comma', () => {
    expect(joinNames([{ name: 'أ' }, { title: 'ب' }, 'ج', { name: '' }])).toBe('أ، ب، ج');
    expect(joinNames([], '—')).toBe('—');
  });
});
