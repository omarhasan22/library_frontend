import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

export const SITE_NAME = 'مركز المصطفى';

/** Browser tab titles: "<route title> · مركز المصطفى". Pages with dynamic titles (a book) set their own. */
@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  constructor(private readonly title: Title) {
    super();
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const pageTitle = this.buildTitle(snapshot);
    this.title.setTitle(pageTitle ? `${pageTitle} · ${SITE_NAME}` : SITE_NAME);
  }
}

/** For components that know a better title after loading data (e.g. the book's name). */
export function pageTitle(name: string): string {
  return name ? `${name} · ${SITE_NAME}` : SITE_NAME;
}
