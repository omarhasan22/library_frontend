import {
  DEFAULT_QUERY, decodeLegacyFilters, hasFilters, parseBookQuery, parseRow, resolveLegacy, resultKey,
  toApiArgs, toQueryParams, withChanges
} from './book-query';

const CAT_ID = '687d7bab347eb6bd32cd221d';
const SUB_ID = '68b9da6cb24a7d17226b879f';
const lookup = {
  categories: [
    { _id: CAT_ID, title: 'ركن اللغة العربية وعلومها' },
    { _id: '687d7bab347eb6bd32cd2299', title: 'ركن اللغة العربية وعلومها - معاجم ومصطلحات' }
  ],
  subjects: [{ _id: SUB_ID, title: 'السيرة النبوية' }]
};
// What the previous book list wrote into ?filters=
const legacyEncode = (rows: unknown) => btoa(unescape(encodeURIComponent(JSON.stringify(rows))));

describe('book-query', () => {
  describe('parseBookQuery (current format)', () => {
    it('reads every parameter', () => {
      const { query, isLegacy } = parseBookQuery({
        q: '  الفقه  ', category: CAT_ID, subject: SUB_ID, room: '3', wall: 'د', shelf: '1',
        f: ['authors:ابن تيمية', 'notes:a:b'], page: '2', dir: 'desc', sort: 'recent', view: 'grid'
      });
      expect(isLegacy).toBeFalse();
      expect(query).toEqual({
        q: 'الفقه', category: CAT_ID, subject: SUB_ID, room: '3', wall: 'د', shelf: '1',
        rows: [{ field: 'authors', value: 'ابن تيمية' }, { field: 'notes', value: 'a:b' }],
        page: 2, dir: 'desc', sort: 'recent', view: 'grid'
      });
    });

    it('falls back to defaults for missing or invalid values', () => {
      const { query } = parseBookQuery({ page: '0', dir: 'sideways', view: 'list', f: ['nocolon', ':x', 'title:'] });
      expect(query).toEqual({ ...DEFAULT_QUERY, rows: [] });
    });

    it('accepts Arabic-Indic page numbers', () => {
      expect(parseBookQuery({ page: '١٢' }).query.page).toBe(12);
    });
  });

  describe('legacy links', () => {
    it('?search= becomes q', () => {
      const parsed = parseBookQuery({ search: 'السيرة' });
      expect(parsed.query.q).toBe('السيرة');
      expect(parsed.isLegacy).toBeTrue();
    });

    it('?category=<title> (categories page) is resolved by exact title, not substring', () => {
      const parsed = parseBookQuery({ category: 'ركن اللغة العربية وعلومها', categoryTitle: 'x' });
      expect(parsed.query.category).toBe('');
      expect(parsed.legacy.categoryTitles).toEqual(['ركن اللغة العربية وعلومها']);
      const resolved = resolveLegacy(parsed.query, parsed.legacy, lookup);
      expect(resolved.category).toBe(CAT_ID);
      expect(resolved.rows).toEqual([]);
    });

    it('?category=<id> (home page) is used as is', () => {
      const parsed = parseBookQuery({ category: CAT_ID, subject: SUB_ID });
      expect(parsed.isLegacy).toBeFalse();
      expect(parsed.query.category).toBe(CAT_ID);
      expect(parsed.query.subject).toBe(SUB_ID);
    });

    it('?subjectTitle= resolves to a subject id', () => {
      const parsed = parseBookQuery({ category: CAT_ID, subjectTitle: 'السيره النبويه' }); // normalized match
      expect(resolveLegacy(parsed.query, parsed.legacy, lookup).subject).toBe(SUB_ID);
    });

    it('unknown titles stay as "contains" rows (old behaviour preserved)', () => {
      const parsed = parseBookQuery({ subjectTitle: 'حديث' });
      const resolved = resolveLegacy(parsed.query, parsed.legacy, lookup);
      expect(resolved.subject).toBe('');
      expect(resolved.rows).toEqual([{ field: 'subject', value: 'حديث' }]);
    });

    it('decodes base64 ?filters= (UTF-8)', () => {
      const encoded = legacyEncode([
        { field: 'all', value: 'شرح' },
        { field: 'category', value: 'ركن اللغة العربية وعلومها' },
        { field: 'authors', value: 'ابن' },
        { field: 'title', value: '   ' }
      ]);
      const parsed = parseBookQuery({ filters: encoded, page: '3' });
      expect(parsed.isLegacy).toBeTrue();
      expect(parsed.query.q).toBe('شرح');
      expect(parsed.query.page).toBe(3);
      expect(parsed.query.rows).toEqual([{ field: 'authors', value: 'ابن' }]);
      expect(resolveLegacy(parsed.query, parsed.legacy, lookup).category).toBe(CAT_ID);
    });

    it('ignores corrupt base64', () => {
      expect(decodeLegacyFilters('%%%not-base64')).toEqual([]);
      expect(decodeLegacyFilters(btoa('not json'))).toEqual([]);
    });
  });

  describe('toApiArgs (mapping onto GET /books)', () => {
    it('no filters -> plain listing', () => {
      expect(toApiArgs(DEFAULT_QUERY)).toEqual({ query: '', searchTerm: '', sortDirection: 'asc', sort: '' });
    });

    it('only free text -> simple search', () => {
      expect(toApiArgs({ ...DEFAULT_QUERY, q: 'الفقه' }).searchTerm).toBe('الفقه');
      expect(toApiArgs({ ...DEFAULT_QUERY, q: 'الفقه' }).query).toBe('');
    });

    it('anything else -> advanced JSON with exact id/location fields', () => {
      const args = toApiArgs({
        ...DEFAULT_QUERY, q: 'شرح', category: CAT_ID, room: '11', shelf: '2',
        rows: [{ field: 'authors', value: 'ابن' }], dir: 'desc'
      });
      expect(args.query).toBe('advanced');
      expect(args.sortDirection).toBe('desc');
      expect(JSON.parse(args.searchTerm)).toEqual([
        { field: 'all', value: 'شرح' },
        { field: 'categoryId', value: CAT_ID },
        { field: 'roomExact', value: '11' },
        { field: 'shelfExact', value: '2' },
        { field: 'authors', value: 'ابن' }
      ]);
    });

    it('passes sort=recent through', () => {
      expect(toApiArgs({ ...DEFAULT_QUERY, sort: 'recent' }).sort).toBe('recent');
    });
  });

  describe('toQueryParams', () => {
    it('omits defaults and round-trips', () => {
      expect(toQueryParams(DEFAULT_QUERY)).toEqual({});
      const q = { ...DEFAULT_QUERY, q: 'x', subject: SUB_ID, rows: [{ field: 'notes', value: 'a:b' }], page: 4, view: 'grid' as const };
      const params = toQueryParams(q);
      expect(params).toEqual({ q: 'x', subject: SUB_ID, f: ['notes:a:b'], page: '4', view: 'grid' });
      expect(parseBookQuery(params).query).toEqual(q);
    });
  });

  describe('withChanges', () => {
    const base = { ...DEFAULT_QUERY, category: CAT_ID, subject: SUB_ID, room: '3', wall: 'د', shelf: '1', page: 5 };

    it('filter changes go back to page 1; paging and view do not', () => {
      expect(withChanges(base, { q: 'x' }).page).toBe(1);
      expect(withChanges(base, { page: 6 }).page).toBe(6);
      expect(withChanges(base, { view: 'grid' }).page).toBe(5);
    });

    it('changing the category clears the subject', () => {
      expect(withChanges(base, { category: 'other' }).subject).toBe('');
      expect(withChanges(base, { category: CAT_ID }).subject).toBe(SUB_ID);
    });

    it('changing the room clears wall and shelf', () => {
      const next = withChanges(base, { room: '4' });
      expect([next.wall, next.shelf]).toEqual(['', '']);
    });
  });

  it('resultKey ignores the view; hasFilters sees any condition', () => {
    expect(resultKey({ ...DEFAULT_QUERY, view: 'grid' })).toBe(resultKey(DEFAULT_QUERY));
    expect(hasFilters(DEFAULT_QUERY)).toBeFalse();
    expect(hasFilters({ ...DEFAULT_QUERY, wall: 'د' })).toBeTrue();
  });

  it('parseRow splits at the first colon only', () => {
    expect(parseRow('title:a: b')).toEqual({ field: 'title', value: 'a: b' });
  });
});
