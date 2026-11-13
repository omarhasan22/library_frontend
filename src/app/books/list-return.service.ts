import { Injectable } from '@angular/core';

/**
 * Remembers the last book-list URL (with its filters and page) and the book the user opened from it,
 * so the book page can offer "العودة إلى النتائج" and the list can highlight that book on return.
 * Session-scoped: closing the tab forgets it.
 */
@Injectable({ providedIn: 'root' })
export class ListReturnService {
  private static readonly URL_KEY = 'books.lastListUrl';
  private static readonly BOOK_KEY = 'books.lastViewedId';

  rememberList(url: string): void {
    this.set(ListReturnService.URL_KEY, url);
  }

  lastListUrl(): string | null {
    return this.get(ListReturnService.URL_KEY);
  }

  rememberBook(id: string): void {
    this.set(ListReturnService.BOOK_KEY, id);
  }

  /** Returns the remembered book once, then forgets it. */
  takeLastBook(): string | null {
    const id = this.get(ListReturnService.BOOK_KEY);
    if (id) this.remove(ListReturnService.BOOK_KEY);
    return id;
  }

  private get(key: string): string | null {
    try { return sessionStorage.getItem(key); } catch { return null; }
  }

  private set(key: string, value: string): void {
    try { sessionStorage.setItem(key, value); } catch { /* storage unavailable: feature degrades silently */ }
  }

  private remove(key: string): void {
    try { sessionStorage.removeItem(key); } catch { /* ignore */ }
  }
}
